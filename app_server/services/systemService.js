/**
 * @fileoverview Servicio para la gestión y monitorización de la salud del sistema.
 * Agrupa métricas de infraestructura y de base de datos en un solo lugar.
 */

/**
 * Crea el servicio de monitorización inyectando los repositorios necesarios.
 * @param {Object} subastasRepository - Repositorio base para calcular volúmenes de ingesta.
 * @returns {Object} Interfaz de monitorización.
 */
function createSystemService(subastasRepository) {
    
    /**
     * Recupera y ensambla los KPIs operativos actuales de la plataforma.
     * @returns {Promise<Object>} Objeto con el estado del servidor, timestamp actual y estadísticas de volumen.
     */
    async function obtenerEstadoSistema() {
        const stats = await subastasRepository.getSystemStats();
        
        return {
            estado_backend: 'ONLINE',
            timestamp_actual: new Date(),
            ...stats
        };
    }

    return { obtenerEstadoSistema };
}

module.exports = createSystemService;