/**
 * @fileoverview Definición de rutas públicas para la autenticación.
 * Gestiona el registro, inicio de sesión y renovación de tokens JWT.
 */

const express = require('express');
const createAuthController = require('../controllers/authController');

/**
 * Fábrica para instanciar el router de autenticación con inyección de dependencias.
 * @param {Object} authService - Servicio de autenticación.
 * @returns {import('express').Router} Router de Express configurado.
 */
function createAuthRouter(authService) {
    const router = express.Router();
    const authController = createAuthController(authService);

    router.post('/register', authController.register);
    router.post('/login', authController.login);
    router.post('/refresh', authController.refreshToken);

    return router;
}

// Dependencias por defecto para retrocompatibilidad
const defaultAuthService = require('../services/authService');

const defaultRouter = createAuthRouter(defaultAuthService);
defaultRouter.createAuthRouter = createAuthRouter;

module.exports = defaultRouter;