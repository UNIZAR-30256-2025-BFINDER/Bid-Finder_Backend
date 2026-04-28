/**
 * @fileoverview Controlador para la gestión de estadísticas.
 * Gestiona las peticiones HTTP para obtener información estadística.
 */



function createStatsController(statsService, logger) {
    //protegido solo para admin
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
