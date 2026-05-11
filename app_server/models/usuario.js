/**
 * @fileoverview Modelo de datos para los Usuarios de la plataforma.
 * Implementa cifrado de contraseñas mediante hooks de Mongoose (bcrypt).
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * Esquema de Mongoose para la colección de usuarios.
 */
const usuarioSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, "El nombre es obligatorio"],
            trim: true,
            maxlength: [50, "El nombre no puede tener más de 50 caracteres"],
        },
        email: {
            type: String,
            required: [true, "El email es obligatorio"],
            unique: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Por favor, añade un email válido",
            ],
        },
        password: {
            type: String,
            required: [true, "La contraseña es obligatoria"],
            minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
            select: false, // Por seguridad, excluye la contraseña en las consultas por defecto
        },
        refreshToken: {
            type: String,
            select: false,
        },
        rol: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        fechaRegistro: {
            type: Date,
            default: Date.now,
        },
        favoritos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Subasta",
            },
        ],
    },
    {
        timestamps: true,
    }
);

/**
 * Middleware 'pre-save' de Mongoose.
 * Intercepta el guardado del documento para cifrar la contraseña con bcrypt
 * si (y solo si) el campo 'password' ha sido modificado.
 */
usuarioSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/**
 * Método de instancia para verificar la contraseña ingresada en el inicio de sesión.
 * Compara el texto plano con el hash guardado en la base de datos.
 * @param {string} enteredPassword - Contraseña en texto plano a verificar.
 * @returns {Promise<boolean>} Devuelve True si las contraseñas coinciden.
 */
usuarioSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Usuario", usuarioSchema);