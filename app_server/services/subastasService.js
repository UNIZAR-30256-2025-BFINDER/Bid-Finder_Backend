/**
 * @fileoverview Servicio principal de lectura de subastas.
 * Ofrece la API interna para la recuperación de listados filtrados y detalles
 * individuales hacia el frontend.
 */

/**
 * Crea una instancia del servicio de subastas.
 * @param {Object} subastasRepository - Repositorio de datos en MongoDB.
 * @returns {Object} Interfaz de lectura del servicio.
 */
function createSubastasService(subastasRepository) {

  /**
   * Recupera todas las subastas que cumplen con los criterios de búsqueda especificados.
   * @param {Object} [filtros={}] - Diccionario opcional de filtros (provincia, categoría, precios, etc.).
   * @returns {Promise<Array>} Lista de objetos de subasta procesados.
   */
  async function getAllSubastas(filtros = {}) {
    return await subastasRepository.findAll(filtros);
  }

  /**
   * Localiza y devuelve los detalles exhaustivos de una única subasta.
   * @param {string} id - Identificador oficial (BOE) de la subasta.
   * @returns {Promise<Object|null>} El documento de la subasta o null si no se encuentra.
   */
  async function getSubastaById(id) {
    return await subastasRepository.findById(id);
  }

  return {
    getSubastaById,
    getAllSubastas
  };
}

module.exports = createSubastasService;