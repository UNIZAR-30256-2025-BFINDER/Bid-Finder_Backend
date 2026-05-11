/**
 * @fileoverview Servicio de autenticación.
 * Contiene la lógica de negocio para el registro, login y generación de JWT.
 */

const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken');

/**
 * Función auxiliar para generar un par de tokens (Access y Refresh).
 * @param {string} id - El ID interno del usuario en la base de datos.
 * @returns {{accessToken: string, refreshToken: string}} Objeto con ambos tokens firmados.
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
 * Registra un nuevo usuario validando que el correo no exista previamente.
 * @param {Object} datosUsuario - Objeto con { nombre, email, password }.
 * @returns {Promise<Object>} Datos de sesión del usuario (sin contraseña) y sus tokens.
 * @throws {Error} Si el correo ya está registrado en el sistema.
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
 * Autentica un usuario verificando su email y contraseña.
 * @param {string} email - Correo del usuario.
 * @param {string} password - Contraseña en texto plano.
 * @returns {Promise<Object>} Datos de sesión del usuario y nuevos tokens.
 * @throws {Error} Si el usuario no existe o la contraseña es incorrecta (401).
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
 * Renueva el Access Token de un usuario utilizando su Refresh Token vigente.
 * @param {string} refreshTokenViejo - Refresh Token almacenado por el cliente.
 * @returns {Promise<{accessToken: string, refreshToken: string}>} Nuevo par de tokens.
 * @throws {Error} Si el token es inválido, ha expirado o no coincide con la BD.
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
    } catch { 
        const err = new Error('Refresh token expirado o inválido. Inicia sesión de nuevo.');
        err.statusCode = 401;
        throw err;
    }
}

module.exports = { registrarUsuario, loginUsuario, renovarToken };