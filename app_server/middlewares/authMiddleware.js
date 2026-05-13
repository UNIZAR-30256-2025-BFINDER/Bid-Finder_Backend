/**
 * @fileoverview Middleware para proteger rutas privadas y validar roles de usuario.
 * Utiliza JSON Web Tokens para la autenticación.
 */

const jwt = require('jsonwebtoken');

/**
 * Verifica la validez del token JWT en la cabecera de la petición.
 * Si es válido, inyecta el ID y el ROL del usuario en `req.user` y permite continuar.
 * @param {Object} req - Objeto de la petición HTTP de Express.
 * @param {Object} res - Objeto de la respuesta HTTP de Express.
 * @param {Function} next - Función para ceder el control al siguiente middleware o controlador.
 * @returns {Promise<Object|void>} Respuesta 401 si falla, o void si tiene éxito.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. No se encontró un token de autorización.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { 
            id: decoded.id,
            rol: decoded.rol
        }; 
        next();
    } catch (error) {
        let mensaje = 'Token inválido o corrupto.';
        if (error.name === 'TokenExpiredError') {
            mensaje = 'Tu sesión ha expirado (8 horas). Por favor, inicia sesión de nuevo.';
        }

        return res.status(401).json({
            success: false,
            message: mensaje
        });
    }
};

/**
 * Restringe el acceso exclusivamente a usuarios con rol de administrador.
 * IMPORTANTE: Debe ejecutarse siempre en la cadena de middleware DESPUÉS de `protect`.
 * @param {Object} req - Objeto de la petición HTTP (debe contener req.user inyectado).
 * @param {Object} res - Objeto de la respuesta HTTP.
 * @param {Function} next - Función para ceder el control al siguiente middleware.
 * @returns {Promise<Object|void>} Respuesta 403/500 si falla, o void si tiene éxito.
 */
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren privilegios de administrador.'
            });
        }

        next();
    } catch {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar los permisos del usuario.'
        });
    }
};

module.exports = { protect, isAdmin };