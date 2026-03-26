/**
 * @fileoverview Script ejecutable desde terminal para poblar la base de datos con históricos.
 */

const axios = require('axios');
const https = require('https');
const { BOE, INGESTION } = require('../config/constants');
const logger = require('../utils/logger');
const subastasRules = require('../config/subastasRules');

const connectDB = require('../config/database');
const { saveSubastas } = require('../services/subastasPersistenceService'); 

const xmlParserService = require('../services/xmlParserService');
const createBoeService = require('../services/boeHttpService');
const createIngestionController = require('../controllers/ingestionController');
const createSeedingController = require('../controllers/seedingController');

const httpsAgent = new https.Agent({ keepAlive: true });
const httpClient = axios.create({ httpsAgent, timeout: BOE.TIMEOUT_MS });
const boeService = createBoeService(httpClient, BOE, logger);

const ingestionController = createIngestionController(
    boeService,
    xmlParserService,
    logger,
    { ...BOE, ...INGESTION },
    subastasRules,
    { saveSubastas }
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
        logger.info('[Seeding Job] Finalizado correctamente.');
        process.exit(0);
    }).catch(err => {
        logger.error(`[Seeding Job] Error crítico: ${err.message}`);
        process.exit(1);
    });
}

module.exports = seedingController;