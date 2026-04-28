function createComentariosService(comentariosRepository) {
    
    async function crearComentario(subasta_id, usuario_id, texto) {
        if (!texto || texto.trim().length === 0) {
            throw new Error('El texto del comentario no puede estar vacío');
        }
        
        return await comentariosRepository.save({
            subasta_id,
            usuario_id,
            texto: texto.trim()
        });
    }

    async function obtenerComentariosPorSubasta(subasta_id) {
        return await comentariosRepository.findBySubastaId(subasta_id);
    }

    return { crearComentario, obtenerComentariosPorSubasta };
}

module.exports = createComentariosService;