var express = require("express");
var router = express.Router();
const Subasta = require("../models/subasta");
const { saveSubastas } = require("../services/subastasPersistenceService");

var subastasRouter = require("./subastas");

/* GET home page (Healthcheck de la API). */
// eslint-disable-next-line no-unused-vars
router.get("/", function (req, res, next) {
    res.status(200).json({
        status: "success",
        message: "API de BidFinder funcionando correctamente",
    });
});

router.use("/subastas", subastasRouter);

router.post("/test-insert", async (req, res) => {
    try {
        const nueva = await Subasta.create({
            id: "BOE-B-2026-888",
            titulo: "Desde API con Atlas",
            fechaPublicacion: "20260102",
            urlPdf: "/test.pdf",
            texto: "Texto de prueba",
            rawXml: "<xml/>",
        });
        res.json({ success: true, data: nueva });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/test-save", async (req, res) => {
    try {
        let subastas = req.body.subastas;
        if (!subastas || !Array.isArray(subastas)) {
            return res
                .status(400)
                .json({ error: "Se requiere un array subastas" });
        }
        const toSave = subastas.map((s) => ({
            ...s,
            rawXml: s.rawXml || "<manual-test>",
        }));
        const result = await saveSubastas(toSave);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
