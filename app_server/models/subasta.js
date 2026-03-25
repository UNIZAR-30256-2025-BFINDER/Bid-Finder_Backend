const mongoose = require("mongoose");

const subastaSchema = new mongoose.Schema(
    {
        // Identificador único del BOE (ej: "BOE-B-2026-112")
        id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        titulo: {
            type: String,
            required: true,
        },
        fechaPublicacion: {
            type: String, // formato YYYYMMDD
            required: true,
        },
        urlPdf: {
            type: String,
            required: true,
        },
        texto: {
            type: String,
            required: true,
        },
        // XML original recibido
        rawXml: {
            type: String,
            required: true,
        },
        // Fecha de extracción (se asigna automáticamente al crear)
        fechaExtraccion: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // añade createdAt y updatedAt automáticamente
    },
);

// Crear índice compuesto si se necesita alguna búsqueda adicional
subastaSchema.index({ fechaPublicacion: -1 });

module.exports = mongoose.model("Subasta", subastaSchema);
