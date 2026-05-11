/**
 * @fileoverview Definición de rutas públicas para la autenticación.
 * Gestiona el registro, inicio de sesión y renovación de tokens JWT.
 */

const express = require('express');
const router = express.Router();
const createAuthController = require('../controllers/authController');
const authService = require('../services/authService');

const authController = createAuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

module.exports = router;