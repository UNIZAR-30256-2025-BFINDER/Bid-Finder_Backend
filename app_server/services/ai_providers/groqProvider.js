const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Proveedor de IA basado en Groq (ejecutando Llama 3).
 * 
 */
function createGroqProvider(apiKey) {
    
    if (!apiKey) {
        logger.warn('[Groq Provider] Advertencia: GROQ_API_KEY no está configurada.');
    }

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