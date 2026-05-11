/**
 * @fileoverview Proceso en segundo plano responsable de procesar la cola de subastas.
 * Extrae subastas 'PENDIENTES', las envía a los LLMs, ejecuta geocodificación
 * y actualiza la base de datos controlando límites de cuota.
 */

const connectDB = require("../config/database");
const { SUBASTA_EXTRACTION_PROMPT } = require("../config/aiPrompts");
const { AI_WORKER } = require("../config/constants");
const {
    calcularDiferenciaPorcentual,
    calcularNivelOportunidad,
} = require("../utils/oportunidadCalculator");

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
        logger.info("[AI Worker] Cola vacía. No hay subastas pendientes.");
        return 0;
    }

    logger.info(`[AI Worker] Se han encontrado ${pendientes.length} subastas pendientes. Procesando...`);

    for (let i = 0; i < pendientes.length; i++) {
        const subasta = pendientes[i];
        logger.info(`[AI Worker] (${i + 1}/${pendientes.length}) Analizando ${subasta.id}...`);

        try {
            const datosExtraidos = await aiService.extraerDatosSubasta(
                subasta.texto,
                SUBASTA_EXTRACTION_PROMPT,
            );

            const diferencia_porcentual_oportunidad = calcularDiferenciaPorcentual(
                datosExtraidos.precio_salida,
                datosExtraidos.valor_tasacion,
            );

            const nivel_oportunidad = calcularNivelOportunidad(
                datosExtraidos.precio_salida,
                datosExtraidos.valor_tasacion,
            );

            let direccion = datosExtraidos.direccion || "";
            let municipio = datosExtraidos.zona || ""; 

            if (!municipio && subasta.texto) {
                const municipioMatch =
                    subasta.texto.match(/en ([A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+)[.,]/) ||
                    subasta.texto.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+), \d{1,2} de /);

                if (municipioMatch) {
                    municipio = municipioMatch[1].trim();
                }
            }

            const geoResult = await geoCodingService.getCoordinatesFromAddress(direccion, municipio);

            logger.info(
                `[GeoCoding] Subasta ${subasta.id} dirección: "${direccion}" municipio: "${municipio}" resultado: ${geoResult.geojson ? "OK" : "NO"} fallback: ${geoResult.fallbackUsed}`
            );

            await subastasRepository.updateAIExtraction(
                subasta.id,
                {
                    titulo_resumido: datosExtraidos.titulo_resumido ?? null,
                    resumen: datosExtraidos.resumen ?? null,
                    categoria: datosExtraidos.categoria ?? null,
                    precio_salida: datosExtraidos.precio_salida ?? null,
                    valor_tasacion: datosExtraidos.valor_tasacion ?? null,
                    diferencia_porcentual_oportunidad,
                    nivel_oportunidad,
                    direccion: datosExtraidos.direccion ?? null,
                    zona: datosExtraidos.zona ?? null,
                    referencia_catastral: datosExtraidos.referencia_catastral ?? null,
                    location: geoResult.geojson || null,
                    riesgo_legal: datosExtraidos.riesgo_legal ?? null,
                    ocupantes: datosExtraidos.ocupantes ?? null,
                    cargas_previas: datosExtraidos.cargas_previas ?? null,
                },
                "PROCESADO",
            );

            logger.info(`[AI Worker] ${subasta.id} actualizado correctamente.`);

            if (i < pendientes.length - 1) {
                await sleep(DELAY_MS);
            }
        } catch (error) {
            const errMsg = error.message || "";

            if (isQuotaError(errMsg)) {
                logger.warn("[AI Worker] Límite de cuota alcanzado. Deteniendo el worker hasta la próxima ejecución.");
                break;
            }

            logger.error(`[AI Worker] Error procesando ${subasta.id}: ${errMsg}`);
            await subastasRepository.updateAIExtraction(subasta.id, {}, "ERROR");
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
if (require.main === module) {
    const buildContainer = require("../config/container");
    const deps = buildContainer();

    runWorker(deps)
        .then(process.exit)
        .catch((err) => {
            deps.logger.error(`[AI Worker] Error crítico: ${err.message}`);
            process.exit(1);
        });
}

module.exports = { runWorker, isQuotaError };