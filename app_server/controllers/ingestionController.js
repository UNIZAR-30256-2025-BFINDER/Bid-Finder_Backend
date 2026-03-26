/**
 * @fileoverview Controlador principal de la orquestación de la ingesta de datos.
 */

function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

function createIngestionController(boeService, xmlParser, logger, config, ingestionRules, persistenceService) {
    
    async function runDailyIngestion(date = new Date()) {
        const sumarioXml = await boeService.fetchSumario(date);
        logger.info(`[Ingestion Controller] Sumario obtenido. Buscando items...`);
        
        const subastas = xmlParser.extractItems(sumarioXml, ingestionRules.filterCondition);
        if (subastas.length === 0) return true;

        logger.info(`[Ingestion Controller] Se han encontrado ${subastas.length} items. Iniciando extracción In-Memory...`);
        const lotes = chunkArray(subastas, config.CONCURRENCY_LIMIT);

        for (let i = 0; i < lotes.length; i++) {
            const lote = lotes[i];
            logger.info(`[Ingestion Controller] Procesando lote ${i + 1} de ${lotes.length}...`);
            const subastasListasParaBd = [];

            await Promise.all(lote.map(async (subasta) => {
                try {
                    const fullUrl = subasta.urlXml.startsWith('http') ? subasta.urlXml : `${config.BASE_DOMAIN}${subasta.urlXml}`;
                    const xmlContent = await boeService.fetchXMLContent(fullUrl);
                    const datosProcesados = xmlParser.parseAnuncioIndividual(xmlContent, ingestionRules.mapFn);
                    subastasListasParaBd.push(datosProcesados);
                } catch (err) {
                    logger.error(`Error parseando anuncio ${subasta.id}: ${err.message}`);
                }
            }));

            if (subastasListasParaBd.length > 0 && persistenceService) {
                const dbResult = await persistenceService.saveSubastas(subastasListasParaBd);
                logger.info(`[Mongo] Lote guardado: ${dbResult.upserted} creadas, ${dbResult.modified} actualizadas.`);
            }
        }

        logger.info(`[Ingestion Controller] Proceso de ingesta finalizado con éxito.`);
        return true;
    }

    return { runDailyIngestion };
}

module.exports = createIngestionController;