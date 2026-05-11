/**
 * @fileoverview Servicio encargado de las comunicaciones HTTP con la API de datos abiertos del BOE.
 * Descarga los sumarios diarios y el XML completo de cada anuncio publicado.
 */

/**
 * Crea una instancia del servicio HTTP del BOE.
 * @param {Object} httpClient - Cliente HTTP inyectado.
 * @param {Object} config - Objeto de configuración con las rutas base del BOE.
 * @param {Object} logger - Utilidad de registro de logs.
 * @returns {Object} Servicio con los métodos `fetchSumario` y `fetchXMLContent`.
 */
function createBoeService(httpClient, config, logger) {
    
    /**
     * Formatea un objeto Date al formato YYYYMMDD esperado por la API del BOE.
     * @param {Date} date - Fecha a formatear.
     * @returns {string} Fecha como cadena de texto.
     */
    function formatDateForBOE(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * Descarga el sumario completo de publicaciones del BOE para una fecha determinada.
     * @param {Date} date - Fecha de consulta.
     * @returns {Promise<string>} Contenido XML bruto del sumario.
     * @throws {Error} Si el BOE devuelve 404 (sin publicación) o hay problemas de red.
     */
    async function fetchSumario(date) {
        const dateStr = formatDateForBOE(date);
        const url = `${config.API_SUMARIO_URL}/${dateStr}`;
        
        logger.info(`[BOE Service] Solicitando sumario del BOE para la fecha: ${dateStr}...`);
        
        try {
            const response = await httpClient.get(url, {
                headers: { 'Accept': 'application/xml' }
            });
            return response.data;
            
        } catch (error) {
            if (error.response && error.response.status === 404) {
                logger.info(`[BOE Service] No hay publicación del BOE para el día ${dateStr} (Error 404).`);
                const noPublicationError = new Error(`No se encontró publicación para la fecha ${dateStr}`);
                noPublicationError.response = { status: 404 };
                throw noPublicationError;
            }
            
            logger.error(`[BOE Service] Error de red al solicitar sumario: ${error.message}`);
            throw new Error(`Fallo de comunicación con la API del BOE: ${error.message}`, { cause: error });
        }
    }

    /**
     * Descarga el documento XML íntegro de un anuncio específico.
     * @param {string} xmlUrl - URL completa del documento XML en los servidores del estado.
     * @returns {Promise<string>} Contenido del anuncio en formato XML.
     */
    async function fetchXMLContent(xmlUrl) {
        const response = await httpClient.get(xmlUrl, {
            responseType: 'text'
        });
        return response.data;
    }

    return { fetchSumario, fetchXMLContent };
}

module.exports = createBoeService;