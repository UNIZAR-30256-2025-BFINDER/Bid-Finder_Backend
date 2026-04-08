/**
 * @fileoverview Worker encargado de vaciar la cola de subastas PENDIENTES,
 * enviándolas a la Inteligencia Artificial respetando los Rate Limits.
 *
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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {{ subastasRepository, aiService, logger }} deps
 */
async function runWorker(deps) {
    const { subastasRepository, aiService, logger } = deps;

    logger.info("[AI Worker] Iniciando procesamiento de la cola...");
    await connectDB();

    const pendientes = await subastasRepository.findPendingAI(BATCH_SIZE);

    if (pendientes.length === 0) {
        logger.info("[AI Worker] Cola vacía. No hay subastas pendientes.");
        return 0;
    }

    logger.info(
        `[AI Worker] Se han encontrado ${pendientes.length} subastas pendientes. Procesando...`,
    );

    // Geocoding dependencies
    const { createGeoCodingService } = require("../services/geoCodingService");
    const axios = require("axios");
    const https = require("https");
    const httpsAgent = new https.Agent({ keepAlive: true });
    const httpClient = axios.create({ httpsAgent, timeout: 10000 });
    const geoCodingService = createGeoCodingService(httpClient);

    for (let i = 0; i < pendientes.length; i++) {
        const subasta = pendientes[i];
        logger.info(
            `[AI Worker] (${i + 1}/${pendientes.length}) Analizando ${subasta.id}...`,
        );

        try {
            const datosExtraidos = await aiService.extraerDatosSubasta(
                subasta.texto,
                SUBASTA_EXTRACTION_PROMPT,
            );

            const diferencia_porcentual_oportunidad =
                calcularDiferenciaPorcentual(
                    datosExtraidos.precio_salida,
                    datosExtraidos.valor_tasacion,
                );

            const nivel_oportunidad = calcularNivelOportunidad(
                datosExtraidos.precio_salida,
                datosExtraidos.valor_tasacion,
            );

            // Geocoding justo después de la IA
            let direccion = datosExtraidos.direccion || "";
            let zona = datosExtraidos.zona || "";
            let municipio = "";

            if (direccion && zona) {
                municipio = zona;
            } else if (!direccion && zona) {
                municipio = zona;
            } else if (subasta.texto) {
                const municipioMatch =
                    subasta.texto.match(/en ([A-ZÁÉÍÓÚÑa-záéíóúñ ]+)[.,]/i) ||
                    subasta.texto.match(
                        /([A-ZÁÉÍÓÚÑa-záéíóúñ ]+), \d{1,2} de /i,
                    );

                if (municipioMatch) {
                    municipio = municipioMatch[1].trim();
                }
            }

            logger.info(
                `[GeoCoding][DEBUG] Subasta ${subasta.id} dirección: "${direccion}" zona: "${zona}" municipio/localidad: "${municipio}"`,
            );

            const geoResult = await geoCodingService.getCoordinatesFromAddress(
                direccion,
                municipio,
            );

            logger.info(
                `[GeoCoding] Subasta ${subasta.id} dirección: "${direccion}" municipio: "${municipio}" resultado: ${geoResult.geojson ? "OK" : "NO"} fallback: ${geoResult.fallbackUsed}`,
            );

            await subastasRepository.updateAIExtraction(
                subasta.id,
                {
                    titulo_resumido: datosExtraidos.titulo_resumido ?? null,
                    resumen: datosExtraidos.resumen ?? null,
                    precio_salida: datosExtraidos.precio_salida ?? null,
                    valor_tasacion: datosExtraidos.valor_tasacion ?? null,
                    diferencia_porcentual_oportunidad,
                    nivel_oportunidad,
                    direccion: datosExtraidos.direccion ?? null,
                    zona: datosExtraidos.zona ?? null,
                    referencia_catastral:
                        datosExtraidos.referencia_catastral ?? null,
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
                logger.warn(
                    "[AI Worker] Límite de cuota alcanzado. Deteniendo el worker hasta la próxima ejecución.",
                );
                break;
            }

            logger.error(
                `[AI Worker] Error procesando ${subasta.id}: ${errMsg}`,
            );
            await subastasRepository.updateAIExtraction(
                subasta.id,
                {},
                "ERROR",
            );
        }
    }

    logger.info("[AI Worker] Tareas finalizadas por ahora.");
    return 0;
}

/**
 * Determina si el error es de cuota/rate-limit.
 * Centralizado aquí para no repetir el string-matching en otros sitios.
 * @param {string} message
 */
function isQuotaError(message) {
    return (
        message.includes("429") ||
        message.includes("Quota") ||
        message.includes("Too Many Requests") ||
        message.includes("Fallo en todos los proveedores")
    );
}

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
