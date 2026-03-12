/**
 * @fileoverview Raíz para la tarea de ingesta, es el cron job
 * Enlaza todas las dependencias y crea la instancia ejecutable del controlador.
 */

const axios = require('axios');
const https = require('https');
const { BOE, INGESTION } = require('../config/constants');
const logger = require('../utils/logger');
const subastasRules = require('../config/subastasRules');

const xmlParserService = require('../services/xmlParserService');
const createBoeService = require('../services/boeHttpService');
const createIngestionController = require('../controllers/ingestionController');

// Configuración del cliente HTTP optimizado
const httpsAgent = new https.Agent({ keepAlive: true });
const httpClient = axios.create({
    httpsAgent,
    timeout: BOE.TIMEOUT_MS
});

// Inyección de dependencias en cadena
const boeService = createBoeService(httpClient, BOE, logger);

const ingestionController = createIngestionController(
    boeService,
    xmlParserService,
    logger,
    { ...BOE, ...INGESTION },
    subastasRules
);

// Bloque de ejecución temporal manual
if (require.main === module) {
    ingestionController.runDailyIngestion(new Date());
}

module.exports = ingestionController;