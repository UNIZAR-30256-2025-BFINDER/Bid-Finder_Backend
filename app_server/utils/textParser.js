/**
 * @fileoverview Utilidades de análisis y extracción de texto de anuncios del BOE.
 */

/**
 * Intenta extraer el nombre del municipio o localidad como fallback a partir de patrones comunes del texto del anuncio.
 * @param {string} textoAnuncio - Texto completo del anuncio del BOE.
 * @returns {string|null} Nombre del municipio o null si no se encuentra coincidencia.
 */
function extractFallbackMunicipio(textoAnuncio) {
    if (!textoAnuncio) return null;

    const municipioMatch =
        textoAnuncio.match(/en ([A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+)[.,]/) ||
        textoAnuncio.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+), \d{1,2} de /);

    if (municipioMatch) {
        return municipioMatch[1].trim();
    }

    return null;
}

module.exports = {
    extractFallbackMunicipio
};
