/**
 * @fileoverview Controlador para la gestión de favoritos de los usuarios.
 * Permite añadir, eliminar y listar las subastas guardadas.
 */

/**
 * Crea el controlador de favoritos inyectando sus dependencias.
 * @param {Object} favoritosService - Servicio de base de datos para los favoritos.
 * @param {Object} logger - Sistema de logs.
 * @returns {Object} Métodos del controlador (addFavorite, removeFavorite, listFavorites).
 */
function createFavoritosController(favoritosService, logger) {
    
    /**
     * Añade una subasta a la lista de favoritos del usuario autenticado.
     * @param {Object} req - Objeto de petición de Express (requiere req.user y req.params.subastaId).
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON con el estado de la operación.
     */
    async function addFavorite(req, res) {
        try {
            const { subastaId } = req.params;
            const userId = req.user.id;

            const result = await favoritosService.addFavorite(userId, subastaId);
            
            logger.info(`Usuario ${userId} añadió favorito ${subastaId} (ObjectId: ${result.subasta._id})`);

            return res.status(200).json({
                status: "success",
                message: "Subasta añadida a favoritos",
                data: { favoritos: result.favoritos },
            });
        } catch (error) {
            if (error.message === "Subasta no encontrada") {
                return res.status(404).json({ error: { message: error.message, status: 404 } });
            }
            logger.error("Error en addFavorite:", error);
            return res.status(500).json({ error: { message: "Error interno al añadir favorito", status: 500 } });
        }
    }

    /**
     * Elimina una subasta de la lista de favoritos del usuario autenticado.
     * @param {Object} req - Objeto de petición de Express (requiere req.user y req.params.subastaId).
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON con el estado de la operación.
     */
    async function removeFavorite(req, res) {
        try {
            const { subastaId } = req.params;
            const userId = req.user.id;

            const result = await favoritosService.removeFavorite(userId, subastaId);
            
            logger.info(`Usuario ${userId} eliminó favorito ${subastaId} (ObjectId: ${result.subasta._id})`);

            return res.status(200).json({
                status: "success",
                message: "Subasta eliminada de favoritos",
                data: { favoritos: result.favoritos },
            });
        } catch (error) {
            if (error.message === "Subasta no encontrada") {
                return res.status(404).json({ error: { message: error.message, status: 404 } });
            }
            logger.error("Error en removeFavorite:", error);
            return res.status(500).json({ error: { message: "Error interno al eliminar favorito", status: 500 } });
        }
    }

    /**
     * Obtiene la lista completa de subastas favoritas del usuario.
     * @param {Object} req - Objeto de petición de Express (requiere req.user).
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON con el array de favoritos.
     */
    async function listFavorites(req, res) {
        try {
            const userId = req.user.id;
            const favoritos = await favoritosService.getFavorites(userId);

            return res.status(200).json({
                status: "success",
                data: { favoritos },
            });
        } catch (error) {
            logger.error("Error en listFavorites:", error);
            return res.status(500).json({ error: { message: "Error interno al listar favoritos", status: 500 } });
        }
    }

    return { addFavorite, removeFavorite, listFavorites };
}

module.exports = createFavoritosController;