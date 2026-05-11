/**
 * @fileoverview Servicio encargado de la agregación y gestión de estadísticas.
 * Actúa como puente entre los controladores del panel de administración y el repositorio,
 * aislando la lógica de negocio y facilitando la escalabilidad.
 */

/**
 * Crea una instancia del servicio de estadísticas.
 * @param {Object} subastasRepository - Repositorio de subastas inyectado.
 * @returns {Object} Interfaz del servicio con métodos de agregación.
 */
function createStatsService(subastasRepository) {
  
  /**
   * Obtiene el conteo total de subastas agrupadas por su categoría principal.
   * Solo contabiliza aquellas procesadas con éxito por la IA.
   * @returns {Promise<Array<{categoria: string, total: number}>>}
   */
  async function obtenerStatsCategorias() {
    return await subastasRepository.aggregateByCategoria();
  }

  /**
   * Obtiene el conteo total de subastas agrupadas por provincia/zona.
   * Solo contabiliza aquellas procesadas con éxito por la IA y con geocodificación.
   * @returns {Promise<Array<{provincia: string, total: number}>>}
   */
  async function obtenerStatsProvincias() {
    return await subastasRepository.aggregateByProvincia();
  }

  return {
    obtenerStatsCategorias,
    obtenerStatsProvincias
  };
}

module.exports = createStatsService;