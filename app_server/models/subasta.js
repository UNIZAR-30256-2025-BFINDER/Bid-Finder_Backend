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
        estado_ia: {
            type: String,
            enum: ['PENDIENTE', 'PROCESADO', 'ERROR'],
            default: 'PENDIENTE',
            index: true 
        },
        precio_salida: {
            type: Number,
            default: null,
        },
        valor_tasacion: {
            type: Number,
            default: null,
        },
        direccion: {
            type: String,
            default: null,
        },
        referencia_catastral: {
            type: String,
            default: null,
        },
        titulo_resumido: {
            type: String,
            default: null,
        },
        resumen: {
            type: String,
            default: null,
        },
        // XML original recibido
        rawXml: {
            type: String,
            required: true,
        },
        // Coordenadas geoJSON (Point)
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: false,
                default: undefined
            },
            coordinates: {
                type: [Number], // [lon, lat]
                required: false,
                default: undefined
            }
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


// Índice geoespacial para búsquedas por proximidad
subastaSchema.index({ location: '2dsphere' });

// Crear índice compuesto si se necesita alguna búsqueda adicional
subastaSchema.index({ fechaPublicacion: -1 });

module.exports = mongoose.model("Subasta", subastaSchema);