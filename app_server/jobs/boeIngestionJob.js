/**
 * @fileoverview Script automatizable para realizar la consulta e ingesta de datos del BOE.
 * Valida la existencia de publicación antes de lanzar peticiones HTTP masivas.
 */

const connectDB  = require('../config/database');

/**
 * Evalúa si el error corresponde a una falta de publicación por parte del estado.
 * @param {Error} error - Objeto de error HTTP.
 * @returns {boolean} True si es un 404 natural o mensaje semántico asociado.
 */
function isNoPublicationError(error) {
    if (error.response && error.response.status === 404) return true;
    const message = error.message || '';
    return message.includes('no data') || message.includes('No se encontró publicación');
}

/**
 * Chequea reglas lógicas temporales (el BOE habitualmente no publica en domingo).
 * @param {Date} date - Fecha de evaluación.
 * @returns {boolean} True si es domingo.
 */
function isNonPublicationDay(date) {
    return date.getDay() === 0; // 0 equivale a Domingo
}

/**
 * Ejecuta el controlador diario de ingesta conectándose previamente a la base de datos.
 * @param {Object} deps - Contenedor con dependencias inyectadas.
 * @param {Date} [executionDate=new Date()] - Fecha objetivo de la ingesta.
 * @returns {Promise<number>} Código de salida (0 éxito).
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

// Ejecución directa si se invoca desde CLI
if (require.main === module) {
    const buildContainer = require('../config/container');
    const deps = buildContainer();

    runIngestion(deps)
        .then(process.exit)
        .catch(err => {
            deps.logger.error('Error crítico durante la ingesta:', err);
            process.exit(1);
        });
}

module.exports = { runIngestion, isNonPublicationDay, isNoPublicationError };