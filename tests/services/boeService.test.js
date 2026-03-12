/**
 * @fileoverview Suite de pruebas unitarias para el servicio boeHttpService.
 * Utiliza Stubs para aislar la lógica de red sin necesidad de librerías de Mocking complejas.
 */

const createBoeService = require('../../app_server/services/boeHttpService');

describe('Servicio HTTP del BOE (boeHttpService)', () => {
    
    let mockHttpClient;
    let mockLogger;
    let mockConfig;
    let boeService;

    beforeEach(() => {
        mockHttpClient = {
            get: jest.fn()
        };

        mockLogger = {
            info: jest.fn(),
            error: jest.fn()
        };

        mockConfig = {
            API_SUMARIO_URL: 'https://test.boe.es/api'
        };

        boeService = createBoeService(mockHttpClient, mockConfig, mockLogger);
    });

    describe('fetchSumario()', () => {
        it('Debería obtener el XML del sumario correctamente', async () => {
            const mockXmlResponse = '<response><data>Sumario Simulado</data></response>';
            mockHttpClient.get.mockResolvedValueOnce({ data: mockXmlResponse });

            const date = new Date('2026-03-12T10:00:00Z');
            const result = await boeService.fetchSumario(date);

            expect(result).toBe(mockXmlResponse);
            expect(mockHttpClient.get).toHaveBeenCalledWith(
                'https://test.boe.es/api/20260312',
                { headers: { 'Accept': 'application/xml' } }
            );
            expect(mockLogger.info).toHaveBeenCalled();
        });
    });

    describe('fetchXMLContent()', () => {
        it('Debería descargar el contenido de un XML individual en memoria', async () => {
            const mockUrl = 'https://test.boe.es/xml.php?id=1234';
            const mockContent = '<documento>Contenido</documento>';
            mockHttpClient.get.mockResolvedValueOnce({ data: mockContent });

            const result = await boeService.fetchXMLContent(mockUrl);

            expect(result).toBe(mockContent);
            expect(mockHttpClient.get).toHaveBeenCalledWith(mockUrl, { responseType: 'text' });
        });
    });
});