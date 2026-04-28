/**
 * @fileoverview Middleware para proteger rutas privadas y validar roles.
 */

const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');

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
        req.user = { id: decoded.id };
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
 * Middleware para restringir el acceso solo a administradores.
 * Debe ejecutarse siempre después de `protect`.
 */
const isAdmin = async (req, res, next) => {
    try {
        const usuario = await Usuario.findById(req.user.id);

        if (!usuario || usuario.rol !== 'admin') {
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