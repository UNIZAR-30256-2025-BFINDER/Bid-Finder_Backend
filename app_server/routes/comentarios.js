/**
 * @fileoverview Definición de rutas anidadas para los comentarios de una subasta.
 * Utiliza `mergeParams: true` para poder acceder al parámetro `:id` definido en la ruta padre (subastas.js).
 */

const express = require("express");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

const createComentariosRepository = require("../repositories/comentariosRepository");
const createComentariosService = require("../services/comentariosService");
const createComentariosController = require("../controllers/comentariosController");

/**
 * Fábrica para instanciar el router de comentarios con inyección de dependencias.
 * @param {Object} comentariosService - Servicio de comentarios.
 * @returns {import('express').Router} Router de Express configurado.
 */
function createComentariosRouter(comentariosService) {
    const router = express.Router({ mergeParams: true });
    const comentariosController = createComentariosController(comentariosService, logger);

    /**
     * @swagger
     * components:
     *   schemas:
     *     Comentario:
     *       type: object
     *       properties:
     *         _id:
     *           type: string
     *         subasta_id:
     *           type: string
     *         usuario_id:
     *           type: object
     *           properties:
     *             _id:
     *               type: string
     *             nombre:
     *               type: string
     *         texto:
     *           type: string
     *         createdAt:
     *           type: string
     *           format: date-time
     *       example:
     *         _id: "60d0fe4f5311236168a109ca"
     *         subasta_id: "BOE-B-2026-112"
     *         usuario_id: { "_id": "60d0fe4f5311236168a109cb", "nombre": "Juan Pérez" }
     *         texto: "Me parece una buena oportunidad de inversión."
     *         createdAt: "2026-04-22T10:00:00.000Z"
     */

    /**
     * @swagger
     * tags:
     *   - name: Comentarios
     *     description: API para la gestión de comentarios en subastas
     */

    router.get("/", comentariosController.obtenerComentarios);
    router.post("/", protect, comentariosController.crearComentario);
    router.delete(
        "/:comentarioId",
        protect,
        isAdmin,
        comentariosController.eliminarComentario,
    );

    return router;
}

// Dependencias por defecto para retrocompatibilidad
const defaultComentariosRepository = createComentariosRepository();
const defaultComentariosService = createComentariosService(defaultComentariosRepository);

const defaultRouter = createComentariosRouter(defaultComentariosService);
defaultRouter.createComentariosRouter = createComentariosRouter;

module.exports = defaultRouter;
