const subastasModel = require('../models/subastasModel');

function createSubastasService() {

  /**
   * Obtiene todas las subastas almacenadas en la base de datos.
   * @returns {Array} Lista de subastas.
   */
  function getAllSubastas() {
    return subastasModel.findAll();
  }

  /**
   * Obtiene una subasta por su ID.
   * @param {number} id - El ID de la subasta.
   * @returns {Object|null} La subasta encontrada o null si no se encuentra.
   */
  function getSubastaById(id) {
    return subastasModel.findById(id);
  }

  return {
    getSubastaById,
    getAllSubastas
  };
}

module.exports = createSubastasService;