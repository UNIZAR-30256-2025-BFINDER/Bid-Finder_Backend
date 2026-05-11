/**
 * @fileoverview Proveedor de Inteligencia Artificial utilizando Groq (Llama 3).
 * Actúa como alternativa de alta velocidad y fallback.
 */

const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Instancia el proveedor de Groq con la clave de API proporcionada.
 * @param {string} apiKey - Clave de autenticación para la API de Groq.
 * @returns {Object} Objeto con la función `generate`.
 */
function createGroqProvider(apiKey) {
    
    if (!apiKey) {
        logger.warn('[Groq Provider] Advertencia: GROQ_API_KEY no está configurada.');
    }

    /**
     * Envía un prompt al modelo Llama 3 forzando un formato de salida JSON.
     * @param {string} promptFinal - Datos extraídos que debe procesar la IA.
     * @returns {Promise<string>} Respuesta en formato texto.
     * @throws {Error} Si la clave no está configurada o la API rechaza la solicitud.
     */
    async function generate(promptFinal) {
        if (!apiKey) throw new Error("API Key de Groq no configurada");

        const url = 'https://api.groq.com/openai/v1/chat/completions';
        
        const response = await axios.post(url, {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant designed to output ONLY valid JSON. Do not include markdown formatting like ```json."
                },
                {
                    role: "user",
                    content: promptFinal
                }
            ],
            response_format: { type: "json_object" }, 
            temperature: 0.1 
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000 
        });

        return response.data.choices[0].message.content;
    }

    return { generate };
}

module.exports = createGroqProvider;