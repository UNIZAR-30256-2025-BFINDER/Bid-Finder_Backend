/**
 * @fileoverview Definición de rutas protegidas para estadísticas.
 * Utilizadas por el panel de administración para renderizar las gráficas.
 */

const express = require('express');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');
const createStatsController = require('../controllers/statsController');

/**
 * Fábrica para instanciar el router de estadísticas con inyección de dependencias.
 * @param {Object} statsService - Servicio de estadísticas.
 * @returns {import('express').Router} Router de Express configurado.
 */
function createStatsRouter(statsService) {
    const router = express.Router();
    const statsController = createStatsController(statsService, logger);

    /**
     * @swagger
     * tags:
     *   - name: Estadisticas
     *     description: Rutas para obtener estadísticas de subastas por categoría y provincia (solo admin)
     */

    router.get('/categorias', protect, isAdmin, statsController.getStatsSubastasPorCategoria);
    router.get('/provincias', protect, isAdmin, statsController.getStatsSubastasPorProvincia);

    return router;
}

// Dependencias por defecto para retrocompatibilidad
const createStatsService = require('../services/statsService');
const createSubastasRepository = require('../repositories/subastasRepository');

const defaultSubastasRepository = createSubastasRepository();
const defaultStatsService = createStatsService(defaultSubastasRepository);

const defaultRouter = createStatsRouter(defaultStatsService);
defaultRouter.createStatsRouter = createStatsRouter;

module.exports = defaultRouter;