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
     * Elimina el comentario proporcionado.
     * @param {string} comentarioId - ID del comentario a eliminar.
     * @returns {Promise<Array>} Lista de comentarios ordenados temporalmente.
     */
    async function eliminarComentario(comentarioId, userId, userRole) {
        // Validaciones adicionales (opcional): comprobar que el comentario existe
        const comentario = await comentariosRepository.findById(comentarioId);
        if (!comentario) {
            throw new Error("Comentario no encontrado");
        }
        const esAdmin = userRole === "admin";
        const esAutor = comentario.usuario_id.toString() === userId;
        if (!esAdmin && !esAutor) {
            throw new Error("No autorizado para eliminar este comentario");
        }
        // Llamada al repositorio
        return await comentariosRepository.deleteById(comentarioId);
    }

    return {
        crearComentario,
        obtenerComentariosPorSubasta,
        eliminarComentario,
    };
}

module.exports = createComentariosService;
