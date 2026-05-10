const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/authMiddleware');

const logger = require('../utils/logger');
const createStatsService = require('../services/statsService');
const createStatsController = require('../controllers/statsController');
const createSubastasRepository = require('../repositories/subastasRepository');

const subastasRepository = createSubastasRepository();
const statsService = createStatsService(subastasRepository);
const statsController = createStatsController(statsService, logger);

/**
 * @swagger
 * tags:
 * - name: Estadisticas
 * description: Rutas para obtener estadísticas de subastas por categoría y provincia (solo admin)
 */

/**
 * @swagger
 * /estadisticas/categorias:
 * get:
 * summary: Obtiene estadísticas de subastas agrupadas por categoría (solo admin)
 * tags: [Estadisticas]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Estadísticas por categoría obtenidas correctamente
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * data:
 * type: array
 * items:
 * type: object
 * properties:
 * categoria:
 * type: string
 * total:
 * type: integer
 * 401:
 * description: No autorizado (Token faltante o inválido)
 * 403:
 * description: Prohibido (El usuario no tiene rol de admin)
 * 500:
 * description: Error interno del servidor
 */

/**
 * @swagger
 * /estadisticas/provincias:
 * get:
 * summary: Obtiene estadísticas de subastas agrupadas por provincia (solo admin)
 * tags: [Estadisticas]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Estadísticas por provincia obtenidas correctamente
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * data:
 * type: array
 * items:
 * type: object
 * properties:
 * provincia:
 * type: string
 * total:
 * type: integer
 * 401:
 * description: No autorizado (Token faltante o inválido)
 * 403:
 * description: Prohibido (El usuario no tiene rol de admin)
 * 500:
 * description: Error interno del servidor
 */

router.get('/categorias', protect, isAdmin, statsController.getStatsSubastasPorCategoria);
router.get('/provincias', protect, isAdmin, statsController.getStatsSubastasPorProvincia);

module.exports = router;