/**
 * @fileoverview Punto de entrada principal y configuración de la aplicación Express.
 * Orquesta los middlewares, la documentación Swagger, el enrutador
 * principal y la gestión global de errores.
 */

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

// Conecta a MongoDB solo si el entorno no es un test runner automatizado
if (process.env.NODE_ENV !== "test") {
    connectDB(); 
}

/**
 * Dominios autorizados para realizar peticiones a esta API (CORS).
 */
const dominiosPermitidos = [
    'http://localhost:5173', 
    'https://bid-finder-frontend-web.vercel.app'
];

var app = express();

// Logger HTTP usando Morgan, redirigido a Winston
app.use(logger('dev', {
    stream: {
        write: (message) => winstonLogger.info(message.trim())
    }
}));

// Middlewares estándar de parseo
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configuración de seguridad CORS
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

/**
 * Configuración de la documentación interactiva Swagger/OpenAPI.
 */
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
                url: "http://localhost:3000/api/v1",
                description: "Servidor Bfinder Backend",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Introduce tu token JWT aquí (sin la palabra 'Bearer')."
                },
            },
        },
    },
    apis: ["./app_server/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Inyección de rutas de la API en el prefijo /api/v1
app.use("/api/v1", indexRouter);

//  Captura peticiones a rutas inexistentes y delega al manejador de errores
app.use(function (req, res, next) {
    next(createError(404, "Endpoint no encontrado"));
});

// Manejador global de errores 
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
    winstonLogger.error(`[Unhandled Error] ${err.message}`, { stack: err.stack, path: req.path });

    res.status(err.status || 500);
    res.json({
        error: {
            message: err.message,
            status: err.status || 500,
            // Solo muestra la traza completa (stack) si estamos en entorno de desarrollo por seguridad
            stack: req.app.get("env") === "development" ? err.stack : undefined,
        },
    });
});

module.exports = app;