/**
 * @fileoverview Modelo de datos para los Comentarios de las subastas.
 */
const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
    subasta_id: {
        type: String, 
        required: [true, 'El ID de la subasta es obligatorio'],
        index: true 
    },
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', 
        required: [true, 'El ID del usuario es obligatorio']
    },
    texto: {
        type: String,
        required: [true, 'El texto del comentario no puede estar vacío'],
        trim: true,
        maxlength: [1000, 'El comentario no puede exceder los 1000 caracteres']
    }
}, {
    // Crea automáticamente los campos 'createdAt' y 'updatedAt'.
    timestamps: true 
});

comentarioSchema.index({ subasta_id: 1, createdAt: -1 });

module.exports = mongoose.model('Comentario', comentarioSchema);