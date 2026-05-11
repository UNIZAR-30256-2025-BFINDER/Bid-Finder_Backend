/**
 * @fileoverview Modelo de datos principal para las Subastas.
 * Integra campos crudos extraídos del BOE y campos procesados por la IA.
 * Incluye configuración avanzada de índices geoespaciales y de texto.
 */

const mongoose = require("mongoose");
const NIVEL_OPORTUNIDAD_PRIORIDAD = ["ALTO", "MEDIO", "BAJO"];
const CATEGORIAS_PERMITIDAS = ["INMUEBLE", "VEHICULO", "MAQUINARIA", "OTROS"];

/**
 * Esquema de Mongoose para la colección de subastas.
 */
const subastaSchema = new mongoose.Schema(
    {
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
            type: String, 
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
        categoria: {
            type: String,
            enum: CATEGORIAS_PERMITIDAS,
            default: null,
            index: true,
        },
        rawXml: {
            type: String,
            required: true,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: false,
                default: undefined,
            },
            coordinates: {
                type: [Number],
                required: false,
                default: undefined,
            },
        },
        fechaExtraccion: {
            type: Date,
            default: Date.now,
        },
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
        timestamps: true, 
    }
);

// Índice geoespacial para búsquedas por proximidad y bounding boxes
subastaSchema.index({ location: "2dsphere" });

// Crear índice compuesto para búsquedas temporales
subastaSchema.index({ fechaPublicacion: -1 });

// Índice de texto múltiple con pesos para optimizar la búsqueda global (Full-Text Search)
subastaSchema.index({
    titulo_resumido: "text",
    resumen: "text",
    titulo: "text",
    categoria: "text",
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
        categoria: 6,
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
Subasta.CATEGORIAS_PERMITIDAS = CATEGORIAS_PERMITIDAS;

module.exports = Subasta;