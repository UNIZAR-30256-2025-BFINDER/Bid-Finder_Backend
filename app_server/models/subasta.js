const mongoose = require("mongoose");
const NIVEL_OPORTUNIDAD_PRIORIDAD = ["ALTO", "MEDIO", "BAJO"];


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
            enum: ["PENDIENTE", "PROCESADO", "ERROR"],
            default: "PENDIENTE",
            index: true,
        },
        precio_salida: {
            type: Number,
            default: null,
        },
        valor_tasacion: {
            type: Number,
            default: null,
        },
        diferencia_porcentual_oportunidad: {
            type: Number,
            default: null,
        },
        nivel_oportunidad: {
            type: String,
            enum: NIVEL_OPORTUNIDAD_PRIORIDAD,
            default: null,
            index: true,
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
        zona: {
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
                enum: ["Point"],
                required: false,
                default: undefined,
            },
            coordinates: {
                type: [Number], // [lon, lat]
                required: false,
                default: undefined,
            },
        },
        // Fecha de extracción (se asigna automáticamente al crear)
        fechaExtraccion: {
            type: Date,
            default: Date.now,
        },
        // Campos de riesgo legal, ocupación y cargas, extraídos por la IA
        riesgo_legal: {
            type: String,
            enum: ["Alto", "Medio", "Bajo"],
            default: null,
        },
        ocupantes: {
            type: String,
            default: null,
        },
        cargas_previas: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true, // añade createdAt y updatedAt automáticamente
    },
);

// Índice geoespacial para búsquedas por proximidad
subastaSchema.index({ location: "2dsphere" });

// Crear índice compuesto si se necesita alguna búsqueda adicional
subastaSchema.index({ fechaPublicacion: -1 });

subastaSchema.index({
    titulo_resumido: "text",
    resumen: "text",
    titulo: "text",
    texto: "text",
    direccion: "text",
    zona: "text",
    cargas_previas: "text",
    id: "text",
    referencia_catastral: "text",
    riesgo_legal: "text"
}, {
    weights: {
        titulo_resumido: 10,
        titulo: 8,
        resumen: 5,
        direccion: 4,
        zona: 4,
        id: 3,
        referencia_catastral: 3,
        cargas_previas: 2,
        riesgo_legal: 2,
        texto: 1
    },
    name: "TextIndexCompleto"
});

const Subasta = mongoose.model("Subasta", subastaSchema);
Subasta.NIVEL_OPORTUNIDAD_PRIORIDAD = NIVEL_OPORTUNIDAD_PRIORIDAD;
module.exports = Subasta;
