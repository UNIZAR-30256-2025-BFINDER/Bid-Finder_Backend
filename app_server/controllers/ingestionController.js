/**
 * @fileoverview Controlador principal de la orquestación de la ingesta de datos.
 * Dirige el flujo de información entre el servicio HTTP y el motor de parseo.
 */

function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

/**
 * Crea una instancia del controlador de ingesta.
 * @param {Object} boeService - Servicio inyectado para peticiones HTTP.
 * @param {Object} xmlParser - Servicio inyectado para parseo XML.
 * @param {Object} logger - Sistema de logs inyectado.
 * @param {Object} config - Configuración inyectada.
 * @param {Object} ingestionRules - Reglas de negocio (estrategias de filtrado y mapeo).
 * @returns {Object} Controlador con el método de ejecución principal.
 */
function createIngestionController(boeService, xmlParser, logger, config, ingestionRules) {
    
    async function runDailyIngestion(date = new Date()) {
        const sumarioXml = await boeService.fetchSumario(date);
        logger.info(`[Ingestion Controller] Sumario obtenido. Buscando items...`);
        
        const subastas = xmlParser.extractItems(sumarioXml, ingestionRules.filterCondition);

        logger.info(`[Ingestion Controller] Se han encontrado ${subastas.length} items. Iniciando extracción In-Memory...`);

        const lotes = chunkArray(subastas, config.CONCURRENCY_LIMIT);

        for (let i = 0; i < lotes.length; i++) {
            const lote = lotes[i];
            logger.info(`[Ingestion Controller] Procesando lote ${i + 1} de ${lotes.length}...`);

            await Promise.all(lote.map(async (subasta) => {
                const fullUrl = subasta.urlXml.startsWith('http') ? subasta.urlXml : `${config.BASE_DOMAIN}${subasta.urlXml}`;
                const xmlContent = await boeService.fetchXMLContent(fullUrl);
                const datosProcesados = xmlParser.parseAnuncioIndividual(xmlContent, ingestionRules.mapFn);

                logger.info(`Listo para BD: ${datosProcesados.id_boe} - ${datosProcesados.titulo.substring(0, 50)}...`);
            }));
        }

        logger.info(`[Ingestion Controller] Proceso de ingesta finalizado con éxito.`);
        return true;
    }

    return { runDailyIngestion };
}

module.exports = createIngestionController;