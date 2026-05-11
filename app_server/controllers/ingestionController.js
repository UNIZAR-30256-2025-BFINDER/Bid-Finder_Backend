/**
 * @fileoverview Controlador principal de la orquestación de la ingesta de datos.
 * Se encarga de descargar el sumario diario, filtrar anuncios y guardarlos en BD.
 */

/**
 * Divide un array en múltiples arrays más pequeños.
 * Utilizado para controlar la concurrencia en las llamadas a la API del BOE.
 * @param {Array} array - Array original a dividir.
 * @param {number} size - Tamaño máximo de cada lote.
 * @returns {Array<Array>} Array de lotes.
 */
function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

/**
 * Crea el controlador de ingesta inyectando los servicios necesarios.
 * @param {Object} boeService - Servicio HTTP para comunicarse con el BOE.
 * @param {Object} xmlParser - Servicio para parsear respuestas XML a JSON.
 * @param {Object} logger - Sistema de logs.
 * @param {Object} config - Configuración global de la aplicación (límites, dominios).
 * @param {Object} ingestionRules - Reglas de filtrado y mapeo de subastas.
 * @param {Object} subastasRepository - Repositorio para guardar en MongoDB.
 * @returns {Object} Controlador de ingesta (runDailyIngestion).
 */
function createIngestionController(boeService, xmlParser, logger, config, ingestionRules, subastasRepository) {
    
    /**
     * Ejecuta el proceso de descarga, parseo y guardado de las subastas publicadas en una fecha.
     * @param {Date} [date=new Date()] - Fecha del sumario a buscar (por defecto, hoy).
     * @returns {Promise<boolean>} Devuelve true al finalizar correctamente.
     */
    async function runDailyIngestion(date = new Date()) {
        const sumarioXml = await boeService.fetchSumario(date);
        logger.info(`[Ingestion Controller] Sumario obtenido. Buscando items...`);
        
        const subastas = xmlParser.processXml(sumarioXml, ingestionRules.extractSumarioStrategy);
        if (subastas.length === 0) return true;

        logger.info(`[Ingestion Controller] Se han encontrado ${subastas.length} items. Iniciando extracción...`);
        const lotes = chunkArray(subastas, config.CONCURRENCY_LIMIT);

        for (let i = 0; i < lotes.length; i++) {
            const lote = lotes[i];
            logger.info(`[Ingestion Controller] Procesando lote ${i + 1} de ${lotes.length}...`);
            const subastasListasParaBd = [];

            await Promise.all(lote.map(async (subasta) => {
                try {
                    const fullUrl = subasta.urlXml.startsWith('http') ? subasta.urlXml : `${config.BASE_DOMAIN}${subasta.urlXml}`;
                    
                    const xmlContent = await boeService.fetchXMLContent(fullUrl);
                    let datosProcesados = xmlParser.processXml(xmlContent, ingestionRules.extractAnuncioStrategy);
                    
                    if (datosProcesados) {
                        subastasListasParaBd.push(datosProcesados);
                    }
                    
                } catch (err) {
                    logger.error(`Error procesando anuncio ${subasta.id}: ${err.message}`);
                }
            }));

            if (subastasListasParaBd.length > 0 && subastasRepository) {
                const dbResult = await subastasRepository.saveSubastas(subastasListasParaBd);
                logger.info(`[Mongo] Lote guardado: ${dbResult.upserted} creadas, ${dbResult.modified} actualizadas.`);
            }
        }

        logger.info(`[Ingestion Controller] Proceso de ingesta finalizado con éxito.`);
        return true;
    }

    return { runDailyIngestion };
}

module.exports = createIngestionController;