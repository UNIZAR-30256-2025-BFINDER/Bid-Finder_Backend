/**
 * @fileoverview Definición de rutas para el panel de administración.
 * Expone endpoints protegidos para la monitorización de la salud, métricas del sistema y moderación.
 */

const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

const createSubastasRepository = require("../repositories/subastasRepository");
const createSystemService = require("../services/systemService");
const createSystemController = require("../controllers/systemController");

const createComentariosRepository = require("../repositories/comentariosRepository");
const createComentariosService = require("../services/comentariosService");
const createComentariosController = require("../controllers/comentariosController");

const createUsuariosRepository = require("../repositories/usuariosRepository");
const createUsuariosService = require("../services/usuariosService");
const createUsuariosController = require("../controllers/usuariosController");

const subastasRepository = createSubastasRepository();
const systemService = createSystemService(subastasRepository);
const systemController = createSystemController(systemService, logger);

const comentariosRepository = createComentariosRepository();
const comentariosService = createComentariosService(comentariosRepository);
const adminComentariosController = createComentariosController(
    comentariosService,
    logger,
);

const usuariosRepository = createUsuariosRepository();
const usuariosService = createUsuariosService(usuariosRepository);
const adminUsuariosController = createUsuariosController(
    usuariosService,
    logger,
);

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
router.get("/status", protect, isAdmin, systemController.getEstadoSistema);

/**
 * @swagger
 * /admin/comentarios:
 *   get:
 *     summary: Obtiene todos los comentarios de la plataforma para moderación
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista global de comentarios obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (El usuario no tiene rol de admin)
 *       500:
 *         description: Error interno del servidor
 */
router.get(
    "/comentarios",
    protect,
    isAdmin,
    adminComentariosController.obtenerTodos,
);

/**
 * @swagger
 * /admin/comentarios:
 *   get:
 *     summary: Obtiene todos los usuarios de la plataforma para moderación
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista global de usuarios obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (El usuario no tiene rol de admin)
 *       500:
 *         description: Error interno del servidor
 */
router.get("/usuarios", protect, isAdmin, adminUsuariosController.obtenerTodos);

module.exports = router;
