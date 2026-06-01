/**
 * @fileoverview Test de integración para aiWorkerJob (multi-subasta).
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose              = require('mongoose');
const Anuncio               = require('../../app_server/models/anuncio');

jest.mock('../../app_server/config/database', () => jest.fn().mockResolvedValue());

const { runWorker } = require('../../app_server/jobs/aiWorkerJob');

const mockLogger = {
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

const mockExtraer = jest.fn();
const mockAiService = { extraerDatosSubasta: mockExtraer };

const mockGeoCodingService = {
    getCoordinatesFromAddress: jest.fn().mockResolvedValue({
        geojson: { type: 'Point', coordinates: [-3.7038, 40.4168] },
        raw: null,
        fallbackUsed: false,
        query: 'Madrid'
    })
};

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

const createSubastasRepository = require('../../app_server/repositories/subastasRepository');
const subastasRepository = createSubastasRepository();

const deps = { 
    subastasRepository, 
    aiService: mockAiService, 
    logger: mockLogger,
    geoCodingService: mockGeoCodingService 
};

describe('AI Worker — test de integración (multi-subasta)', () => {
    beforeEach(async () => {
        await Anuncio.deleteMany({});
        mockExtraer.mockClear();
        mockGeoCodingService.getCoordinatesFromAddress.mockClear(); 
    });

    it('debería procesar un anuncio PENDIENTE con una sola subasta', async () => {
        const anuncioOriginal = await Anuncio.create({
            id: 'TEST-123',
            titulo: 'Anuncio de prueba',
            texto: 'Texto crudo del BOE',
            estado_ia: 'PENDIENTE',
            fechaPublicacion: "20260329",
            urlPdf: '/fake/url.pdf',
            rawXml: '<test></test>',
        });

        // AI now returns { subastas: [...] } or { lotes: [...] } format
        mockExtraer.mockResolvedValue({
            subastas: [{
                numero_lote: 1,
                titulo_resumido: 'Piso en Madrid',
                precio_salida: 100000,
                valor_tasacion: 150000,
                resumen: 'Un resumen bien hecho',
            }]
        });

        await runWorker(deps);

        const anuncioFinal = await Anuncio.findOne({ id: 'TEST-123' });
        expect(anuncioFinal.estado_ia).toBe('PROCESADO');
        expect(anuncioFinal.subastas).toHaveLength(1);
        expect(anuncioFinal.subastas[0].titulo_resumido).toBe('Piso en Madrid');
        expect(anuncioFinal.subastas[0].precio_salida).toBe(100000);
        expect(anuncioFinal.subastas[0].valor_tasacion).toBe(150000);
        expect(anuncioFinal.subastas[0].diferencia_porcentual_oportunidad).toBe(-33.33);
        expect(anuncioFinal.subastas[0].nivel_oportunidad).toBe('MEDIO');
        expect(anuncioFinal.updatedAt).not.toEqual(anuncioOriginal.updatedAt);
    });

    it('debería procesar un anuncio con múltiples subastas', async () => {
        await Anuncio.create({
            id: 'TEST-MULTI',
            titulo: 'Anuncio multi-lote',
            texto: 'Texto con LOTE 1 y LOTE 2',
            estado_ia: 'PENDIENTE',
            fechaPublicacion: "20260329",
            urlPdf: '/fake/url.pdf',
            rawXml: '<test></test>',
        });

        mockExtraer.mockResolvedValue({
            subastas: [
                { numero_lote: 1, titulo_resumido: 'Piso', precio_salida: 100000, valor_tasacion: 200000 },
                { numero_lote: 2, titulo_resumido: 'Garaje', precio_salida: 15000, valor_tasacion: 25000 },
            ]
        });

        await runWorker(deps);

        const anuncioFinal = await Anuncio.findOne({ id: 'TEST-MULTI' });
        expect(anuncioFinal.estado_ia).toBe('PROCESADO');
        expect(anuncioFinal.subastas).toHaveLength(2);
        expect(anuncioFinal.subastas[0].titulo_resumido).toBe('Piso');
        expect(anuncioFinal.subastas[1].titulo_resumido).toBe('Garaje');
        expect(mockGeoCodingService.getCoordinatesFromAddress).toHaveBeenCalledTimes(2);
    });

    it('debería marcar como ERROR si la IA falla', async () => {
        await Anuncio.create({
            id: 'TEST-ERROR',
            titulo: 'Anuncio fallido',
            texto: 'Texto crudo',
            estado_ia: 'PENDIENTE',
            fechaPublicacion: "20260329",
            urlPdf: '/fake/url.pdf',
            rawXml: '<test></test>',
        });

        mockExtraer.mockRejectedValue(new Error('IA fuera de servicio'));

        await runWorker(deps);

        const anuncioFallido = await Anuncio.findOne({ id: 'TEST-ERROR' });
        expect(anuncioFallido.estado_ia).toBe('ERROR');
    });

    it('debería detener el procesamiento si la IA devuelve error de cuota', async () => {
        await Anuncio.create({
            id: 'TEST-QUOTA-1', titulo: 'S1', texto: 'T', estado_ia: 'PENDIENTE',
            fechaPublicacion: "20260329", urlPdf: '/fake/url.pdf', rawXml: '<test/>'
        });
        await Anuncio.create({
            id: 'TEST-QUOTA-2', titulo: 'S2', texto: 'T', estado_ia: 'PENDIENTE',
            fechaPublicacion: "20260329", urlPdf: '/fake/url.pdf', rawXml: '<test/>'
        });

        mockExtraer.mockRejectedValue(new Error('Fallo en todos los proveedores de IA'));

        await runWorker(deps);

        expect(mockExtraer).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Límite de cuota')
        );
    });
});