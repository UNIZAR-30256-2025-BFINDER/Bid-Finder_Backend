/**
 * @fileoverview Definición de rutas públicas principales para la consulta de subastas.
 * Enruta las peticiones anidadas de comentarios delegándolas al `comentariosRouter`.
 */

const express = require("express");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const createSubastasController = require("../controllers/subastasController");
const logger = require("../utils/logger");

/**
 * Fábrica para instanciar el router de subastas con inyección de dependencias.
 * @param {Object} subastasService - Servicio de subastas.
 * @param {import('express').Router} comentariosRouter - Router de comentarios anidado.
 * @returns {import('express').Router} Router de Express configurado.
 */
function createSubastasRouter(subastasService, comentariosRouter) {
    const router = express.Router();
    const subastasController = createSubastasController(subastasService, logger);

    /**
     * @swagger
     * components:
     *   schemas:
     *     Subasta:
     *       type: object
     *       properties:
     *         id:
     *           type: string
     *           description: El ID único de la subasta
     *         titulo:
     *           type: string
     *           description: El título o nombre del artículo a subastar
     *         precioInicial:
     *           type: number
     *           description: El precio base de la subasta
     *         estado:
     *           type: string
     *           description: Estado actual de la subasta (ej. activa, finalizada)
     */

    /**
     * @swagger
     * tags:
     *   - name: Subastas
     *     description: API para la gestión y consulta de subastas
     */

    router.get("/", subastasController.getAllSubastas);
    router.delete("/purge-past", protect, isAdmin, subastasController.purgePastSubastas);
    router.get("/:id", subastasController.getSubastaById);

    if (comentariosRouter) {
        router.use("/:id/comentarios", comentariosRouter);
    }

    return router;
}

// Dependencias por defecto para retrocompatibilidad
const createSubastasRepository = require("../repositories/subastasRepository");
const createSubastasService = require("../services/subastasService");
const defaultComentariosRouter = require("./comentarios");

const defaultSubastasRepository = createSubastasRepository();
const defaultSubastasService = createSubastasService(defaultSubastasRepository);

const defaultRouter = createSubastasRouter(defaultSubastasService, defaultComentariosRouter);
defaultRouter.createSubastasRouter = createSubastasRouter;

module.exports = defaultRouter;