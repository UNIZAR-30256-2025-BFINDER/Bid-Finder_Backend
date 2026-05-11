/**
 * @fileoverview Orquestador del pipeline diario completo.
 * Coordina la ejecución secuencial: Ingesta del BOE -> Análisis de IA y Geocoding.
 * Diseñado para ser el único punto de entrada de la tarea Cron.
 */

const { runIngestion, isNoPublicationError } = require('./boeIngestionJob');
const { runWorker }                          = require('./aiWorkerJob');
const buildContainer                         = require('../config/container');

/**
 * Enlaza y controla el flujo completo de obtención y enriquecimiento de datos.
 * Asegura que el Worker de IA no arranque si la ingesta falla críticamente.
 * @param {Date} [executionDate=new Date()] - Fecha a procesar.
 * @returns {Promise<number>} Código de salida del sistema.
 */
async function runDailyPipeline(executionDate = new Date()) {
    const deps = buildContainer();
    const { logger } = deps;

    try {
        await runIngestion(deps, executionDate);
        logger.info('Ingesta OK. Arrancando AI Worker...');

        await runWorker(deps);
        logger.info('Pipeline diario completo (Ingesta + IA) finalizado.');
        return 0;

    } catch (error) {
        if (isNoPublicationError(error)) {
            logger.info(`No se encontró publicación. Motivo: ${error.message || error}`);
            return 0;
        }
        logger.error('Error crítico en el pipeline diario:', error);
        return 1;
    }
}

// Ejecución directa si se invoca desde CLI
if (require.main === module) {
    runDailyPipeline().then(process.exit);
}

module.exports = { runDailyPipeline };