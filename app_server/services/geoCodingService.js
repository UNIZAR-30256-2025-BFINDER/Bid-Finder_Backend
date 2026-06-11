const { GEO_CODING } = require('../config/constants');

/**
 * Instancia el servicio de geocodificación inyectando el cliente HTTP.
 * @param {Object} httpClient - Cliente HTTP configurado para hacer peticiones externas.
 * @param {number} [delayMs=GEO_CODING.DELAY_MS] - Retardo de cortesía para respetar las políticas de uso de OSM.
 * @returns {Object} Servicio con la función principal de resolución de coordenadas.
 */
function createGeoCodingService(httpClient, delayMs = GEO_CODING.DELAY_MS) {
  if (!httpClient) throw new Error('httpClient es obligatorio');

  /**
   * Limpia el ruido legal o información accesoria (pisos, escaleras, paréntesis)
   * que suele confundir a los motores de búsqueda geográfica convencionales.
   * @param {string} addr - Dirección bruta de la IA.
   * @returns {string} Dirección sanitizada.
   */
  function cleanAddress(addr) {
    if (!addr) return "";
    return addr
      .replace(/nº\s*\d+/gi, "")
      .replace(/números?\s*[\d\s\-y,]+/gi, "")
      .replace(/piso\s*\d+[ºª]?/gi, "")
      .replace(/\d+[ºª]\s*[a-z]?/gi, "")
      .replace(/\([^)]*\)/g, "") 
      .replace(/\//g, " ")
      .trim();
  }

  /**
   * Intenta geocodificar una dirección utilizando un enfoque en cascada:
   * 1º Dirección + Municipio.
   * 2º Solo Dirección.
   * 3º Solo Municipio (Fallback).
   * @param {string} address - Calle/vía devuelta por la IA.
   * @param {string} municipio - Municipio devuelto por la IA.
   * @returns {Promise<Object>} Resultado con el GeoJSON y el flag indicando si usó el fallback.
   */
  async function getCoordinatesFromAddress(address, municipio) {
    const limpia = cleanAddress(address);
    const pais = GEO_CODING.DEFAULT_COUNTRY;
    let firstRawResult = null;
    
    if (limpia && municipio) {
      const query = `${limpia}, ${municipio}, ${pais}`;
      const res = await geocode(query);
      if (res.geojson) return { ...res, fallbackUsed: false, query };
      if (!firstRawResult) firstRawResult = res.raw;
    }

    if (limpia) {
      const query = `${limpia}, ${pais}`;
      const res = await geocode(query);
      if (res.geojson) return { ...res, fallbackUsed: false, query };
      if (!firstRawResult) firstRawResult = res.raw;
    }

    if (municipio) {
      const query = `${municipio}, ${pais}`;
      const res = await geocode(query);
      if (res.geojson) return { ...res, fallbackUsed: true, query };
      if (!firstRawResult) firstRawResult = res.raw;
    }

    return { geojson: null, raw: firstRawResult, fallbackUsed: false, query: address };
  }

  /**
   * Ejecuta la consulta HTTP real contra la API de Nominatim.
   * @param {string} query - Cadena de búsqueda geográfica.
   * @returns {Promise<{geojson: Object|null, raw: Object|null}>} Respuesta procesada o nula si falla.
   */
  async function geocode(query) {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    const url = `${GEO_CODING.NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;
    try {
      const response = await httpClient.get(url, { headers: { 'Accept-Language': 'es' } });
      const data = response.data;
      if (!Array.isArray(data) || data.length === 0) return { geojson: null, raw: null };
      
      const { lat, lon } = data[0];
      const latVal = parseFloat(lat);
      const lonVal = parseFloat(lon);

      if (isNaN(latVal) || isNaN(lonVal)) return { geojson: null, raw: data[0] };
      
      return { 
        geojson: { type: 'Point', coordinates: [lonVal, latVal] }, 
        raw: data[0] 
      };
    } catch {
      return { geojson: null, raw: null };
    }
  }

  return { getCoordinatesFromAddress };
}

module.exports = { createGeoCodingService };