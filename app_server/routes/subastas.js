var express = require('express');
var router = express.Router();

const createSubastasService = require('../services/subastasService');
const createSubastasController = require('../controllers/subastasController');

// Instanciamos service y controller
const subastasService = createSubastasService();
const subastasController = createSubastasController(subastasService);

// Endpoint GET /subastas/:id
router.get('/:id', subastasController.getSubastaById);

module.exports = router;