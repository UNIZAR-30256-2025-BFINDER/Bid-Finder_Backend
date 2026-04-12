const createSubastasRepository = require('../repositories/subastasRepository');
const createGeminiProvider     = require('../services/ai_providers/geminiProvider');
const createGroqProvider       = require('../services/ai_providers/groqProvider');
const createAiService          = require('../services/aiService');
const createBoeService         = require('../services/boeHttpService');
const createIngestionController = require('../controllers/ingestionController');
const xmlParserService         = require('../services/xmlParserService');
const { createGeoCodingService } = require('../services/geoCodingService');
const logger                   = require('../utils/logger');
const { BOE, INGESTION }       = require('./constants');
const subastasRules            = require('./subastasRules');

const axios = require('axios');
const https = require('https');

function buildContainer() {
    const httpsAgent = new https.Agent({ keepAlive: true });
    const httpClient = axios.create({ 
        httpsAgent, 
        timeout: 10000,
        headers: {
            'User-Agent': 'BidFinderApp/1.0 (https://github.com/UNIZAR-30256-2025-BFINDER/Bid-Finder_Backend)' 
        }
    });

    const subastasRepository = createSubastasRepository();

    const aiProviders = [
        createGeminiProvider(process.env.GEMINI_API_KEY),
        createGroqProvider(process.env.GROQ_API_KEY),
    ];

    const aiService  = createAiService(aiProviders, logger);
    const boeService = createBoeService(httpClient, BOE, logger);
    const geoCodingService = createGeoCodingService(httpClient);

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
        geoCodingService,
        ingestionController,
        logger,
    };
}

module.exports = buildContainer;