var express = require("express");
var router = express.Router();

var subastasRouter = require("./subastas");

/* GET home page (Healthcheck de la API) */
router.get("/", function (req, res) {
    res.status(200).json({
        status: "success",
        message: "API de BidFinder funcionando correctamente",
    });
});

router.use("/subastas", subastasRouter);

module.exports = router;