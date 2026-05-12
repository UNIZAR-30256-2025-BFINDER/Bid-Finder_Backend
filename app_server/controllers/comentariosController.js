/**
 * @fileoverview Controlador para la gestión de comentarios en el foro de subastas.
 * Maneja la creación y obtención de comentarios asociados a un activo.
 */

const Usuario = require("../models/usuario");

/**
 * Crea el controlador de comentarios inyectando sus dependencias.
 * @param {Object} comentariosService - Servicio con la lógica de base de datos de comentarios.
 * @param {Object} logger - Sistema de logs de la aplicación.
 * @returns {Object} Métodos del controlador (crearComentario, obtenerComentarios).
 */
function createComentariosController(comentariosService, logger) {
    /**
     * Crea un nuevo comentario vinculado a una subasta específica.
     * @param {Object} req - Objeto de petición de Express (requiere req.user y req.params.id).
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON con el comentario creado o el error.
     */
    async function crearComentario(req, res) {
        try {
            const { id: subasta_id } = req.params;
            const { texto } = req.body;
            const usuario_id = req.user.id;

            const nuevoComentario = await comentariosService.crearComentario(
                subasta_id,
                usuario_id,
                texto,
            );

            return res.status(201).json({
                status: "success",
                data: nuevoComentario,
            });
        } catch (error) {
            logger.error(
                `[Comentarios Controller] Error al crear comentario: ${error.message}`,
                { stack: error.stack },
            );
            const statusCode = error.message.includes("vacío") ? 400 : 500;
            return res.status(statusCode).json({
                error: {
                    message: error.message || "Error al guardar el comentario",
                    status: statusCode,
                },
            });
        }
    }

    /**
     * Recupera todos los comentarios asociados a una subasta.
     * @param {Object} req - Objeto de petición de Express (requiere req.params.id).
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON con el listado de comentarios.
     */
    async function obtenerComentarios(req, res) {
        try {
            const { id: subasta_id } = req.params;
            const comentarios =
                await comentariosService.obtenerComentariosPorSubasta(
                    subasta_id,
                );

            return res.status(200).json({
                status: "success",
                data: comentarios,
            });
        } catch (error) {
            logger.error(
                `[Comentarios Controller] Error al obtener comentarios: ${error.message}`,
                { stack: error.stack },
            );
            return res.status(500).json({
                error: {
                    message: "Error interno al buscar los comentarios",
                    status: 500,
                },
            });
        }
    }
    async function eliminarComentario(req, res) {
        try {
            const { comentarioId } = req.params;
            const userId = req.user.id;
            const usuario = await Usuario.findById(req.user.id);

            if (!usuario) {
                return res.status(404).json({
                    error: {
                        message: "Usuario no encontrado",
                        status: 404,
                    },
                });
            }
            const userRole = usuario.rol;

            const result = await comentariosService.eliminarComentario(
                comentarioId,
                userId,
                userRole,
            );

            if (!result) {
                return res.status(404).json({
                    error: {
                        message: "Comentario no encontrado",
                        status: 404,
                    },
                });
            }

            return res.status(200).json({
                status: "success",
                message: "Comentario eliminado permanentemente",
                data: { _id: comentarioId },
            });
        } catch (error) {
            const statusCode =
                error.message === "No autorizado para eliminar este comentario"
                    ? 403
                    : 500;
            logger.error(
                `[Comentarios Controller] Error al eliminar comentario: ${error.message}`,
            );
            return res.status(statusCode).json({
                error: {
                    message: error.message || "Error interno",
                    status: statusCode,
                },
            });
        }
    }

    return { crearComentario, obtenerComentarios, eliminarComentario };
}

module.exports = createComentariosController;
