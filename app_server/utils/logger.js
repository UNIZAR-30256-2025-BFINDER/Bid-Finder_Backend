/**
 * @fileoverview Configuración global del sistema de registro de eventos.
 * Utiliza Winston para unificar la salida por consola (y futuros archivos/servicios de log).
 */

const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        // En desarrollo o servidores básicos, imprimimos directamente por consola
        new winston.transports.Console()
    ]
});

module.exports = logger;