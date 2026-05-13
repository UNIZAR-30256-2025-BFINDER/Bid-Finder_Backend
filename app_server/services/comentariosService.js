/**
 * @fileoverview Servicio de gestión de comentarios.
 * Conecta las reglas de validación de negocio con el repositorio de datos subyacente.
 */

/**
 * Crea el servicio inyectando su repositorio correspondiente.
 * @param {Object} comentariosRepository - Repositorio de persistencia de Mongo.
 * @returns {Object} Interfaz de métodos del servicio.
 */
function createComentariosService(comentariosRepository) {
    /**
     * Valida y crea un nuevo comentario para un activo.
     * @param {string} subasta_id - ID de la subasta a comentar.
     * @param {string} usuario_id - ID del usuario autor del comentario.
     * @param {string} texto - Cuerpo del mensaje.
     * @returns {Promise<Object>} Comentario creado y poblado.
     * @throws {Error} Si el texto está vacío o es puro espacio en blanco.
     */
    async function crearComentario(subasta_id, usuario_id, texto) {
        if (!texto || texto.trim().length === 0) {
            throw new Error("El texto del comentario no puede estar vacío");
        }

        return await comentariosRepository.save({
            subasta_id,
            usuario_id,
            texto: texto.trim(),
        });
    }

    /**
     * Recupera el hilo completo de mensajes asociados a un activo.
     * @param {string} subasta_id - ID del BOE de la subasta.
     * @returns {Promise<Array>} Lista de comentarios ordenados temporalmente.
     */
    async function obtenerComentariosPorSubasta(subasta_id) {
        return await comentariosRepository.findBySubastaId(subasta_id);
    }

    /**
     * Recupera todos los comentarios de la plataforma con paginación (para administración).
     * @param {number} page - Página actual solicitada.
     * @param {number} limit - Cantidad de elementos por página.
     * @returns {Promise<Object>} Objeto con la lista global paginada y el total.
     */
    async function obtenerTodosLosComentarios(page = 1, limit = 10) {
        const pageNumber = Math.max(1, page);
        const limitNumber = Math.max(1, limit);
        
        const skip = (pageNumber - 1) * limitNumber;
        
        return await comentariosRepository.findAll(skip, limitNumber);
    }

    /**
     * Elimina el comentario proporcionado.
     * @param {string} comentarioId - ID del comentario a eliminar.
     * @returns {Promise<Array>} Lista de comentarios ordenados temporalmente.
     */
    async function eliminarComentario(comentarioId, userId, userRole) {
        const comentario = await comentariosRepository.findById(comentarioId);

        if (!comentario) {
            throw new Error("Comentario no encontrado");
        }

        if (
            userRole !== "admin" &&
            comentario.usuario_id.toString() !== userId
        ) {
            throw new Error(
                "No autorizado para eliminar este comentario. Se requiere privilegios de administrador.",
            );
        }

        return await comentariosRepository.deleteById(comentarioId);
    }

    return {
        crearComentario,
        obtenerComentariosPorSubasta,
        obtenerTodosLosComentarios,
        eliminarComentario,
    };
}

module.exports = createComentariosService;
