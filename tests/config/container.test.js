const buildContainer = require('../../app_server/config/container');

describe('Dependency Injection Container', () => {
    beforeAll(() => {
        process.env.GEMINI_API_KEY = 'fake_gemini_key';
        process.env.GROQ_API_KEY = 'fake_groq_key';
    });

    it('debe construir y devolver todas las dependencias correctamente', () => {
        const container = buildContainer();

        expect(container).toBeDefined();
        
        expect(container).toHaveProperty('subastasRepository');
        expect(typeof container.subastasRepository).toBe('object');
        
        expect(container).toHaveProperty('aiService');
        expect(typeof container.aiService).toBe('object');
        
        expect(container).toHaveProperty('boeService');
        expect(typeof container.boeService).toBe('object');
        
        expect(container).toHaveProperty('geoCodingService');
        expect(typeof container.geoCodingService).toBe('object');

        expect(container).toHaveProperty('catastroService');
        expect(typeof container.catastroService).toBe('object');

        expect(container).toHaveProperty('catastroImageService');
        expect(typeof container.catastroImageService).toBe('object');
        
        expect(container).toHaveProperty('ingestionController');
        expect(typeof container.ingestionController).toBe('object');
        
        expect(container).toHaveProperty('logger');
        expect(typeof container.logger).toBe('object');
    });
});