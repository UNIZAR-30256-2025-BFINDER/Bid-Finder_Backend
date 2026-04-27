function createComentariosController(comentariosService, logger) {
    
    async function crearComentario(req, res) {
        try {
            const { id: subasta_id } = req.params;
            const { texto } = req.body;
            const usuario_id = req.user.id; 

            const nuevoComentario = await comentariosService.crearComentario(subasta_id, usuario_id, texto);

            return res.status(201).json({
                status: 'success',
                data: nuevoComentario
            });
        } catch (error) {
            logger.error(`[Comentarios Controller] Error al crear comentario: ${error.message}`, { stack: error.stack });
            const statusCode = error.message.includes('vacío') ? 400 : 500;
            return res.status(statusCode).json({
                error: {
                    message: error.message || 'Error al guardar el comentario',
                    status: statusCode
                }
            });
        }
    }

    async function obtenerComentarios(req, res) {
        try {
            const { id: subasta_id } = req.params;
            const comentarios = await comentariosService.obtenerComentariosPorSubasta(subasta_id);

            return res.status(200).json({
                status: 'success',
                data: comentarios
            });
        } catch (error) {
            logger.error(`[Comentarios Controller] Error al obtener comentarios: ${error.message}`, { stack: error.stack });
            return res.status(500).json({
                error: {
                    message: 'Error interno al buscar los comentarios',
                    status: 500
                }
            });
        }
    }

    return { crearComentario, obtenerComentarios };
}

module.exports = createComentariosController;