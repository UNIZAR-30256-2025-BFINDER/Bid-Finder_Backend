var express = require('express');
var router = express.Router();

var subastasRouter = require('./subastas');

/* GET home page (Healthcheck de la API). */
// eslint-disable-next-line no-unused-vars
router.get('/', function(req, res, next) {
  res.status(200).json({ 
    status: 'success', 
    message: 'API de BidFinder funcionando correctamente' 
  });
});

router.use('/subastas', subastasRouter);

module.exports = router;