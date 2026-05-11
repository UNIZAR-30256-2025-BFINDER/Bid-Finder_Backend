/**
 * @fileoverview Definición de rutas públicas principales para la consulta de subastas.
 * Enruta las peticiones anidadas de comentarios delegándolas al `comentariosRouter`.
 */

var express = require('express');
var router = express.Router();

const comentariosRouter = require('./comentarios');

const createSubastasRepository = require('../repositories/subastasRepository');
const createSubastasService = require('../services/subastasService');
const createSubastasController = require('../controllers/subastasController');

const logger = require('../utils/logger');

const subastasRepository = createSubastasRepository();
const subastasService = createSubastasService(subastasRepository);
const subastasController = createSubastasController(subastasService, logger);

/**
 * @swagger
 * components:
 * schemas:
 * Subasta:
 * type: object
 * properties:
 * id:
 * type: string
 * description: El ID único de la subasta
 * titulo:
 * type: string
 * description: El título o nombre del artículo a subastar
 * precioInicial:
 * type: number
 * description: El precio base de la subasta
 * estado:
 * type: string
 * description: Estado actual de la subasta (ej. activa, finalizada)
 * example:
 * id: "12345"
 * titulo: "Reloj de bolsillo antiguo"
 * precioInicial: 150.50
 * estado: "activa"
 */

/**
 * @swagger
 * tags:
 * - name: Subastas
 * description: API para la gestión de subastas
 */

/**
 * @swagger
 * /subastas:
 * get:
 * summary: Devuelve una lista con todas las subastas listas para consumo
 * tags: [Subastas]
 * parameters:
 * - in: query
 * name: provincia
 * schema:
 * type: string
 * required: false
 * description: Provincia (opcional)
 * - in: query
 * name: q
 * schema:
 * type: string
 * required: false
 * description: Búsqueda por texto (opcional)
 * - in: query
 * name: categoria
 * schema:
 * type: string
 * required: false
 * description: Categoría (opcional)
 * - in: query
 * name: precio_min
 * schema:
 * type: number
 * required: false
 * description: Precio mínimo (opcional)
 * - in: query
 * name: precio_max
 * schema:
 * type: number
 * required: false
 * description: Precio máximo (opcional)
 * - in: query
 * name: nivel_oportunidad
 * schema:
 * type: string
 * enum: ["ALTO", "MEDIO", "BAJO"]
 * required: false
 * description: 'Nivel de oportunidad (opcional, valores posibles: "ALTO", "MEDIO", "BAJO")'
 * responses:
 * 200:
 * description: Lista de subastas obtenida exitosamente
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Subasta'
 * 500:
 * description: Error interno del servidor
 */

/**
 * @swagger
 * /subastas/{id}:
 * get:
 * summary: Obtiene una subasta específica por su ID
 * tags: [Subastas]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: El ID de la subasta
 * responses:
 * 200:
 * description: Detalles de la subasta obtenida exitosamente
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Subasta'
 * 404:
 * description: Subasta no encontrada
 * 500:
 * description: Error interno del servidor
 */
router.get('/', subastasController.getAllSubastas);

/**
 * @swagger
 * /subastas/{id}:
 * get:
 * summary: Obtiene una subasta específica por su ID
 * tags: [Subastas]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: El ID de la subasta
 * responses:
 * 200:
 * description: Detalles de la subasta obtenida exitosamente
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Subasta'
 * 404:
 * description: Subasta no encontrada
 * 500:
 * description: Error interno del servidor
 */
router.get('/:id', subastasController.getSubastaById);

// Delegar las rutas anidadas al router de comentarios
router.use('/:id/comentarios', comentariosRouter);

module.exports = router;