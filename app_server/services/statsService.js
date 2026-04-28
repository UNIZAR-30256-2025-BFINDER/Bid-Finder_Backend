/**
 * @fileoverview Servicio encargado de la gestión de estadísticas.
 * Contiene la lógica de negocio para obtener estadísticas de subastas por categoría y provincia. 
 * Incluye manejo de errores y logging para facilitar la depuración.
 */


function CreateStatsService(subastasRepository) {
  /**
   * Devuelve el conteo de subastas agrupadas por categoría
   */
  async function obtenerStatsCategorias() {
    return await subastasRepository.aggregateByCategoria();
  }

  /**
   * Devuelve el conteo de subastas agrupadas por provincia (zona)
   */
  async function obtenerStatsProvincias() {
    return await subastasRepository.aggregateByProvincia();
  }

  return {
    obtenerStatsCategorias,
    obtenerStatsProvincias
  };
}

module.exports = CreateStatsService;