/**
 * @fileoverview Servicio de autenticación.
 * Contiene la lógica de negocio para el registro, login y generación de JWT.
 */

const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken');

/**
 * Función auxiliar para generar un JWT
 * @param {string} id - El ID del usuario en la base de datos
 * @returns {string} Token JWT firmado
 */
const generarTokens = (id) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
    const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
};

/**
 * Servicio para registrar un nuevo usuario.
 * @param {Object} datosUsuario - { nombre, email, password }
 * @returns {Promise<Object>} Usuario creado (sin la contraseña) y token
 */
async function registrarUsuario(datosUsuario) {
    const { nombre, email, password } = datosUsuario;

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
        const error = new Error('Ya existe un usuario con ese correo electrónico');
        error.statusCode = 400; 
        throw error;
    }

    const usuario = await Usuario.create({
        nombre,
        email,
        password,
    });

    const tokens = generarTokens(usuario._id);
    usuario.refreshToken = tokens.refreshToken;
    await usuario.save(); 

    return {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        accessToken: tokens.accessToken,   
        refreshToken: tokens.refreshToken 
    };
}

/**
 * Servicio para hacer login de un usuario.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Datos del usuario y token
 */
async function loginUsuario(email, password) {
    const usuario = await Usuario.findOne({ email }).select('+password');
    
    if (!usuario) {
        const error = new Error('Credenciales inválidas');
        error.statusCode = 401; 
        throw error;
    }

    const passwordCorrecta = await usuario.matchPassword(password);
    
    if (!passwordCorrecta) {
        const error = new Error('Credenciales inválidas');
        error.statusCode = 401;
        throw error;
    }

    const tokens = generarTokens(usuario._id);
    usuario.refreshToken = tokens.refreshToken;
    await usuario.save(); 

    return {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        accessToken: tokens.accessToken,   
        refreshToken: tokens.refreshToken  
    };
}

/**
 * Servicio para renovar el Access Token usando un Refresh Token válido
 */
async function renovarToken(refreshTokenViejo) {
    if (!refreshTokenViejo) throw new Error('Refresh token no proporcionado');

    try {
        const decoded = jwt.verify(refreshTokenViejo, process.env.JWT_REFRESH_SECRET);

        const usuario = await Usuario.findById(decoded.id).select('+refreshToken');
        if (!usuario || usuario.refreshToken !== refreshTokenViejo) {
            throw new Error('Refresh token inválido o revocado');
        }

        const tokens = generarTokens(usuario._id);
        
        usuario.refreshToken = tokens.refreshToken;
        await usuario.save();

        return tokens;
    } catch (error) {
        const err = new Error('Refresh token expirado o inválido. Inicia sesión de nuevo.');
        err.statusCode = 401;
        throw err;
    }
}

module.exports = {
    registrarUsuario,
    loginUsuario,
    renovarToken 
};