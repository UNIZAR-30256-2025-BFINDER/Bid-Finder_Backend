/**
 * @fileoverview Modelo de datos para las Subastas (anteriormente Anuncios/Lotes).
 * Cada documento en la colección representa una subasta (o lote) de forma plana e independiente.
 */

const mongoose = require("mongoose");
const { SUBASTA } = require("../config/constants");

const NIVEL_OPORTUNIDAD_PRIORIDAD = SUBASTA.NIVEL_OPORTUNIDAD_PRIORIDAD;
const CATEGORIAS_PERMITIDAS = SUBASTA.CATEGORIAS_PERMITIDAS;

const subastaSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        anuncio_id: {
            type: String,
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
        rawXml: {
            type: String,
            required: true,
        },
        fechaExtraccion: {
            type: Date,
            default: Date.now,
        },
        fechaFinalizacion: {
            type: String, 
            default: null,
            index: true,
        },
        numero_lote: {
            type: Number,
            default: 1,
        },
        total_lotes: {
            type: Number,
            default: 1,
        },
        all_lotes: {
            type: Array,
            default: undefined,
        },
        titulo_resumido: {
            type: String,
            default: null,
        },
        resumen: {
            type: String,
            default: null,
        },
        categoria: {
            type: String,
            enum: CATEGORIAS_PERMITIDAS,
            default: null,
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
        },
        direccion: {
            type: String,
            default: null,
        },
        zona: {
            type: String,
            default: null,
        },
        referencia_catastral: {
            type: String,
            default: null,
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
        riesgo_legal: {
            type: String,
            enum: ["ALTO", "MEDIO", "BAJO"],
            default: null,
        },
        viabilidad: {
            type: String,
            enum: ["ALTA", "MEDIA", "BAJA"],
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

subastaSchema.index({ "location": "2dsphere" });
subastaSchema.index({ fechaPublicacion: -1 });
subastaSchema.index({ "categoria": 1 });
subastaSchema.index({ "nivel_oportunidad": 1 });

subastaSchema.index(
    {
        "titulo_resumido": "text",
        "resumen": "text",
        "titulo": "text",
        "categoria": "text",
        "texto": "text",
        "direccion": "text",
        "zona": "text",
        "cargas_previas": "text",
        "id": "text",
        "referencia_catastral": "text",
        "riesgo_legal": "text",
    },
    {
        weights: {
            "titulo_resumido": 10,
            titulo: 8,
            categoria: 6,
            resumen: 5,
            direccion: 4,
            zona: 4,
            id: 3,
            referencia_catastral: 3,
            cargas_previas: 2,
            riesgo_legal: 2,
            texto: 1,
        },
        name: "TextIndexCompleto",
    }
);

const Subasta = mongoose.model("Subasta", subastaSchema, "subastas");
Subasta.NIVEL_OPORTUNIDAD_PRIORIDAD = NIVEL_OPORTUNIDAD_PRIORIDAD;
Subasta.CATEGORIAS_PERMITIDAS = CATEGORIAS_PERMITIDAS;

module.exports = Subasta;