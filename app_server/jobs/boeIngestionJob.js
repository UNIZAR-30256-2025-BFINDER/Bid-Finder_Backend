/**
 * @fileoverview Raíz para la tarea de ingesta, cron job
 */

const axios = require("axios");
const https = require("https");
const { BOE, INGESTION } = require("../config/constants");
const logger = require("../utils/logger");
const subastasRules = require("../config/subastasRules");

const connectDB = require("../config/database"); 
const createSubastasRepository = require("../repositories/subastasRepository");

const xmlParserService = require("../services/xmlParserService");
const createBoeService = require("../services/boeHttpService");
const createIngestionController = require("../controllers/ingestionController");

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

function isNoPublicationError(error) {
    if (error.response && error.response.status === 404) return true;
    const message = error.message || "";
    return message.includes("no data") || message.includes("No se encontró publicación");
}

function isNonPublicationDay(date) {
    return date.getDay() === 0;
}

async function main(executionDate = new Date()) {
    logger.info(`Iniciando tarea de ingesta para fecha: ${executionDate.toISOString()}`);

    if (isNonPublicationDay(executionDate)) {
        logger.info(`Domingo. No se espera publicación. Saliendo sin procesar.`);
        return 0;
    }

    try {
        await connectDB(); 
        await ingestionController.runDailyIngestion(executionDate);
        logger.info(`Ingesta completada con éxito. Arrancando AI Worker...`);
        
        await runWorker();
        
        logger.info(`Proceso diario completo (Ingesta + IA) finalizado.`);
        return 0;
    } catch (error) {
        if (isNoPublicationError(error)) {
            logger.info(`No se encontró publicación. Motivo: ${error.message || error}`);
            return 0;
        } else {
            logger.error(`Error crítico durante la ingesta:`, error);
            return 1;
        }
    }
}

if (require.main === module) {
    main().then(process.exit);
}

module.exports = { ingestionController, main, isNonPublicationDay, isNoPublicationError };