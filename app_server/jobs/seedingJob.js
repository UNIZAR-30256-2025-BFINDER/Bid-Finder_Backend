/**
 * @fileoverview Tarea ejecutable para poblar la base de datos con históricos.
 * Retrocede 'N' días descargando, almacenando y posteriormente enriqueciendo con IA todo el volumen.
 */

const connectDB = require('../config/database');
const createSeedingController = require('../controllers/seedingController');
const { runWorker } = require('./aiWorkerJob');
const buildContainer = require('../config/container');

const deps = buildContainer();
const seedingController = createSeedingController(deps.ingestionController, deps.logger);

// Recepción y validación de argumentos al ejecutar desde terminal
if (require.main === module || global.__TEST_CLI__) {
    const args = process.argv.slice(2);
    // Por defecto retrocede 3 días si no se especifica
    const daysToSeed = args.length > 0 ? parseInt(args[0], 10) : 3;

    if (isNaN(daysToSeed) || daysToSeed <= 0) {
        deps.logger.error('[Seeding Job] Error: El parámetro debe ser > 0.');
        process.exit(1);
    }

    connectDB().then(() => {
        return seedingController.runSeeding(daysToSeed);
    }).then(() => {
        deps.logger.info('[Seeding Job] Ingesta histórica finalizada. Arrancando AI Worker para vaciar la cola...');
        return runWorker(deps);
    }).then(() => {
        deps.logger.info('[Seeding Job] Proceso completo (Ingesta + IA) finalizado correctamente.');
        process.exit(0);
    }).catch(err => {
        deps.logger.error(`[Seeding Job] Error crítico: ${err.message}`);
        process.exit(1);
    });
}

module.exports = seedingController;