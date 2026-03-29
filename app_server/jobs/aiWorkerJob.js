/**
 * @fileoverview Worker encargado de vaciar la cola de subastas PENDIENTES,
 * enviándolas a la Inteligencia Artificial respetando los Rate Limits.
 */

const connectDB = require('../config/database');
const logger = require('../utils/logger');
const createSubastasRepository = require('../repositories/subastasRepository');
const { SUBASTA_EXTRACTION_PROMPT } = require("../config/aiPrompts");
const createGeminiProvider = require('../services/ai_providers/geminiProvider');
const createGroqProvider = require('../services/ai_providers/groqProvider');
const createAiService = require('../services/aiService');

const subastasRepository = createSubastasRepository();

const geminiProvider = createGeminiProvider(process.env.GEMINI_API_KEY);
const groqProvider = createGroqProvider(process.env.GROQ_API_KEY);
const cascadeProviders = [geminiProvider, groqProvider];
const aiService = createAiService(cascadeProviders);

const BATCH_SIZE = 10; 
const DELAY_MS = 12000; 

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWorker() {
    logger.info(`[AI Worker] Iniciando procesamiento de la cola...`);
    await connectDB();

    const pendientes = await subastasRepository.findPendingAI(BATCH_SIZE);

    if (pendientes.length === 0) {
        logger.info(`[AI Worker] Cola vacía. No hay subastas pendientes.`);
        return 0;
    }

    logger.info(`[AI Worker] Se han encontrado ${pendientes.length} subastas pendientes. Procesando...`);

    for (let i = 0; i < pendientes.length; i++) {
        const subasta = pendientes[i];
        logger.info(`[AI Worker] (${i + 1}/${pendientes.length}) Analizando ${subasta.id}...`);

        try {
            const datosExtraidos = await aiService.extraerDatosSubasta(subasta.texto, SUBASTA_EXTRACTION_PROMPT);

            await subastasRepository.updateAIExtraction(subasta.id, {
                titulo_resumido: datosExtraidos.titulo_resumido || null,
                resumen: datosExtraidos.resumen || null,
                precio_salida: datosExtraidos.precio_salida !== undefined ? datosExtraidos.precio_salida : null,
                valor_tasacion: datosExtraidos.valor_tasacion !== undefined ? datosExtraidos.valor_tasacion : null,
                direccion: datosExtraidos.direccion || null,
                referencia_catastral: datosExtraidos.referencia_catastral || null
            }, 'PROCESADO');

            logger.info(`[AI Worker] ✅ ${subasta.id} actualizado correctamente.`);

            if (i < pendientes.length - 1) {
                await sleep(DELAY_MS);
            }

        } catch (error) {
            const errMsg = error.message || '';
            
            if (errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('Too Many Requests') || errMsg.includes('Fallo en todos los proveedores')) {
                logger.warn(`[AI Worker] ⚠️ Límite de cuota alcanzado. Deteniendo el worker hasta la próxima ejecución.`);
                break; 
            }

            logger.error(`[AI Worker] ❌ Error procesando ${subasta.id}: ${errMsg}`);
            await subastasRepository.updateAIExtraction(subasta.id, {}, 'ERROR');
        }
    }

    logger.info(`[AI Worker] Tareas finalizadas por ahora.`);
    return 0;
}

if (require.main === module) {
    runWorker().then(process.exit).catch(err => {
        logger.error(`[AI Worker] Error crítico: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { runWorker };