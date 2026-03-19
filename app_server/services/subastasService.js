const subastasModel = require('../models/subastasModel');

function createSubastasService() {
  function getSubastaById(id) {
    return subastasModel.findById(id);
  }

  return {
    getSubastaById
  };
}

module.exports = createSubastasService;