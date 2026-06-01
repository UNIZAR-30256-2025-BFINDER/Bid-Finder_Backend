/**
 * @fileoverview Enrutador raíz (Root Router) de la aplicación Express.
 * Agrupa y delega las subrutas a sus respectivos módulos, e incluye el Healthcheck.
 */

var express = require('express');
var router = express.Router();

var subastasRouter = require("./subastas");
var adminRouter = require("./admin");
var favoritosRouter = require("./favoritos");
const authRoutes = require("./auth");
const statsRouter = require("./estadisticas");

/**
 * Endpoint de Healthcheck (Verificación de salud).
 * Ideal para balanceadores de carga y comprobación de despliegues.
 */
router.get("/", function (req, res) {
    res.status(200).json({
        status: "success",
        message: "API de BidFinder funcionando correctamente",
    });
});

const catastroRouter = require("./catastro");

router.use("/subastas", subastasRouter);
router.use("/admin", adminRouter);
router.use("/favoritos", favoritosRouter);
router.use("/estadisticas", statsRouter);
router.use('/auth', authRoutes);
router.use('/catastro', catastroRouter);

module.exports = router;