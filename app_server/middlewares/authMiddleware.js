/**
 * @fileoverview Middleware para proteger rutas privadas.
 * Verifica la validez y expiración del JSON Web Token (JWT).
 */

const jwt = require('jsonwebtoken');

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

module.exports = { protect };