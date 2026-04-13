/**
 * @fileoverview Controlador para la autenticación.
 * Gestiona las peticiones HTTP de registro y login.
 */

const authService = require('../services/authService');

const register = async (req, res, next) => {
    try {
        const result = await authService.registrarUsuario(req.body);
        
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const error = new Error('Por favor, proporciona email y contraseña');
            error.statusCode = 400;
            throw error;
        }

        const result = await authService.loginUsuario(email, password);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body; 
        const tokens = await authService.renovarToken(refreshToken);
        
        res.status(200).json({
            success: true,
            data: tokens
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshToken
};