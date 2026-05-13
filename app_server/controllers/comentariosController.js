/**
 * @fileoverview Controlador para la gestión de comentarios en el foro de subastas.
 * Maneja la creación y obtención de comentarios asociados a un activo.
 */

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

    /**
     * Recupera todos los comentarios de la plataforma de forma paginada.
     */
    async function obtenerTodos(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const search = req.query.search || "";

            const resultado =
                await comentariosService.obtenerTodosLosComentarios(
                    page,
                    limit,
                    search,
                );

            return res.status(200).json({
                status: "success",
                data: resultado.comentarios,
                pagination: {
                    totalItems: resultado.total,
                    currentPage: page,
                    totalPages: Math.ceil(resultado.total / limit),
                    itemsPerPage: limit,
                },
            });
        } catch (error) {
            logger.error(
                `[Comentarios Controller] Error al obtener todos los comentarios: ${error.message}`,
                { stack: error.stack },
            );
            return res.status(500).json({
                error: {
                    message:
                        "Error interno al recuperar los comentarios globales",
                    status: 500,
                },
            });
        }
    }

    /**
     * Elimina un comentario específico de una subasta (restringido a administradores).
     * @param {Object} req - Objeto de petición de Express (requiere req.user y req.params.comentarioId).
     * @param {Object} res - Objeto de respuesta de Express.
     * @returns {Promise<Object>} Respuesta JSON confirmando la eliminación o devolviendo un error.
     */
    async function eliminarComentario(req, res) {
        try {
            const { comentarioId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.rol;

            await comentariosService.eliminarComentario(
                comentarioId,
                userId,
                userRole,
            );

            return res.status(200).json({
                status: "success",
                message: "Comentario eliminado permanentemente",
                data: { _id: comentarioId },
            });
        } catch (error) {
            logger.error(
                `[Comentarios Controller] Error al eliminar comentario: ${error.message}`,
            );

            let statusCode = 500;
            if (error.message.includes("No autorizado")) statusCode = 403;
            if (error.message.includes("no encontrado")) statusCode = 404;

            return res.status(statusCode).json({
                error: {
                    message:
                        error.message ||
                        "Error interno al eliminar el comentario",
                    status: statusCode,
                },
            });
        }
    }

    return {
        crearComentario,
        obtenerComentarios,
        obtenerTodos,
        eliminarComentario,
    };
}

module.exports = createComentariosController;
