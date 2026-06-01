/**
 * @fileoverview Esquema de Mongoose para una Subasta individual (anteriormente denominado Lote).
 * Cada subasta representa un bien concreto (inmueble, vehículo, etc.) con sus propias
 * características, precios, dirección, coordenadas y riesgos legales.
 */

const mongoose = require("mongoose");
const NIVEL_OPORTUNIDAD_PRIORIDAD = ["ALTO", "MEDIO", "BAJO"];
const CATEGORIAS_PERMITIDAS = ["INMUEBLE", "VEHICULO", "MAQUINARIA", "OTROS"];

const subastaSchema = new mongoose.Schema(
    {
        numero_lote: {
            type: Number,
            default: 1,
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
    { _id: false }
);

module.exports = {
    subastaSchema,
    NIVEL_OPORTUNIDAD_PRIORIDAD,
    CATEGORIAS_PERMITIDAS
};