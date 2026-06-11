/**
 * @fileoverview Proceso en segundo plano responsable de procesar la cola de anuncios de subastas.
 * Extrae anuncios 'PENDIENTES', las envía a los LLMs para obtener un array de subastas individuales,
 * ejecuta geocodificación por cada una y actualiza la base de datos.
 */

const connectDB = require("../config/database");
const { SUBASTA_EXTRACTION_PROMPT } = require("../config/aiPrompts");
const { AI_WORKER } = require("../config/constants");
const {
    calcularDiferenciaPorcentual,
    calcularNivelOportunidad,
    calcularViabilidad,
} = require("../utils/oportunidadCalculator");
const { extractFallbackMunicipio } = require("../utils/textParser");

const BATCH_SIZE = AI_WORKER.BATCH_SIZE;
const DELAY_MS = AI_WORKER.DELAY_MS;

/**
 * Detiene la ejecución asíncrona durante un tiempo determinado.
 * @param {number} ms - Milisegundos de espera.
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Procesa una única subasta individual: calcula oportunidad y geocodifica la dirección.
 * @param {Object} subastaItem - Datos de la subasta individual extraídos por la IA.
 * @param {string} textoAnuncio - Texto completo del anuncio (para extraer municipio como fallback).
 * @param {Object} geoCodingService - Servicio de geocodificación.
 * @param {Object} logger - Logger.
 * @param {string} anuncioId - ID del anuncio para logging.
 * @returns {Promise<Object>} Subasta enriquecida con coordenadas y oportunidad.
 */
async function procesarSubasta(subastaItem, textoAnuncio, geoCodingService, logger, anuncioId) {
    const diferencia_porcentual_oportunidad = calcularDiferenciaPorcentual(
        subastaItem.precio_salida,
        subastaItem.valor_tasacion,
    );

    const nivel_oportunidad = calcularNivelOportunidad(
        subastaItem.precio_salida,
        subastaItem.valor_tasacion,
    );

    const viabilidad = calcularViabilidad(
        nivel_oportunidad,
        subastaItem.riesgo_legal
    );

    let direccion = subastaItem.direccion || "";
    let municipio = subastaItem.zona || extractFallbackMunicipio(textoAnuncio) || "";

    const geoResult = await geoCodingService.getCoordinatesFromAddress(direccion, municipio);

    logger.info(
        `[GeoCoding] Anuncio ${anuncioId} Lote/Subasta ${subastaItem.numero_lote} dirección: "${direccion}" municipio: "${municipio}" resultado: ${geoResult.geojson ? "OK" : "NO"} fallback: ${geoResult.fallbackUsed}`
    );

    return {
        ...subastaItem,
        diferencia_porcentual_oportunidad,
        nivel_oportunidad,
        viabilidad,
        location: geoResult.geojson || null,
    };
}

/**
 * Ejecuta el lote de procesamiento de IA y Geocoding.
 * @param {Object} deps - Contenedor de dependencias (repositorio, servicios, logger).
 * @returns {Promise<number>} Código de salida (0 éxito).
 */
async function runWorker(deps) {
    const { subastasRepository, aiService, logger, geoCodingService } = deps;

    logger.info("[AI Worker] Iniciando procesamiento de la cola...");
    await connectDB();

    const pendientes = await subastasRepository.findPendingAI(BATCH_SIZE);

    if (pendientes.length === 0) {
        logger.info("[AI Worker] Cola vacía. No hay anuncios de subastas pendientes.");
        return 0;
    }

    logger.info(`[AI Worker] Se han encontrado ${pendientes.length} anuncios pendientes. Procesando...`);

    for (let i = 0; i < pendientes.length; i++) {
        const anuncio = pendientes[i];
        logger.info(`[AI Worker] (${i + 1}/${pendientes.length}) Analizando anuncio ${anuncio.id}...`);

        try {
            const datosExtraidos = await aiService.extraerDatosSubasta(
                anuncio.texto,
                SUBASTA_EXTRACTION_PROMPT,
            );

            // datosExtraidos tiene el formato { subastas: [...] } gracias al validador
            const subastasRaw = datosExtraidos.subastas || [];
            logger.info(`[AI Worker] Anuncio ${anuncio.id}: IA detectó ${subastasRaw.length} subasta(s) individuales.`);

            // Procesar cada subasta (geocodificar + calcular oportunidad)
            const subastasProcesadas = [];
            for (const subItem of subastasRaw) {
                const subProcesada = await procesarSubasta(
                    subItem,
                    anuncio.texto,
                    geoCodingService,
                    logger,
                    anuncio.id,
                );
                subastasProcesadas.push(subProcesada);
            }

            await subastasRepository.updateAIExtraction(
                anuncio.id,
                subastasProcesadas,
                "PROCESADO",
            );

            logger.info(`[AI Worker] Anuncio ${anuncio.id} actualizado correctamente con ${subastasProcesadas.length} subasta(s).`);

            if (i < pendientes.length - 1) {
                await sleep(DELAY_MS);
            }
        } catch (error) {
            const errMsg = error.message || "";

            if (isQuotaError(errMsg)) {
                logger.warn("[AI Worker] Límite de cuota alcanzado. Deteniendo el worker hasta la próxima ejecución.");
                break;
            }

            logger.error(`[AI Worker] Error procesando anuncio ${anuncio.id}: ${errMsg}`);
            await subastasRepository.updateAIExtraction(anuncio.id, [], "ERROR");
        }
    }

    logger.info("[AI Worker] Tareas finalizadas por ahora.");
    return 0;
}

/**
 * Determina si el error devuelto por la IA corresponde a un exceso de cuota o rate-limit.
 * @param {string} message - Mensaje de error a evaluar.
 * @returns {boolean} True si es un error de cuota.
 */
function isQuotaError(message) {
    return (
        message.includes("429") ||
        message.includes("Quota") ||
        message.includes("Too Many Requests") ||
        message.includes("Fallo en todos los proveedores")
    );
}

// Ejecución directa si se invoca desde CLI
if (require.main === module || global.__TEST_CLI__) {
    const buildContainer = require("../config/container");
    const deps = buildContainer();

    runWorker(deps)
        .then(process.exit)
        .catch((err) => {
            deps.logger.error(`[AI Worker] Error crítico: ${err.message}`);
            process.exit(1);
        });
}

module.exports = { runWorker, isQuotaError, procesarLote: procesarSubasta };