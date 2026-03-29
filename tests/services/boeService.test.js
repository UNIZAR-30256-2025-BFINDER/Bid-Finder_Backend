/**
 * @fileoverview Tests unitarios para boeHttpService 
 */

const createBoeService = require('../../app_server/services/boeHttpService');

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
const config = {
    API_SUMARIO_URL: 'https://boe.es/api/sumario',
    BASE_DOMAIN:     'https://boe.es',
    TIMEOUT_MS:      5000,
};

function makeService(getImpl) {
    const httpClient = { get: getImpl };
    return createBoeService(httpClient, config, mockLogger);
}

beforeEach(() => jest.clearAllMocks());

describe('boeHttpService — fetchSumario', () => {

    it('retorna el XML del sumario si la petición tiene éxito', async () => {
        const service = makeService(jest.fn().mockResolvedValue({ data: '<sumario/>' }));

        const result = await service.fetchSumario(new Date('2026-03-16'));

        expect(result).toBe('<sumario/>');
    });

    it('lanza un error con status 404 si el BOE no tiene publicación ese día', async () => {
        const service = makeService(
            jest.fn().mockRejectedValue(Object.assign(new Error('Not Found'), { response: { status: 404 } }))
        );

        const err = await service.fetchSumario(new Date('2026-03-22')).catch(e => e);

        expect(err.response.status).toBe(404);
        expect(err.message).toContain('No se encontró publicación');
    });

    it('lanza un error de comunicación genérico para otros errores de red', async () => {
        const service = makeService(jest.fn().mockRejectedValue(new Error('ECONNREFUSED')));

        await expect(service.fetchSumario(new Date('2026-03-16')))
            .rejects.toThrow('Fallo de comunicación con la API del BOE');
    });

    it('construye la URL con la fecha formateada correctamente (YYYYMMDD)', async () => {
        const mockGet = jest.fn().mockResolvedValue({ data: '<xml/>' });
        const service = makeService(mockGet);

        await service.fetchSumario(new Date('2026-03-06'));

        expect(mockGet).toHaveBeenCalledWith(
            'https://boe.es/api/sumario/20260306',
            expect.any(Object)
        );
    });
});

describe('boeHttpService — fetchXMLContent', () => {

    it('retorna el contenido XML de la URL dada', async () => {
        const service = makeService(jest.fn().mockResolvedValue({ data: '<anuncio/>' }));

        const result = await service.fetchXMLContent('https://boe.es/boe/xml/BOE-B-2026-1.xml');

        expect(result).toBe('<anuncio/>');
    });
});