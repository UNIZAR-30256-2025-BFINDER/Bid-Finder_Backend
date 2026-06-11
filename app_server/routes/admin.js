/**
 * @fileoverview Definición de rutas para el panel de administración.
 * Expone endpoints protegidos para la monitorización de la salud, métricas del sistema y moderación.
 */

const express = require("express");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

const createSystemController = require("../controllers/systemController");
const createComentariosController = require("../controllers/comentariosController");
const createUsuariosController = require("../controllers/usuariosController");

/**
 * Fábrica para instanciar el router de administración con inyección de dependencias.
 * @param {Object} systemService - Servicio del sistema.
 * @param {Object} comentariosService - Servicio de comentarios.
 * @param {Object} usuariosService - Servicio de usuarios.
 * @returns {import('express').Router} Router de Express configurado.
 */
function createAdminRouter(systemService, comentariosService, usuariosService) {
    const router = express.Router();

    const systemController = createSystemController(systemService, logger);
    const adminComentariosController = createComentariosController(comentariosService, logger);
    const adminUsuariosController = createUsuariosController(usuariosService, logger);

    /**
     * @swagger
     * tags:
     *   - name: Admin
     *     description: Rutas exclusivas para la administración del sistema
     */

    router.get("/status", protect, isAdmin, systemController.getEstadoSistema);
    
    router.get(
        "/comentarios",
        protect,
        isAdmin,
        adminComentariosController.obtenerTodos,
    );

    router.get("/usuarios", protect, isAdmin, adminUsuariosController.obtenerTodos);

    return router;
}

// Dependencias por defecto para retrocompatibilidad
const createSubastasRepository = require("../repositories/subastasRepository");
const createSystemService = require("../services/systemService");

const createComentariosRepository = require("../repositories/comentariosRepository");
const createComentariosService = require("../services/comentariosService");

const createUsuariosRepository = require("../repositories/usuariosRepository");
const createUsuariosService = require("../services/usuariosService");

const defaultSubastasRepository = createSubastasRepository();
const defaultSystemService = createSystemService(defaultSubastasRepository);

const defaultComentariosRepository = createComentariosRepository();
const defaultComentariosService = createComentariosService(defaultComentariosRepository);

const defaultUsuariosRepository = createUsuariosRepository();
const defaultUsuariosService = createUsuariosService(defaultUsuariosRepository);

const defaultRouter = createAdminRouter(
    defaultSystemService,
    defaultComentariosService,
    defaultUsuariosService
);
defaultRouter.createAdminRouter = createAdminRouter;

module.exports = defaultRouter;
