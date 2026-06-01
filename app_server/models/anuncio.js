/**
 * @fileoverview Modelo de datos para los Anuncios de Subastas.
 * Cada documento representa un anuncio del BOE que puede contener una o más subastas.
 * Los metadatos comunes del expediente se almacenan a nivel de anuncio, mientras que los datos
 * específicos de cada bien se almacenan en el array de subastas.
 */

const mongoose = require("mongoose");
const { subastaSchema, NIVEL_OPORTUNIDAD_PRIORIDAD, CATEGORIAS_PERMITIDAS } = require("./subasta");

/**
 * Esquema principal del Anuncio de Subasta.
 * Contiene los metadatos comunes del anuncio del BOE y un array de subastas individuales.
 */
const anuncioSchema = new mongoose.Schema(
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
        rawXml: {
            type: String,
            required: true,
        },
        fechaExtraccion: {
            type: Date,
            default: Date.now,
        },
        subastas: {
            type: [subastaSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

anuncioSchema.index({ "subastas.location": "2dsphere" });

anuncioSchema.index({ fechaPublicacion: -1 });

anuncioSchema.index({ "subastas.categoria": 1 });
anuncioSchema.index({ "subastas.nivel_oportunidad": 1 });

anuncioSchema.index(
    {
        "subastas.titulo_resumido": "text",
        "subastas.resumen": "text",
        titulo: "text",
        "subastas.categoria": "text",
        texto: "text",
        "subastas.direccion": "text",
        "subastas.zona": "text",
        "subastas.cargas_previas": "text",
        id: "text",
        "subastas.referencia_catastral": "text",
        "subastas.riesgo_legal": "text",
    },
    {
        weights: {
            "subastas.titulo_resumido": 10,
            titulo: 8,
            "subastas.categoria": 6,
            "subastas.resumen": 5,
            "subastas.direccion": 4,
            "subastas.zona": 4,
            id: 3,
            "subastas.referencia_catastral": 3,
            "subastas.cargas_previas": 2,
            "subastas.riesgo_legal": 2,
            texto: 1,
        },
        name: "TextIndexCompleto",
    }
);

const Anuncio = mongoose.model("Anuncio", anuncioSchema, "subastas");
Anuncio.NIVEL_OPORTUNIDAD_PRIORIDAD = NIVEL_OPORTUNIDAD_PRIORIDAD;
Anuncio.CATEGORIAS_PERMITIDAS = CATEGORIAS_PERMITIDAS;

module.exports = Anuncio;
