/**
 * @fileoverview Controlador para el panel de administración.
 */

function createSystemController(systemService, logger) {
    
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