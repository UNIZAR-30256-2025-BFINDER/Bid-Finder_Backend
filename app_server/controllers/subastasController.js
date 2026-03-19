function createSubastasController(subastasService) {
    function getSubastaById(req, res) {
      const id = Number(req.params.id);
  
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: {
            message: 'ID inválido',
            status: 400
          }
        });
      }
  
      const subasta = subastasService.getSubastaById(id);
  
      if (!subasta) {
        return res.status(404).json({
          error: {
            message: 'Subasta no encontrada',
            status: 404
          }
        });
      }
  
      return res.status(200).json({
        status: 'success',
        data: subasta
      });
    }
  
    return {
      getSubastaById
    };
  }
  
  module.exports = createSubastasController;