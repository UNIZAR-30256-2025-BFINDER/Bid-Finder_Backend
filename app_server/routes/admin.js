/**
 * @fileoverview Definición de rutas para el panel de administración.
 * Expone endpoints protegidos para la monitorización de la salud y métricas del sistema.
 */

const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

const createSubastasRepository = require('../repositories/subastasRepository');
const createSystemService = require('../services/systemService');
const createSystemController = require('../controllers/systemController');

const subastasRepository = createSubastasRepository();
const systemService = createSystemService(subastasRepository);
const systemController = createSystemController(systemService, logger);

/**
 * @swagger
 * tags:
 * - name: Admin
 * description: Rutas exclusivas para la administración del sistema
 */

/**
 * @swagger
 * /admin/status:
 *   get:
 *     summary: Obtiene los KPIs y el estado actual del sistema
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del sistema obtenido correctamente
 *       401:
 *         description: No autorizado (Token faltante o inválido)
 *       403:
 *         description: Prohibido (El usuario no tiene rol de admin)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/status', protect, isAdmin, systemController.getEstadoSistema);

module.exports = router;