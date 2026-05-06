const axios = require('axios');
const createGroqProvider = require('../../../app_server/services/ai_providers/groqProvider');
const logger = require('../../../app_server/utils/logger');

jest.mock('axios');
jest.mock('../../../app_server/utils/logger');

describe('Groq Provider', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe imprimir una advertencia si se inicializa sin API Key', () => {
        createGroqProvider(null);
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('GROQ_API_KEY no está configurada'));
    });

    it('debe lanzar error al invocar generate() si no hay API Key', async () => {
        const provider = createGroqProvider(null);
        await expect(provider.generate('hola')).rejects.toThrow('API Key de Groq no configurada');
    });

    it('debe generar contenido exitosamente mediante POST a Groq', async () => {
        axios.post.mockResolvedValue({
            data: { choices: [{ message: { content: '{"res":"groq"}' } }] }
        });
        
        const provider = createGroqProvider('groq_fake_key');
        const result = await provider.generate('prompt test');

        expect(result).toBe('{"res":"groq"}');
        expect(axios.post).toHaveBeenCalledWith(
            'https://api.groq.com/openai/v1/chat/completions',
            expect.objectContaining({
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            }),
            expect.objectContaining({
                headers: expect.objectContaining({ 'Authorization': 'Bearer groq_fake_key' })
            })
        );
    });
});