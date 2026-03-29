function createAiService(aiProviders) {
    
    /**
     * Extrae datos estructurados de un texto legal crudo.
     * @param {string} textoBoletin - El texto bruto extraído del XML del BOE.
     * @param {string} systemPrompt - Las instrucciones estrictas para la IA.
     * @returns {Promise<Object>} - El JSON parseado con los datos.
     */
    async function extraerDatosSubasta(textoBoletin, systemPrompt) {
        const promptFinal = `${systemPrompt}\n\nTEXTO DE LA SUBASTA:\n${textoBoletin}`;
        let ultimoError = null;

        for (let i = 0; i < aiProviders.length; i++) {
            const provider = aiProviders[i];
            try {
                const responseText = await provider.generate(promptFinal);
                
                return JSON.parse(responseText);

            } catch (error) {
                console.warn(`[AI Service] Fallo en el proveedor ${i + 1}/${aiProviders.length}. Motivo: ${error.message}. Intentando el siguiente...`);
                ultimoError = error;
                continue; 
            }
        }

        console.error("[AI Service] Todos los proveedores de IA han agotado su cuota o fallado.");
        throw new Error(`Fallo en todos los proveedores de IA. Último error: ${ultimoError?.message}`);
    }

    return {
        extraerDatosSubasta
    };
}

module.exports = createAiService;