var express = require('express');
var router = express.Router();


var subastasRouter = require("./subastas");
var adminRouter = require("./admin");
var favoritosRouter = require("./favoritos");
const authRoutes = require("./auth");
const statsRouter = require("./stats");

/* GET home page (Healthcheck de la API) */
router.get("/", function (req, res) {
    res.status(200).json({
        status: "success",
        message: "API de BidFinder funcionando correctamente",
    });
});


router.use("/subastas", subastasRouter);
router.use("/admin", adminRouter);
router.use("/favoritos", favoritosRouter);
router.use("/stats", statsRouter);
router.use('/api/auth', authRoutes);

module.exports = router;