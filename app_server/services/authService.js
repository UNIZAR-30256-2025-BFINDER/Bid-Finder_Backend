/**
 * @fileoverview Servicio de autenticación.
 * Contiene la lógica de negocio para el registro, login y generación de JWT.
 */

const jwt = require('jsonwebtoken');

/**
 * Fábrica para instanciar el servicio de autenticación.
 * @param {Object} usuariosRepository - Repositorio de acceso a datos de usuarios.
 * @returns {Object} Servicio de autenticación configurado.
 */
function createAuthService(usuariosRepository) {
    if (!usuariosRepository) throw new Error('usuariosRepository es requerido');

    /**
     * Función auxiliar para generar un par de tokens (Access y Refresh).
     * @param {string} id - El ID interno del usuario en la base de datos.
     * @param {string} rol - El rol del usuario (ej. 'admin', 'user').
     * @returns {{accessToken: string, refreshToken: string}} Objeto con ambos tokens firmados.
     */
    const generarTokens = (id, rol) => {
        const accessToken = jwt.sign({ id, rol }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        });
        const refreshToken = jwt.sign({ id, rol }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        });
        return { accessToken, refreshToken };
    };

    /**
     * Registra un nuevo usuario validando que el correo no exista previamente.
     * @param {Object} datosUsuario - Objeto con { nombre, email, password }.
     * @returns {Promise<Object>} Datos de sesión del usuario (sin contraseña) y sus tokens.
     */
    async function registrarUsuario(datosUsuario) {
        const { nombre, email, password } = datosUsuario;

        const usuarioExistente = await usuariosRepository.findByEmail(email);
        if (usuarioExistente) {
            const error = new Error('Ya existe un usuario con ese correo electrónico');
            error.statusCode = 400; 
            throw error;
        }

        const usuario = await usuariosRepository.create({
            nombre,
            email,
            password,
        });

        const tokens = generarTokens(usuario._id, usuario.rol);
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
     */
    async function loginUsuario(email, password) {
        const usuario = await usuariosRepository.findByEmail(email, true);
        
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

        const tokens = generarTokens(usuario._id, usuario.rol);
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
     */
    async function renovarToken(refreshTokenViejo) {
        if (!refreshTokenViejo) throw new Error('Refresh token no proporcionado');

        try {
            const decoded = jwt.verify(refreshTokenViejo, process.env.JWT_REFRESH_SECRET);

            const usuario = await usuariosRepository.findById(decoded.id, true);
            if (!usuario || usuario.refreshToken !== refreshTokenViejo) {
                throw new Error('Refresh token inválido o revocado');
            }

            const tokens = generarTokens(usuario._id, usuario.rol);
            
            usuario.refreshToken = tokens.refreshToken;
            await usuario.save();

            return tokens;
        } catch { 
            const err = new Error('Refresh token expirado o inválido. Inicia sesión de nuevo.');
            err.statusCode = 401;
            throw err;
        }
    }

    return { registrarUsuario, loginUsuario, renovarToken };
}

// Dependencias por defecto para retrocompatibilidad
const createUsuariosRepository = require('../repositories/usuariosRepository');
const defaultUsuariosRepository = createUsuariosRepository();

const defaultService = createAuthService(defaultUsuariosRepository);
defaultService.createAuthService = createAuthService;

module.exports = defaultService;