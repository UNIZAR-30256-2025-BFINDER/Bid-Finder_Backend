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

router.use(protect);

router.get("/", favoritosController.listFavorites);
router.post("/:subastaId", favoritosController.addFavorite);
router.delete("/:subastaId", favoritosController.removeFavorite);

module.exports = router;