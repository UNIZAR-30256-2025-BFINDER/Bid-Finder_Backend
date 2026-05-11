/**
 * @fileoverview Servicio de IA con sistema de fallback en cascada.
 * Encargado de orquestar los diferentes proveedores y validar la respuesta.
 */

const { validarDatosSubasta } = require('../utils/aiResponseValidator');

/**
 * Crea el servicio de inteligencia artificial inyectando los proveedores disponibles.
 * @param {Array<{generate: Function}>} aiProviders - Proveedores en orden de prioridad de uso.
 * @param {Object} [logger=console] - Logger inyectado para registrar fallos o cuotas excedidas.
 * @returns {Object} Servicio con el método `extraerDatosSubasta`.
 */
function createAiService(aiProviders, logger = console) {

    /**
     * Extrae datos estructurados de un texto legal crudo delegando la tarea al primer LLM disponible.
     * @param {string} textoBoletin - El texto bruto extraído del XML del BOE.
     * @param {string} systemPrompt - Las instrucciones estrictas para la IA.
     * @returns {Promise<Object>} - El JSON parseado y validado con los datos estructurados.
     * @throws {Error} Si todos los proveedores fallan en cascada.
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