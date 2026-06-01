/**
 * @fileoverview Modelo de Mongoose para almacenar en caché los datos oficiales del Catastro.
 * Evita realizar llamadas redundantes a las APIs gubernamentales, respetando límites de peticiones.
 */

const mongoose = require("mongoose");

const catastroDataSchema = new mongoose.Schema(
    {
        referenciaCatastral: {
            type: String,
            required: true,
            unique: true,
            index: true,
            uppercase: true,
            trim: true,
        },
        clase: {
            type: String,
            default: "Desconocido",
        },
        usoPrincipal: {
            type: String,
            default: "Desconocido",
        },
        superficieConstruida: {
            type: Number,
            default: null,
        },
        superficieGrafica: {
            type: Number,
            default: null,
        },
        anoConstruccion: {
            type: Number,
            default: null,
        },
        direccion: {
            type: String,
            default: "Desconocida",
        },
        coordenadas: {
            lat: {
                type: Number,
                default: null,
            },
            lng: {
                type: Number,
                default: null,
            },
        },
        participacion: {
            type: String,
            default: null,
        },
        // Almacenamos la fecha de consulta para poder invalidar/actualizar la caché en el futuro si es necesario
        fechaConsulta: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Índice geoespacial si quisiéramos buscar por proximidad
catastroDataSchema.index({ "coordenadas": "2dsphere" });

const CatastroData = mongoose.model("CatastroData", catastroDataSchema, "catastro_cache");

module.exports = CatastroData;
