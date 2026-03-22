/**
 * @fileoverview Raíz para la tarea de ingesta, es el cron job
 * Enlaza todas las dependencias y crea la instancia ejecutable del controlador.
 */

const axios = require("axios");
const https = require("https");
const { BOE, INGESTION } = require("../config/constants");
const logger = require("../utils/logger");
const subastasRules = require("../config/subastasRules");

const xmlParserService = require("../services/xmlParserService");
const createBoeService = require("../services/boeHttpService");
const createIngestionController = require("../controllers/ingestionController");

// Configuración del cliente HTTP optimizado
const httpsAgent = new https.Agent({ keepAlive: true });
const httpClient = axios.create({
    httpsAgent,
    timeout: BOE.TIMEOUT_MS,
});

// Inyección de dependencias en cadena
const boeService = createBoeService(httpClient, BOE, logger);

const ingestionController = createIngestionController(
    boeService,
    xmlParserService,
    logger,
    { ...BOE, ...INGESTION },
    subastasRules,
);

// Función auxiliar para analizar si el error corresponde a "no hay publicación"
function isNoPublicationError(error) {
    // Puede ser 404 (recurso no encontrado) o un mensaje específico
    if (error.response && error.response.status === 404) {
        return true;
    }
    // También podrías buscar en el mensaje del error o en la respuesta
    const message = error.message || "";
    return (
        message.includes("no data") ||
        message.includes("No se encontró publicación")
    );
}

// Función auxiliar para determinar si un día es sin publicación (por ejemplo, domingo)
function isNonPublicationDay(date) {
    // Domingo: 0 = domingo en getDay()
    return date.getDay() === 0;
}

// Bloque de ejecución temporal manual
async function main(executionDate = new Date()) {
    logger.info(
        `Iniciando tarea de ingesta para fecha: ${executionDate.toISOString()}`,
    );

    // 1. Verificar si es un día sin publicación (ej. domingo)
    if (isNonPublicationDay(executionDate)) {
        logger.info(
            `Fecha ${executionDate.toISOString()} es domingo. No se espera publicación del BOE. Saliendo sin procesar.`,
        );
        return 0; // Salida normal, no es un error
    }

    // 2. Intentar la ingesta con manejo de errores
    try {
        ingestionController.runDailyIngestion(executionDate);
        logger.info(
            `Ingesta completada con éxito para fecha ${executionDate.toISOString()}`,
        );
        return 0; // Salida normal
    } catch (error) {
        // 3. Determinar si el error es por falta de publicación
        if (isNoPublicationError(error)) {
            logger.info(
                `No se encontró publicación para fecha ${executionDate.toISOString()}. Motivo: ${error.message || error}`,
            );
            return 0; // No es un error crítico, salida normal
        } else {
            // Error real: registrar con detalle y salir con código de error
            logger.error(
                `Error crítico durante la ingesta para fecha ${executionDate.toISOString()}:`,
                error,
            );
            return 1; // El cron detectará el fallo
        }
    }
}

if (require.main === module) {
    main().then(process.exit);
}

module.exports = {
    ingestionController,
    main,
    isNonPublicationDay,
    isNoPublicationError,
};
