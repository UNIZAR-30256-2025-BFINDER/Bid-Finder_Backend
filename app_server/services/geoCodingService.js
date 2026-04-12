/**
 * @fileoverview Servicio encargado de la geocodificación de direcciones usando Nominatim (OSM).
 * Permite convertir texto de dirección en coordenadas espaciales (geoJSON).
 * Incluye lógica de fallback para buscar por municipio si la dirección exacta falla.
 */

/**
 * Permite crear una instancia del servicio de geocodificación con inyección de dependencias (httpClient).
 * @param {Object} [httpClient] - Cliente HTTP configurado desde el container (Axios).
 * @returns {Object} Servicio con método getCoordinatesFromAddress(address, municipio)
 */
function createGeoCodingService(httpClient) {
  if (!httpClient) throw new Error('httpClient es obligatorio (por ejemplo, una instancia de Axios)');

  async function getCoordinatesFromAddress(address, municipio) {
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

  async function geocode(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    try {
      const response = await httpClient.get(url, {
        headers: {
          'Accept-Language': 'es',
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
      console.error(`[GeoCodingService] Error al llamar a Nominatim: ${err.message}`);
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