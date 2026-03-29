/**
 * @fileoverview Servicio de IA con sistema de fallback en cascada.
 * Recibe los proveedores y el logger por inyección de dependencias.
 */

const { validarDatosSubasta } = require('../utils/aiResponseValidator');

/**
 * @param {Array<{generate: Function}>} aiProviders - Proveedores en orden de prioridad.
 * @param {{ warn: Function, error: Function }} [logger=console] - Logger inyectado.
 */
function createAiService(aiProviders, logger = console) {

    /**
     * Extrae datos estructurados de un texto legal crudo.
     * @param {string} textoBoletin - El texto bruto extraído del XML del BOE.
     * @param {string} systemPrompt - Las instrucciones estrictas para la IA.
     * @returns {Promise<Object>} - El JSON parseado y validado con los datos.
     */
    async function extraerDatosSubasta(textoBoletin, systemPrompt) {
        const promptFinal = `${systemPrompt}\n\nTEXTO DE LA SUBASTA:\n${textoBoletin}`;
        let ultimoError = null;

        for (let i = 0; i < aiProviders.length; i++) {
            const provider = aiProviders[i];
            try {
                const responseText = await provider.generate(promptFinal);
                const rawJson = JSON.parse(responseText);
                return validarDatosSubasta(rawJson);
            } catch (error) {
                logger.warn(
                    `[AI Service] Fallo en el proveedor ${i + 1}/${aiProviders.length}. ` +
                    `Motivo: ${error.message}. Intentando el siguiente...`
                );
                ultimoError = error;
            }
        }

        logger.error('[AI Service] Todos los proveedores de IA han agotado su cuota o fallado.');
        throw new Error(`Fallo en todos los proveedores de IA. Último error: ${ultimoError?.message}`);
    }

    return { extraerDatosSubasta };
}

module.exports = createAiService;