/**
 * @fileoverview Tests unitarios para ingestionController.
 */

const createIngestionController = require('../../app_server/controllers/ingestionController');

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockBoeService = {
    fetchSumario:    jest.fn(),
    fetchXMLContent: jest.fn(),
};

const mockXmlParser = {
    processXml: jest.fn(),
};

const mockRepository = {
    saveSubastas: jest.fn(),
};

const config = {
    CONCURRENCY_LIMIT: 2,
    BASE_DOMAIN: 'https://boe.es',
};

const ingestionRules = {
    extractSumarioStrategy:  'sumario',
    extractAnuncioStrategy: 'anuncio',
};

function makeController(repo = mockRepository) {
    return createIngestionController(
        mockBoeService,
        mockXmlParser,
        mockLogger,
        config,
        ingestionRules,
        repo
    );
}

describe('ingestionController — runDailyIngestion', () => {

    beforeEach(() => jest.clearAllMocks());

    it('retorna true sin procesar nada si el sumario no contiene subastas', async () => {
        mockBoeService.fetchSumario.mockResolvedValue('<xml/>');
        mockXmlParser.processXml.mockReturnValue([]);

        const result = await makeController().runDailyIngestion(new Date());

        expect(result).toBe(true);
        expect(mockBoeService.fetchXMLContent).not.toHaveBeenCalled();
        expect(mockRepository.saveSubastas).not.toHaveBeenCalled();
    });

    it('descarga el XML de cada subasta y guarda los datos en BD', async () => {
        mockBoeService.fetchSumario.mockResolvedValue('<xml/>');
        mockXmlParser.processXml
            .mockReturnValueOnce([
                { id: 'BOE-1', urlXml: '/boe/xml/1.xml' },
                { id: 'BOE-2', urlXml: 'https://boe.es/boe/xml/2.xml' },
            ])
            .mockReturnValue({ id: 'BOE-1', titulo: 'Piso' });

        mockBoeService.fetchXMLContent.mockResolvedValue('<anuncio/>');
        mockRepository.saveSubastas.mockResolvedValue({ upserted: 2, modified: 0, matched: 0 });

        const result = await makeController().runDailyIngestion(new Date());

        expect(result).toBe(true);
        expect(mockBoeService.fetchXMLContent).toHaveBeenCalledTimes(2);
        expect(mockBoeService.fetchXMLContent).toHaveBeenCalledWith('https://boe.es/boe/xml/1.xml');
        expect(mockBoeService.fetchXMLContent).toHaveBeenCalledWith('https://boe.es/boe/xml/2.xml');
        expect(mockRepository.saveSubastas).toHaveBeenCalledTimes(1);
    });

    it('descarta un anuncio si xmlParser devuelve null/undefined y continúa', async () => {
        mockBoeService.fetchSumario.mockResolvedValue('<xml/>');
        mockXmlParser.processXml
            .mockReturnValueOnce([{ id: 'BOE-1', urlXml: '/xml/1.xml' }])
            .mockReturnValue(null);

        mockBoeService.fetchXMLContent.mockResolvedValue('<anuncio/>');

        await makeController().runDailyIngestion(new Date());

        expect(mockRepository.saveSubastas).not.toHaveBeenCalled();
    });

    it('registra el error y continúa si un anuncio falla al descargarse', async () => {
        mockBoeService.fetchSumario.mockResolvedValue('<xml/>');
        mockXmlParser.processXml
            .mockReturnValueOnce([
                { id: 'BOE-ERR', urlXml: '/xml/err.xml' },
                { id: 'BOE-OK',  urlXml: '/xml/ok.xml'  },
            ])
            .mockReturnValue({ id: 'BOE-OK' });

        mockBoeService.fetchXMLContent
            .mockRejectedValueOnce(new Error('Timeout'))
            .mockResolvedValueOnce('<anuncio/>');

        mockRepository.saveSubastas.mockResolvedValue({ upserted: 1, modified: 0, matched: 0 });

        const result = await makeController().runDailyIngestion(new Date());

        expect(result).toBe(true);
        expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('BOE-ERR'));
        expect(mockRepository.saveSubastas).toHaveBeenCalledTimes(1);
    });

    it('no llama a saveSubastas si no hay repositorio', async () => {
        mockBoeService.fetchSumario.mockResolvedValue('<xml/>');
        mockXmlParser.processXml
            .mockReturnValueOnce([{ id: 'BOE-1', urlXml: '/xml/1.xml' }])
            .mockReturnValue({ id: 'BOE-1' });
        mockBoeService.fetchXMLContent.mockResolvedValue('<anuncio/>');

        const result = await makeController(null).runDailyIngestion(new Date());

        expect(result).toBe(true);
        expect(mockRepository.saveSubastas).not.toHaveBeenCalled();
    });

    it('procesa múltiples lotes respetando CONCURRENCY_LIMIT', async () => {
        const subastas = Array.from({ length: 5 }, (_, i) => ({
            id: `BOE-${i}`, urlXml: `/xml/${i}.xml`
        }));

        mockBoeService.fetchSumario.mockResolvedValue('<xml/>');
        mockXmlParser.processXml
            .mockReturnValueOnce(subastas)
            .mockReturnValue({ id: 'processed' });

        mockBoeService.fetchXMLContent.mockResolvedValue('<anuncio/>');
        mockRepository.saveSubastas.mockResolvedValue({ upserted: 1, modified: 0, matched: 0 });

        await makeController().runDailyIngestion(new Date());

        expect(mockRepository.saveSubastas).toHaveBeenCalledTimes(3);
    });
});