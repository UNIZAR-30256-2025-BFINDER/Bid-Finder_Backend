/**
 * @fileoverview Proveedor de Inteligencia Artificial utilizando Google Gemini.
 * Configurado para devolver exclusivamente JSON con temperatura baja para evitar alucinaciones.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Instancia el proveedor de Gemini con la clave de API proporcionada.
 * @param {string} apiKey - Clave de autenticación para Google Generative AI.
 * @returns {Object} Objeto con la función `generate`.
 */
function createGeminiProvider(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1, 
        }
    });

    /**
     * Envía un prompt al modelo y recupera la respuesta generada.
     * @param {string} promptFinal - Instrucciones y datos a procesar combinados.
     * @returns {Promise<string>} Respuesta en formato texto.
     */
    async function generate(promptFinal) {
        const result = await model.generateContent(promptFinal);
        return result.response.text();
    }

    return { generate };
}

module.exports = createGeminiProvider;