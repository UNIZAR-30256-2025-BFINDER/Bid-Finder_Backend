/**
 * @fileoverview Configuración y conexión a la base de datos MongoDB.
 */

const mongoose = require("mongoose");
require("dotenv").config();

/**
 * Establece la conexión asíncrona con la base de datos utilizando Mongoose.
 * Termina el proceso de Node si la conexión falla de manera crítica.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        await mongoose.connect(mongoURI);
        console.log("✅ MongoDB conectado correctamente");
    } catch (error) {
        console.error("❌ Error al conectar MongoDB:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;