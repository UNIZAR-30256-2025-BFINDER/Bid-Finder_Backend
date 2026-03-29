/**
 * @fileoverview Contenedor de dependencias (Composition Root).
 * Es el ÚNICO lugar donde se instancian y conectan los módulos entre sí.
 * Los jobs y controladores reciben sus dependencias, no las crean.
 */

const createSubastasRepository = require('../repositories/subastasRepository');
const createGeminiProvider     = require('../services/ai_providers/geminiProvider');
const createGroqProvider       = require('../services/ai_providers/groqProvider');
const createAiService          = require('../services/aiService');
const createBoeService         = require('../services/boeHttpService');
const createIngestionController = require('../controllers/ingestionController');
const xmlParserService         = require('../services/xmlParserService');
const logger                   = require('../utils/logger');
const { BOE, INGESTION }       = require('./constants');
const subastasRules            = require('./subastasRules');

const axios = require('axios');
const https = require('https');

function buildContainer() {
    const httpsAgent = new https.Agent({ keepAlive: true });
    const httpClient = axios.create({ httpsAgent, timeout: BOE.TIMEOUT_MS });

    const subastasRepository = createSubastasRepository();

    const aiProviders = [
        createGeminiProvider(process.env.GEMINI_API_KEY),
        createGroqProvider(process.env.GROQ_API_KEY),
    ];

    const aiService  = createAiService(aiProviders, logger);
    const boeService = createBoeService(httpClient, BOE, logger);

    const ingestionController = createIngestionController(
        boeService,
        xmlParserService,
        logger,
        { ...BOE, ...INGESTION },
        subastasRules,
        subastasRepository
    );

    return {
        subastasRepository,
        aiService,
        boeService,
        ingestionController,
        logger,
    };
}

module.exports = buildContainer;