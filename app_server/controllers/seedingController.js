/**
 * @fileoverview Controlador para la ingesta histórica (Seeding).
 * Orquesta la ejecución del controlador diario sobre un rango de fechas.
 */

/**
 * Crea una instancia del controlador de seeding.
 * @param {Object} ingestionController - El controlador diario ya instanciado.
 * @param {Object} logger - Sistema de logs.
 * @returns {Object} Controlador con el método de ejecución histórica.
 */
function createSeedingController(ingestionController, logger) {
    
    /**
     * Ejecuta la ingesta para los últimos N días de forma secuencial.
     * @param {number} daysToSeed - Cantidad de días hacia atrás a procesar.
     * @returns {Promise<void>}
     */
    async function runSeeding(daysToSeed) {
        logger.info(`[Seeding Controller] Iniciando descarga histórica de los últimos ${daysToSeed} días...`);

        for (let i = 0; i < daysToSeed; i++) {
            // Calculamos la fecha restando 'i' días a la fecha actual
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);
            
            // Formateamos para el log (YYYY-MM-DD)
            const dateString = targetDate.toISOString().split('T')[0];
            
            logger.info(`\n======================================================`);
            logger.info(`[Seeding Controller] Procesando día: ${dateString} (${i + 1}/${daysToSeed})`);
            logger.info(`======================================================`);

            // Le pasamos la fecha calculada al controlador que ya teníamos
            const success = await ingestionController.runDailyIngestion(targetDate);

            if (!success) {
                logger.error(`[Seeding Controller] Advertencia: El proceso devolvió error para el día ${dateString}.`);
            }
        }

        logger.info(`\n[Seeding Controller] Proceso de ingesta histórica finalizado con éxito.`);
    }

    return { runSeeding };
}

module.exports = createSeedingController;