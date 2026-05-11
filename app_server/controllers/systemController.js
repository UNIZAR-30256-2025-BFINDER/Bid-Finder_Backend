/**
 * @fileoverview Controlador para el panel de administración.
 * Devuelve métricas generales del servidor y estado del proceso de ingesta.
 */

/**
 * Crea el controlador de sistema inyectando sus dependencias.
 * @param {Object} systemService - Servicio que recupera la salud e información del servidor.
 * @param {Object} logger - Sistema de logs.
 * @returns {Object} Métodos del controlador (getEstadoSistema).
 */
function createSystemController(systemService, logger) {
    
    /**
     * Responde con la métrica actual del sistema (estado del backend, subastas de hoy, última ingesta).
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON con las estadísticas operativas.
     */
    async function getEstadoSistema(req, res) {
        try {
            const estado = await systemService.obtenerEstadoSistema();
            
            return res.status(200).json({
                status: 'success',
                data: estado
            });
        } catch (error) {
            logger.error(`[System Controller] Error al obtener el estado: ${error.message}`, { stack: error.stack });
            return res.status(500).json({
                error: {
                    message: 'Error interno al recuperar las métricas del sistema',
                    status: 500
                }
            });
        }
    }

    return { getEstadoSistema };
}

module.exports = createSystemController;