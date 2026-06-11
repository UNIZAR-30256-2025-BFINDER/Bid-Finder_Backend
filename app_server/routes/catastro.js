/**
 * @fileoverview Rutas de integración con el Catastro.
 * Contiene únicamente las definiciones de endpoints y delega la ejecución de lógica al controlador.
 */

const express = require('express');
const logger = require('../utils/logger');
const createCatastroController = require('../controllers/catastroController');

/**
 * Crea y configura el enrutador de Catastro con las dependencias inyectadas.
 * @param {Object} catastroService - Servicio de consultas al catastro.
 * @param {Object} catastroImageService - Servicio de descarga/caché de imágenes del catastro.
 * @returns {import('express').Router} El router de express configurado.
 */
function createCatastroRouter(catastroService, catastroImageService) {
    const router = express.Router();
    const controller = createCatastroController(catastroService, catastroImageService, logger);

    /**
     * @openapi
     * /catastro/ficha/{refCatastral}:
     *   get:
     *     summary: Redirige a la Ficha Oficial del Catastro
     *     tags: [Catastro]
     */
    router.get('/ficha/:refCatastral', controller.getFicha);

    /**
     * @openapi
     * /catastro/info/{refCatastral}:
     *   get:
     *     summary: Obtiene información catastral extendida en formato JSON
     *     tags: [Catastro]
     */
    router.get('/info/:refCatastral', controller.getInfo);

    /**
     * @openapi
     * /catastro/imagen/{refCatastral}:
     *   get:
     *     summary: Redirige al mapa de la parcela catastral (WMS)
     *     tags: [Catastro]
     */
    router.get('/imagen/:refCatastral', controller.getImagen);

    /**
     * @openapi
     * /catastro/satelite/{refCatastral}:
     *   get:
     *     summary: Redirige a la ortofotografía satelital (PNOA)
     *     tags: [Catastro]
     */
    router.get('/satelite/:refCatastral', controller.getSatelite);

    /**
     * @openapi
     * /catastro/fachada/{refCatastral}:
     *   get:
     *     summary: Retorna la imagen de la fachada (local o descargada)
     *     tags: [Catastro]
     */
    router.get('/fachada/:refCatastral', controller.getFachada);

    return router;
}

const defaultCatastroService = require('../services/catastroService');
const defaultCatastroImageService = require('../services/catastroImageService');

const defaultRouter = createCatastroRouter(defaultCatastroService, defaultCatastroImageService);
defaultRouter.createCatastroRouter = createCatastroRouter;

module.exports = defaultRouter;
