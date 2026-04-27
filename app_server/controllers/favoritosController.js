// favoritosController.js
const Usuario = require("../models/usuario");

function createFavoritosController(subastasService, logger) {
    /**
     * Añadir una subasta a favoritos del usuario autenticado
     * POST /api/favoritos/:subastaId   (subastaId es el id público, ej: BOE-B-2026-112)
     */
    async function addFavorite(req, res) {
        try {
            const { subastaId } = req.params;
            const userId = req.user.id; // Asignado por authMiddleware

            // 1. Validar que la subasta existe (usando el servicio)
            const subasta = await subastasService.getSubastaById(subastaId);
            if (!subasta) {
                return res.status(404).json({
                    error: { message: "Subasta no encontrada", status: 404 },
                });
            }

            // 2. Almacenar el ObjectId de la subasta (subasta._id) en el array favoritos
            const usuario = await Usuario.findByIdAndUpdate(
                userId,
                { $addToSet: { favoritos: subasta._id } }, // ← importante: usar _id
                { new: true },
            ).populate("favoritos");

            logger.info(
                `Usuario ${userId} añadió favorito ${subastaId} (ObjectId: ${subasta.id})`,
            );

            return res.status(200).json({
                status: "success",
                message: "Subasta añadida a favoritos",
                data: { favoritos: usuario.favoritos },
            });
        } catch (error) {
            logger.error("Error en addFavorite:", error);
            return res.status(500).json({
                error: {
                    message: "Error interno al añadir favorito",
                    status: 500,
                },
            });
        }
    }

    /**
     * Eliminar una subasta de favoritos
     * DELETE /api/favoritos/:subastaId
     */
    async function removeFavorite(req, res) {
        try {
            const { subastaId } = req.params;
            const userId = req.user.id;

            // 1. Obtener la subasta para conocer su ObjectId
            const subasta = await subastasService.getSubastaById(subastaId);
            if (!subasta) {
                return res.status(404).json({
                    error: { message: "Subasta no encontrada", status: 404 },
                });
            }

            // 2. Eliminar el ObjectId del array favoritos
            const usuario = await Usuario.findByIdAndUpdate(
                userId,
                { $pull: { favoritos: subasta._id } }, // ← usar _id
                { new: true },
            ).populate("favoritos");

            logger.info(
                `Usuario ${userId} eliminó favorito ${subastaId} (ObjectId: ${subasta._id})`,
            );

            return res.status(200).json({
                status: "success",
                message: "Subasta eliminada de favoritos",
                data: { favoritos: usuario.favoritos },
            });
        } catch (error) {
            logger.error("Error en removeFavorite:", error);
            return res.status(500).json({
                error: {
                    message: "Error interno al eliminar favorito",
                    status: 500,
                },
            });
        }
    }

    /**
     * Listar todas las subastas favoritas del usuario
     * GET /api/favoritos
     */
    async function listFavorites(req, res) {
        try {
            const userId = req.user.id;

            const usuario = await Usuario.findById(userId)
                .populate("favoritos") // populate funciona porque guardamos ObjectIds
                .select("favoritos");

            return res.status(200).json({
                status: "success",
                data: { favoritos: usuario.favoritos || [] },
            });
        } catch (error) {
            logger.error("Error en listFavorites:", error);
            return res.status(500).json({
                error: {
                    message: "Error interno al listar favoritos",
                    status: 500,
                },
            });
        }
    }

    return {
        addFavorite,
        removeFavorite,
        listFavorites,
    };
}

module.exports = createFavoritosController;
