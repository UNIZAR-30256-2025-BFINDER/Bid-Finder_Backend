/**
 * @fileoverview Modelo de datos para los Comentarios de las subastas.
 * Define el esquema de Mongoose y las relaciones con Subastas y Usuarios.
 */

const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la colección de comentarios.
 */
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
    timestamps: true 
});

// Índice compuesto para optimizar la carga de comentarios de una subasta ordenados por fecha
comentarioSchema.index({ subasta_id: 1, createdAt: -1 });

module.exports = mongoose.model('Comentario', comentarioSchema);