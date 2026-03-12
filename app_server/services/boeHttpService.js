/**
 * @fileoverview Servicio encargado de las comunicaciones HTTP con la API del BOE.
 * Permitie la Inyección de Dependencias.
 */

/**
 * Crea una instancia del servicio HTTP del BOE.
 * @param {Object} httpClient - Cliente HTTP configurado (ej. Axios).
 * @param {Object} config - Objeto con las constantes de configuración (URLs, timeouts).
 * @param {Object} logger - Utilidad de registro de logs (ej. Winston).
 * @returns {Object} Objeto con los métodos fetchSumario y fetchXMLContent.
 */
function createBoeService(httpClient, config, logger) {
    
    function formatDateForBOE(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    async function fetchSumario(date) {
        const dateStr = formatDateForBOE(date);
        const url = `${config.API_SUMARIO_URL}/${dateStr}`;
        
        logger.info(`[BOE Service] Solicitando sumario del BOE para la fecha: ${dateStr}...`);
        const response = await httpClient.get(url, {
            headers: { 'Accept': 'application/xml' }
        });
        return response.data;
    }

    async function fetchXMLContent(xmlUrl) {
        const response = await httpClient.get(xmlUrl, {
            responseType: 'text'
        });
        return response.data;
    }

    return {
        fetchSumario,
        fetchXMLContent
    };
}

module.exports = createBoeService;