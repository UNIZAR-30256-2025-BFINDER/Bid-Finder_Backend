function createFavoritosController(favoritosService, logger) {
    
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