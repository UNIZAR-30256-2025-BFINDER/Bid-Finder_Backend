/**
 * @fileoverview Repositorio de acceso a datos para la colección de Comentarios.
 * Encapsula las operaciones de lectura y escritura en MongoDB mediante Mongoose.
 */

const Comentario = require('../models/comentario');

/**
 * Crea una instancia del repositorio de comentarios.
 * @returns {Object} Métodos de acceso a datos (save, findBySubastaId).
 */
function createComentariosRepository() {
    
    /**
     * Guarda un nuevo comentario en la base de datos y adjunta los datos del usuario.
     * @param {Object} comentarioData - Objeto con los datos del comentario (subasta_id, usuario_id, texto).
     * @returns {Promise<Object>} Documento de Mongoose guardado y poblado con el nombre del usuario.
     */
    async function save(comentarioData) {
        const comentario = new Comentario(comentarioData);
        await comentario.save();
        return await comentario.populate('usuario_id', 'nombre');
    }

    /**
     * Recupera todos los comentarios asociados a una subasta, ordenados del más reciente al más antiguo.
     * @param {string} subasta_id - Identificador único de la subasta.
     * @returns {Promise<Array>} Array de documentos de Mongoose.
     */
    async function findBySubastaId(subasta_id) {
        return await Comentario.find({ subasta_id })
            .populate('usuario_id', 'nombre')
            .sort({ createdAt: -1 }); 
    }

    return { save, findBySubastaId };
}

module.exports = createComentariosRepository;