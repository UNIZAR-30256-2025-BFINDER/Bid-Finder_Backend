/**
 * @fileoverview Controlador para la gestión de estadísticas.
 * Proporciona endpoints para alimentar los gráficos del panel de administración.
 */

/**
 * Crea el controlador de estadísticas inyectando sus dependencias.
 * @param {Object} statsService - Servicio que consolida las consultas de agregación a la BD.
 * @param {Object} logger - Sistema de logs.
 * @returns {Object} Métodos del controlador (getStatsSubastasPorCategoria, getStatsSubastasPorProvincia).
 */
function createStatsController(statsService, logger) {
    
    /**
     * Obtiene los totales de subastas agrupadas por categoría.
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON con las estadísticas categóricas.
     */
    async function getStatsSubastasPorCategoria(req, res) {
        try {
            const stats = await statsService.obtenerStatsCategorias();
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error("Error en getStatsSubastasCategoria:", error);
            res.status(500).json({
                error: {
                    message: "Error interno al obtener estadísticas de categorías",
                    status: 500,
                },
            });
        }
    }

    /**
     * Obtiene los totales de subastas agrupadas por provincia.
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON con las estadísticas geográficas.
     */
    async function getStatsSubastasPorProvincia(req, res) {
        try {
            const stats = await statsService.obtenerStatsProvincias();
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error("Error en getStatsSubastasProvincia:", error);
            res.status(500).json({
                error: {
                    message: "Error interno al obtener estadísticas de provincias",
                    status: 500,
                },
            });
        }
    }

    return {
        getStatsSubastasPorCategoria,
        getStatsSubastasPorProvincia
    };
}

module.exports = createStatsController;