/**
 * @fileoverview Controlador para la gestión de usuarios en la pestaña de administración.
 * Maneja la obtención de usuarios asociados a un activo.
 */

/**
 * Crea el controlador de usuarios inyectando sus dependencias.
 * @param {Object} usuariosService - Servicio con la lógica de base de datos de usuarios.
 * @param {Object} logger - Sistema de logs de la aplicación.
 * @returns {Object} Métodos del controlador (obtenerUsuarios).
 */
function createUsuariosController(usuariosService, logger) {
    /**
     * Recupera todos los usuarios de la plataforma de forma paginada.
     */
    async function obtenerTodos(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const search = req.query.search || "";

            const resultado = await usuariosService.obtenerTodosLosUsuarios(
                page,
                limit,
                search,
            );

            return res.status(200).json({
                status: "success",
                data: resultado.usuarios,
                pagination: {
                    totalItems: resultado.total,
                    currentPage: page,
                    totalPages: Math.ceil(resultado.total / limit),
                    itemsPerPage: limit,
                },
                metrics: {
                    globalTotal: resultado.globalTotal,
                    globalAdmins: resultado.globalAdmins,
                    filteredTotal: resultado.total,
                    filteredAdmins: resultado.totalAdmins,
                },
            });
        } catch (error) {
            logger.error(
                `[Usuarios Controller] Error al obtener todos los usuarios: ${error.message}`,
                { stack: error.stack },
            );
            return res.status(500).json({
                error: {
                    message: "Error interno al recuperar los usuarios",
                    status: 500,
                },
            });
        }
    }

    return {
        obtenerTodos,
    };
}

module.exports = createUsuariosController;
