
/**
 * @fileoverview Servicio encargado de la geocodificación de direcciones usando Nominatim (OSM).
 * Permite convertir texto de dirección en coordenadas espaciales (geoJSON).
 * Incluye lógica de fallback para buscar por municipio si la dirección exacta falla.
 */



/**
 * Permite crear una instancia del servicio de geocodificación con inyección de dependencias (httpClient).
 * @param {Object} [httpClient] - Cliente HTTP (ej. Axios). Si no se pasa, usa fetch por defecto.
 * @returns {Object} Servicio con método getCoordinatesFromAddress(address, municipio)
 */

function createGeoCodingService(httpClient) {
  if (!httpClient) throw new Error('httpClient es obligatorio (por ejemplo, una instancia de Axios)');

  /**
   * Llama a la API pública de Nominatim para obtener coordenadas de una dirección.
   * Si la búsqueda exacta falla, intenta buscar por municipio (fallback).
   * @param {string} address - Dirección completa a geocodificar.
   * @param {string} [municipio] - Municipio para fallback si la dirección falla.
   * @returns {Promise<{geojson: object|null, raw: object|null, fallbackUsed: boolean, query: string}>}
   */
  async function getCoordinatesFromAddress(address, municipio) {
    // Si no hay dirección pero hay municipio, intentar municipio directamente
    if (!address || typeof address !== 'string' || address.trim() === '') {
      if (municipio && typeof municipio === 'string' && municipio.trim() !== '') {
        const municipioResult = await geocode(municipio);
        if (municipioResult.geojson) {
          return { ...municipioResult, fallbackUsed: true, query: municipio };
        }
        return { geojson: null, raw: municipioResult.raw, fallbackUsed: true, query: municipio };
      }
      return { geojson: null, raw: null, fallbackUsed: false, query: address };
    }
    // Si hay dirección, intentar dirección primero
    let result = await geocode(address);
    if (result.geojson) {
      return { ...result, fallbackUsed: false, query: address };
    }
    if (municipio && typeof municipio === 'string' && municipio.trim() !== '') {
      const municipioResult = await geocode(municipio);
      if (municipioResult.geojson) {
        return { ...municipioResult, fallbackUsed: true, query: municipio };
      }
      return { geojson: null, raw: municipioResult.raw, fallbackUsed: true, query: municipio };
    }
    return { geojson: null, raw: result.raw, fallbackUsed: false, query: address };
  }

  /**
   * Realiza la petición a Nominatim y transforma la respuesta a geoJSON Point.
   * Maneja errores de red y respuestas inesperadas, devolviendo null en caso de fallo.
   * @param {string} query - Texto a buscar (dirección o municipio).
   * @returns {Promise<{geojson: object|null, raw: object|null}>}
   */
  async function geocode(query) {
    const userAgent = process.env.NOMINATIM_USER_AGENT || 'BidFinder/1.0 (default@example.com)';
    const acceptLanguage = process.env.NOMINATIM_ACCEPT_LANGUAGE || 'es';
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    try {
      const response = await httpClient.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept-Language': acceptLanguage,
        },
      });
      const data = response.data;
      if (!Array.isArray(data) || data.length === 0) return { geojson: null, raw: null };
      const { lat, lon } = data[0];
      if (!lat || !lon) return { geojson: null, raw: data[0] };
      const geojson = {
        type: 'Point',
        coordinates: [parseFloat(lon), parseFloat(lat)],
      };
      return { geojson, raw: data[0] };
    } catch (err) {
      if (err.name === 'FetchError') {
        console.error(`[GeoCodingService] Error de red al llamar a Nominatim: ${err.message}`);
      } else {
        console.error(`[GeoCodingService] Error inesperado: ${err.message}`);
      }
      return { geojson: null, raw: null };
    }
  }

  return {
    getCoordinatesFromAddress,
  };
}

module.exports = {
  createGeoCodingService,
};