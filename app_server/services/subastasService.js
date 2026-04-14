function createSubastasService(subastasRepository) {

  /**
   * Obtiene todas las subastas almacenadas en la base de datos real.
   * @param {Object} filtros - Filtros opcionales (ej: { provincia: 'Madrid' })
   * @returns {Promise<Array>} Lista de subastas.
   */
  async function getAllSubastas(filtros = {}) {
    return await subastasRepository.findAll(filtros);
  }

  /**
   * Obtiene una subasta por su ID del BOE.
   * @param {string} id - El ID de la subasta 
   * @returns {Promise<Object|null>} La subasta encontrada o null si no se encuentra.
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