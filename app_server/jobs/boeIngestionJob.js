/**
 * @fileoverview Tarea de ingesta diaria del BOE.
 * Solo responsable de descargar y persistir subastas.
 */

const connectDB  = require('../config/database');
const logger     = require('../utils/logger');

function isNoPublicationError(error) {
    if (error.response && error.response.status === 404) return true;
    const message = error.message || '';
    return message.includes('no data') || message.includes('No se encontró publicación');
}

function isNonPublicationDay(date) {
    return date.getDay() === 0;
}

/**
 * @param {{ ingestionController, logger }} deps
 * @param {Date} [executionDate]
 */
async function runIngestion(deps, executionDate = new Date()) {
    const { ingestionController, logger } = deps;

    logger.info(`Iniciando tarea de ingesta para fecha: ${executionDate.toISOString()}`);

    if (isNonPublicationDay(executionDate)) {
        logger.info('Domingo. No se espera publicación. Saliendo sin procesar.');
        return 0;
    }

    await connectDB();
    await ingestionController.runDailyIngestion(executionDate);
    logger.info('Ingesta completada con éxito.');
    return 0;
}

if (require.main === module) {
    const buildContainer = require('../config/container');
    const deps = buildContainer();

    runIngestion(deps)
        .then(process.exit)
        .catch(err => {
            logger.error('Error crítico durante la ingesta:', err);
            process.exit(1);
        });
}

module.exports = { runIngestion, isNonPublicationDay, isNoPublicationError };