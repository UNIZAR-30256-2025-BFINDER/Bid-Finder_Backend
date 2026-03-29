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
    async function runSeeding(days = 3) {
        logger.info(`[Seeding Controller] Iniciando descarga histórica de los últimos ${days} días...`);
        logger.info(`\n======================================================`);
        
        let currentDate = new Date();

        for (let i = 0; i < days; i++) {
            logger.info(`[Seeding Controller] Procesando día: ${currentDate.toISOString().split('T')[0]} (${i + 1}/${days})`);
            logger.info(`======================================================`);

            try {
                await ingestionController.runDailyIngestion(currentDate);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                     logger.info(`[Seeding Controller] Día sin publicación saltado.`);
                } else {
                     throw error;
                }
            }

            currentDate.setDate(currentDate.getDate() - 1);
            logger.info(`\n======================================================`);
        }
    }

    return { runSeeding };
}

module.exports = createSeedingController;