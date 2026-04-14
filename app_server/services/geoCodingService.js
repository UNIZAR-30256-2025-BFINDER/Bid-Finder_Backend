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
  if (!httpClient) throw new Error('httpClient es obligatorio');

  function cleanAddress(addr) {
    if (!addr) return "";
    return addr
      .replace(/nº\s*\d+/gi, "") 
      .replace(/números?\s*[\d\s\-y,]+/gi, "") 
      .replace(/piso\s*\d+[ºª]?/gi, "")
      .replace(/\d+[ºª]\s*[a-z]?/gi, "") 
      .replace(/\([^\)]*\)/g, "") 
      .replace(/\//g, " ") 
      .trim();
  }

  async function getCoordinatesFromAddress(address, municipio) {
    const limpia = cleanAddress(address);
    const pais = "España";
    
    if (limpia && municipio) {
      const query = `${limpia}, ${municipio}, ${pais}`;
      const res = await geocode(query);
      if (res.geojson) return { ...res, fallbackUsed: false, query };
    }

    if (limpia) {
      const query = `${limpia}, ${pais}`;
      const res = await geocode(query);
      if (res.geojson) return { ...res, fallbackUsed: false, query };
    }

    if (municipio) {
      const query = `${municipio}, ${pais}`;
      const res = await geocode(query);
      if (res.geojson) return { ...res, fallbackUsed: true, query };
    }

    return { geojson: null, raw: null, fallbackUsed: false, query: address };
  }

  async function geocode(query) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    try {
      const response = await httpClient.get(url, {
        headers: { 'Accept-Language': 'es' }
      });
      
      const data = response.data;
      if (!Array.isArray(data) || data.length === 0) return { geojson: null, raw: null };
      
      const { lat, lon } = data[0];
      const geojson = {
        type: 'Point',
        coordinates: [parseFloat(lon), parseFloat(lat)],
      };
      
      return { geojson, raw: data[0] };
    } catch (err) {
      console.error(`[GeoCodingService] Error en HTTP: ${err.message}`);
      return { geojson: null, raw: null };
    }
  }

  return { getCoordinatesFromAddress };
}

module.exports = { createGeoCodingService };