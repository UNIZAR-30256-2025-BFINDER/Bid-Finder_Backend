/**
 * @fileoverview Definición de rutas protegidas para la gestión de favoritos del usuario.
 * Aplica el middleware `protect` de forma global a todo el router.
 */

var express = require("express");
var router = express.Router();

const createSubastasRepository = require("../repositories/subastasRepository");
const createSubastasService = require("../services/subastasService");
const createUsuariosRepository = require("../repositories/usuariosRepository");
const createFavoritosService = require("../services/favoritosService");
const createFavoritosController = require("../controllers/favoritosController");

const { protect } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

const subastasRepository = createSubastasRepository();
const usuariosRepository = createUsuariosRepository();

const subastasService = createSubastasService(subastasRepository);
const favoritosService = createFavoritosService(usuariosRepository, subastasService);

const favoritosController = createFavoritosController(favoritosService, logger);

// Protege todas las rutas de este bloque exigiendo un JWT válido
router.use(protect);

router.get("/", favoritosController.listFavorites);
router.post("/:subastaId", favoritosController.addFavorite);
router.delete("/:subastaId", favoritosController.removeFavorite);

module.exports = router;