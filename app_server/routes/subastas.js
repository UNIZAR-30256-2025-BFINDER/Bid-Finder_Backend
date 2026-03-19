var express = require('express');
var router = express.Router();

const createSubastasService = require('../services/subastasService');
const createSubastasController = require('../controllers/subastasController');

// Instanciamos service y controller
const subastasService = createSubastasService();
const subastasController = createSubastasController(subastasService);
/**
 * @swagger
 * components:
 *   schemas:
 *     Subasta:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: El ID único de la subasta
 *         titulo:
 *           type: string
 *           description: El título o nombre del artículo a subastar
 *         precioInicial:
 *           type: number
 *           description: El precio base de la subasta
 *         estado:
 *           type: string
 *           description: Estado actual de la subasta (ej. activa, finalizada)
 *       example:
 *         id: "12345"
 *         titulo: "Reloj de bolsillo antiguo"
 *         precioInicial: 150.50
 *         estado: "activa"
 */

/**
 * @swagger
 * tags:
 *   - name: Subastas
 *     description: API para la gestión de subastas
 */

/**
 * @swagger
 * /subastas:
 *   get:
 *     summary: Devuelve una lista con todas las subastas
 *     tags: [Subastas]
 *     responses:
 *       200:
 *         description: Lista de subastas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subasta'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', subastasController.getAllSubastas);

/**
 * @swagger
 * /subastas/{id}:
 *   get:
 *     summary: Obtiene una subasta específica por su ID
 *     tags: [Subastas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: El ID de la subasta
 *     responses:
 *       200:
 *         description: Detalles de la subasta obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subasta'
 *       404:
 *         description: Subasta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', subastasController.getSubastaById);

module.exports = router;