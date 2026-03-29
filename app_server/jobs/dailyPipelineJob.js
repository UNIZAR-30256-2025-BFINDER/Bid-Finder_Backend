/**
 * @fileoverview Orquestador del pipeline diario completo.
 * Coordina la ingesta del BOE y el procesamiento de IA en secuencia.
 * Es el único punto de entrada para el cron job de producción.
 */

const { runIngestion, isNoPublicationError } = require('./boeIngestionJob');
const { runWorker }                          = require('./aiWorkerJob');
const buildContainer                         = require('../config/container');

/**
 * @param {Date} [executionDate]
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

if (require.main === module) {
    runDailyPipeline().then(process.exit);
}

module.exports = { runDailyPipeline };