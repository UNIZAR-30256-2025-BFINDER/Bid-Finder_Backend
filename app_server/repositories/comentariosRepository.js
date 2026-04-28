const Comentario = require('../models/comentario');

function createComentariosRepository() {
    async function save(comentarioData) {
        const comentario = new Comentario(comentarioData);
        await comentario.save();
        return await comentario.populate('usuario_id', 'nombre');
    }

    async function findBySubastaId(subasta_id) {
        return await Comentario.find({ subasta_id })
            .populate('usuario_id', 'nombre')
            .sort({ createdAt: -1 }); 
    }

    return { save, findBySubastaId };
}

module.exports = createComentariosRepository;