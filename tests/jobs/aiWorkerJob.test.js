/**
 * @fileoverview Test de integración para aiWorkerJob.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose              = require('mongoose');
const Subasta               = require('../../app_server/models/subasta');

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

const deps = { subastasRepository, aiService: mockAiService, logger: mockLogger };

describe('AI Worker — test de integración', () => {
    beforeEach(async () => {
        await Subasta.deleteMany({});
        mockExtraer.mockClear();
    });

    it('debería procesar una subasta PENDIENTE y actualizarla a PROCESADO con oportunidad calculada', async () => {
        const subastaOriginal = await Subasta.create({
            id: 'TEST-123',
            titulo: 'Subasta de prueba',
            texto: 'Texto crudo del BOE',
            estado_ia: 'PENDIENTE',
            fechaPublicacion: 20260329,
            urlPdf: '/fake/url.pdf',
            rawXml: '<test></test>',
        });

        mockExtraer.mockResolvedValue({
            titulo_resumido: 'Piso en Madrid',
            precio_salida: 100000,
            valor_tasacion: 150000,
            resumen: 'Un resumen bien hecho',
        });

        await runWorker(deps);

        const subastaFinal = await Subasta.findOne({ id: 'TEST-123' });
        expect(subastaFinal.estado_ia).toBe('PROCESADO');
        expect(subastaFinal.titulo_resumido).toBe('Piso en Madrid');
        expect(subastaFinal.precio_salida).toBe(100000);
        expect(subastaFinal.valor_tasacion).toBe(150000);
        expect(subastaFinal.diferencia_porcentual_oportunidad).toBe(-33.33);
        expect(subastaFinal.nivel_oportunidad).toBe('MEDIO');
        expect(subastaFinal.updatedAt).not.toEqual(subastaOriginal.updatedAt);
    });

    it('debería marcar como ERROR si la IA falla', async () => {
        await Subasta.create({
            id: 'TEST-ERROR',
            titulo: 'Subasta fallida',
            texto: 'Texto crudo',
            estado_ia: 'PENDIENTE',
            fechaPublicacion: 20260329,
            urlPdf: '/fake/url.pdf',
            rawXml: '<test></test>',
        });

        mockExtraer.mockRejectedValue(new Error('IA fuera de servicio'));

        await runWorker(deps);

        const subastaFallida = await Subasta.findOne({ id: 'TEST-ERROR' });
        expect(subastaFallida.estado_ia).toBe('ERROR');
    });

    it('debería detener el procesamiento si la IA devuelve error de cuota', async () => {
        await Subasta.create({
            id: 'TEST-QUOTA-1', titulo: 'S1', texto: 'T', estado_ia: 'PENDIENTE',
            fechaPublicacion: 20260329, urlPdf: '/fake/url.pdf', rawXml: '<test/>'
        });
        await Subasta.create({
            id: 'TEST-QUOTA-2', titulo: 'S2', texto: 'T', estado_ia: 'PENDIENTE',
            fechaPublicacion: 20260329, urlPdf: '/fake/url.pdf', rawXml: '<test/>'
        });

        mockExtraer.mockRejectedValue(new Error('Fallo en todos los proveedores de IA'));

        await runWorker(deps);

        expect(mockExtraer).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Límite de cuota')
        );
    });
});