/**
 * @fileoverview Script ejecutable desde terminal para poblar la base de datos con datos históricos.
 * Uso: node app_server/jobs/seedingJob.js <numero_de_dias>
 */

const axios = require('axios');
const https = require('https');
const { BOE, INGESTION } = require('../config/constants');
const logger = require('../utils/logger');
const subastasRules = require('../config/subastasRules');

const xmlParserService = require('../services/xmlParserService');
const createBoeService = require('../services/boeHttpService');
const createIngestionController = require('../controllers/ingestionController');
const createSeedingController = require('../controllers/seedingController');

const httpsAgent = new https.Agent({ keepAlive: true });
const httpClient = axios.create({
    httpsAgent,
    timeout: BOE.TIMEOUT_MS
});

const boeService = createBoeService(httpClient, BOE, logger);

const ingestionController = createIngestionController(
    boeService,
    xmlParserService,
    logger,
    { ...BOE, ...INGESTION },
    subastasRules
);

const seedingController = createSeedingController(ingestionController, logger);

if (require.main === module) {
    const args = process.argv.slice(2);
    
    const daysToSeed = args.length > 0 ? parseInt(args[0], 10) : 3;

    if (isNaN(daysToSeed) || daysToSeed <= 0) {
        logger.error('[Seeding Job] Error: El parámetro de días debe ser un número entero mayor que 0.');
        process.exit(1);
    }

    seedingController.runSeeding(daysToSeed).then(() => {
        process.exit(0);
    }).catch(err => {
        logger.error(`[Seeding Job] Error crítico no controlado: ${err.message}`);
        process.exit(1);
    });
}

module.exports = seedingController;