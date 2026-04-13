var express = require("express");
var router = express.Router();

var subastasRouter = require("./subastas");
const authRoutes = require('./auth');
/* GET home page (Healthcheck de la API) */
router.get("/", function (req, res) {
    res.status(200).json({
        status: "success",
        message: "API de BidFinder funcionando correctamente",
    });
});

router.use("/subastas", subastasRouter);

router.use('/api/auth', authRoutes);
module.exports = router;