var createError = require("http-errors");
var express = require("express");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var winstonLogger = require('./app_server/utils/logger');
var cors = require("cors");

var swaggerUi = require("swagger-ui-express");
var swaggerJsDoc = require("swagger-jsdoc");

var indexRouter = require("./app_server/routes/index");

var connectDB = require("./app_server/config/database");

if (process.env.NODE_ENV !== "test") {
    connectDB(); // solo conecta en entorno que no sea test
}

const dominiosPermitidos = [
    'http://localhost:5173', 
    'https://tu-proyecto-frontend.vercel.app' 
];

var app = express();

app.use(logger('dev', {
    stream: {
        write: (message) => winstonLogger.info(message.trim())
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || dominiosPermitidos.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS'));
        }
    },
    credentials: true 
}));

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "API Bid Finder",
            version: "1.0.0",
            description: "Documentación de los endpoints de Bfinder Backend",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Servidor Bfinder Backend",
            },
        ],
    },
    apis: ["./app_server/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rutas de la API
app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404, "Endpoint no encontrado"));
});

// error handler (Devuelve JSON en lugar de renderizar HTML)
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
    winstonLogger.error(`[Unhandled Error] ${err.message}`, { stack: err.stack, path: req.path });

    res.status(err.status || 500);
    res.json({
        error: {
            message: err.message,
            status: err.status || 500,
            // Solo mostramos el stack en desarrollo por seguridad
            stack: req.app.get("env") === "development" ? err.stack : undefined,
        },
    });
});

module.exports = app;