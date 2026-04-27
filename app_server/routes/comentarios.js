const express = require('express');
const router = express.Router({ mergeParams: true }); 
const { protect } = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

const createComentariosRepository = require('../repositories/comentariosRepository');
const createComentariosService = require('../services/comentariosService');
const createComentariosController = require('../controllers/comentariosController');

const comentariosRepository = createComentariosRepository();
const comentariosService = createComentariosService(comentariosRepository);
const comentariosController = createComentariosController(comentariosService, logger);

/**
 * @swagger
 * components:
 * schemas:
 * Comentario:
 * type: object
 * properties:
 * _id:
 * type: string
 * subasta_id:
 * type: string
 * usuario_id:
 * type: object
 * properties:
 * _id:
 * type: string
 * nombre:
 * type: string
 * texto:
 * type: string
 * createdAt:
 * type: string
 * format: date-time
 * example:
 * _id: "60d0fe4f5311236168a109ca"
 * subasta_id: "BOE-B-2026-112"
 * usuario_id: { "_id": "60d0fe4f5311236168a109cb", "nombre": "Juan Pérez" }
 * texto: "Me parece una buena oportunidad de inversión."
 * createdAt: "2026-04-22T10:00:00.000Z"
 */

/**
 * @swagger
 * tags:
 * - name: Comentarios
 * description: API para la gestión de comentarios en subastas
 */

/**
 * @swagger
 * /subastas/{id}/comentarios:
 * get:
 * summary: Obtiene todos los comentarios de una subasta específica
 * tags: [Comentarios]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: El ID de la subasta (ej. BOE-B-2026-112)
 * responses:
 * 200:
 * description: Lista de comentarios obtenida exitosamente
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Comentario'
 * 500:
 * description: Error interno del servidor
 */
router.get('/', comentariosController.obtenerComentarios);

/**
 * @swagger
 * /subastas/{id}/comentarios:
 * post:
 * summary: Crea un nuevo comentario en una subasta (Requiere Autenticación)
 * tags: [Comentarios]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: El ID de la subasta
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - texto
 * properties:
 * texto:
 * type: string
 * example: "He revisado las cargas previas y parece limpio."
 * responses:
 * 201:
 * description: Comentario creado exitosamente
 * 400:
 * description: Datos inválidos (ej. texto vacío)
 * 401:
 * description: No autorizado (Token JWT faltante o inválido)
 * 500:
 * description: Error interno del servidor
 */
router.post('/', protect, comentariosController.crearComentario);

module.exports = router;