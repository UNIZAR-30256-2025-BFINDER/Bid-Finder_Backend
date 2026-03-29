/**
 * @fileoverview Script ejecutable desde terminal para poblar la base de datos con históricos.
 */

const axios = require('axios');
const https = require('https');
const { BOE, INGESTION } = require('../config/constants');
const logger = require('../utils/logger');
const subastasRules = require('../config/subastasRules');

const connectDB = require('../config/database');
const createSubastasRepository = require('../repositories/subastasRepository');

const xmlParserService = require('../services/xmlParserService');
const createBoeService = require('../services/boeHttpService');
const createIngestionController = require('../controllers/ingestionController');
const createSeedingController = require('../controllers/seedingController');

const { runWorker } = require('./aiWorkerJob'); 

const httpsAgent = new https.Agent({ keepAlive: true });
const httpClient = axios.create({ httpsAgent, timeout: BOE.TIMEOUT_MS });
const boeService = createBoeService(httpClient, BOE, logger);

const subastasRepository = createSubastasRepository();

const ingestionController = createIngestionController(
    boeService,
    xmlParserService,
    logger,
    { ...BOE, ...INGESTION },
    subastasRules,
    subastasRepository
);

const seedingController = createSeedingController(ingestionController, logger);

if (require.main === module) {
    const args = process.argv.slice(2);
    const daysToSeed = args.length > 0 ? parseInt(args[0], 10) : 3;

    if (isNaN(daysToSeed) || daysToSeed <= 0) {
        logger.error('[Seeding Job] Error: El parámetro debe ser > 0.');
        process.exit(1);
    }

    connectDB().then(() => {
        return seedingController.runSeeding(daysToSeed);
    }).then(() => {
        logger.info('[Seeding Job] Ingesta histórica finalizada. Arrancando AI Worker para vaciar la cola...');
        return runWorker();
    }).then(() => {
        logger.info('[Seeding Job] Proceso completo (Ingesta + IA) finalizado correctamente.');
        process.exit(0);
    }).catch(err => {
        logger.error(`[Seeding Job] Error crítico: ${err.message}`);
        process.exit(1);
    });
}

module.exports = seedingController;