const mongoose = require("mongoose");
require("dotenv").config(); // Cargar variables de entorno desde .env

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
