/**
 * @fileoverview Modelo de datos para los Usuarios de la plataforma.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
            select: false,
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
    },
);

/**
 * Encriptar contraseña antes de guardar en la base de datos.
 */
usuarioSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Comparar la contraseña ingresada por el usuario
 * en el login con la contraseña encriptada guardada en la base de datos.
 * @param {string} enteredPassword - Contraseña en texto plano
 * @returns {boolean} True si coinciden, False si no.
 */
usuarioSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Usuario", usuarioSchema);
