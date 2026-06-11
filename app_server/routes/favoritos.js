/**
 * @fileoverview Definición de rutas protegidas para la gestión de favoritos del usuario.
 * Aplica el middleware `protect` de forma global a todo el router.
 */

const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");
const createFavoritosController = require("../controllers/favoritosController");
const createFavoritosService = require("../services/favoritosService");

/**
 * Fábrica para instanciar el router de favoritos con inyección de dependencias.
 * @param {Object} favoritosService - Servicio de gestión de favoritos.
 * @returns {import('express').Router} Router de Express configurado.
 */
function createFavoritosRouter(favoritosService) {
    const router = express.Router();
    const favoritosController = createFavoritosController(favoritosService, logger);

    // Protege todas las rutas de este bloque exigiendo un JWT válido
    router.use(protect);

    router.get("/", favoritosController.listFavorites);
    router.post("/:subastaId", favoritosController.addFavorite);
    router.delete("/:subastaId", favoritosController.removeFavorite);

    return router;
}

// Dependencias por defecto para retrocompatibilidad
const createSubastasRepository = require("../repositories/subastasRepository");
const createUsuariosRepository = require("../repositories/usuariosRepository");

const defaultSubastasRepository = createSubastasRepository();
const defaultUsuariosRepository = createUsuariosRepository();
const defaultFavoritosService = createFavoritosService(defaultUsuariosRepository, defaultSubastasRepository);

const defaultRouter = createFavoritosRouter(defaultFavoritosService);
defaultRouter.createFavoritosRouter = createFavoritosRouter;

module.exports = defaultRouter;