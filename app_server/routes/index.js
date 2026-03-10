var express = require('express');
var router = express.Router();

/* GET home page (Healthcheck de la API). */
router.get('/', function(req, res, next) {
  res.status(200).json({ 
    status: 'success', 
    message: 'API de BidFinder funcionando correctamente' 
  });
});

module.exports = router;