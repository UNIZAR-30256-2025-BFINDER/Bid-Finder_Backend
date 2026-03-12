var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./app_server/routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Rutas de la API
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404, 'Endpoint no encontrado'));
});

// error handler (Devuelve JSON en lugar de renderizar HTML)
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      status: err.status || 500,
      // Solo mostramos el stack en desarrollo por seguridad
      stack: req.app.get('env') === 'development' ? err.stack : undefined
    }
  });
});

module.exports = app;