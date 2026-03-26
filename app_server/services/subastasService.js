const Subasta = require('../models/subasta');

function createSubastasService() {

  /**
   * Obtiene todas las subastas almacenadas en la base de datos real.
   * @returns {Promise<Array>} Lista de subastas.
   */
  async function getAllSubastas() {
    return await Subasta.find({}).sort({ fechaPublicacion: -1 });
  }

  /**
   * Obtiene una subasta por su ID del BOE.
   * @param {string} id - El ID de la subasta 
   * @returns {Promise<Object|null>} La subasta encontrada o null si no se encuentra.
   */
  async function getSubastaById(id) {
    return await Subasta.findOne({ id: id });
  }

  return {
    getSubastaById,
    getAllSubastas
  };
}

module.exports = createSubastasService;