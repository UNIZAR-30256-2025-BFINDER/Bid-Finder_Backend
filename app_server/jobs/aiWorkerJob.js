/**
 * @fileoverview Worker encargado de vaciar la cola de subastas PENDIENTES,
 * enviándolas a la Inteligencia Artificial respetando los Rate Limits.
 *
 */

const connectDB = require('../config/database');
const { SUBASTA_EXTRACTION_PROMPT } = require('../config/aiPrompts');
const { AI_WORKER } = require('../config/constants');

const BATCH_SIZE = AI_WORKER.BATCH_SIZE;
const DELAY_MS   = AI_WORKER.DELAY_MS;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {{ subastasRepository, aiService, logger }} deps
 */
async function runWorker(deps) {
    const { subastasRepository, aiService, logger } = deps;

    logger.info('[AI Worker] Iniciando procesamiento de la cola...');
    await connectDB();

    const pendientes = await subastasRepository.findPendingAI(BATCH_SIZE);

    if (pendientes.length === 0) {
        logger.info('[AI Worker] Cola vacía. No hay subastas pendientes.');
        return 0;
    }

    logger.info(`[AI Worker] Se han encontrado ${pendientes.length} subastas pendientes. Procesando...`);

    for (let i = 0; i < pendientes.length; i++) {
        const subasta = pendientes[i];
        logger.info(`[AI Worker] (${i + 1}/${pendientes.length}) Analizando ${subasta.id}...`);

        try {
            const datosExtraidos = await aiService.extraerDatosSubasta(
                subasta.texto,
                SUBASTA_EXTRACTION_PROMPT
            );

            await subastasRepository.updateAIExtraction(subasta.id, {
                titulo_resumido:     datosExtraidos.titulo_resumido     ?? null,
                resumen:             datosExtraidos.resumen             ?? null,
                precio_salida:       datosExtraidos.precio_salida       ?? null,
                valor_tasacion:      datosExtraidos.valor_tasacion      ?? null,
                direccion:           datosExtraidos.direccion           ?? null,
                referencia_catastral: datosExtraidos.referencia_catastral ?? null,
            }, 'PROCESADO');

            logger.info(`[AI Worker] ${subasta.id} actualizado correctamente.`);

            if (i < pendientes.length - 1) {
                await sleep(DELAY_MS);
            }

        } catch (error) {
            const errMsg = error.message || '';

            if (isQuotaError(errMsg)) {
                logger.warn('[AI Worker] Límite de cuota alcanzado. Deteniendo el worker hasta la próxima ejecución.');
                break;
            }

            logger.error(`[AI Worker] Error procesando ${subasta.id}: ${errMsg}`);
            await subastasRepository.updateAIExtraction(subasta.id, {}, 'ERROR');
        }
    }

    logger.info('[AI Worker] Tareas finalizadas por ahora.');
    return 0;
}

/**
 * Determina si el error es de cuota/rate-limit.
 * Centralizado aquí para no repetir el string-matching en otros sitios.
 * @param {string} message
 */
function isQuotaError(message) {
    return (
        message.includes('429') ||
        message.includes('Quota') ||
        message.includes('Too Many Requests') ||
        message.includes('Fallo en todos los proveedores')
    );
}

if (require.main === module) {
    const buildContainer = require('../config/container');
    const deps = buildContainer();

    runWorker(deps)
        .then(process.exit)
        .catch(err => {
            deps.logger.error(`[AI Worker] Error crítico: ${err.message}`);
            process.exit(1);
        });
}

module.exports = { runWorker, isQuotaError };