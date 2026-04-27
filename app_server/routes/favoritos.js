const express = require("express");
const router = express.Router();
const createSubastasRepository = require("../repositories/subastasRepository");
const createSubastasService = require("../services/subastasService");
const createFavoritosController = require("../controllers/favoritosController");
const { protect } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger"); // Ajusta la ruta según tu proyecto

const subastasRepository = createSubastasRepository();
const subastasService = createSubastasService(subastasRepository);
const favoritosController = createFavoritosController(subastasService, logger);

// Todas las rutas requieren autenticación
router.use(protect);

router.get("/", favoritosController.listFavorites);
router.post("/:subastaId", favoritosController.addFavorite);
router.delete("/:subastaId", favoritosController.removeFavorite);

module.exports = router;
