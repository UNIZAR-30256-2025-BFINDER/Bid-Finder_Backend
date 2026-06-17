/**
 * @fileoverview Tests unitarios para boeIngestionJob.
 * Cubre runIngestion, isNonPublicationDay e isNoPublicationError.
 */

jest.mock('../../app_server/config/database', () => jest.fn().mockResolvedValue());

const { runIngestion, isNonPublicationDay, isNoPublicationError } =
    require('../../app_server/jobs/boeIngestionJob');

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockIngestionController = { runDailyIngestion: jest.fn() };
const deps = { ingestionController: mockIngestionController, logger: mockLogger };

beforeEach(() => jest.clearAllMocks());

describe('isNonPublicationDay', () => {
    it('devuelve true para el domingo (getDay === 0)', () => {
        expect(isNonPublicationDay(new Date('2026-03-22'))).toBe(true); // domingo
    });

    it('devuelve false para días laborables', () => {
        expect(isNonPublicationDay(new Date('2026-03-16'))).toBe(false); // lunes
        expect(isNonPublicationDay(new Date('2026-03-21'))).toBe(false); // sábado
    });
});

describe('isNoPublicationError', () => {
    it('devuelve true si el error tiene status 404', () => {
        const err = Object.assign(new Error('not found'), { response: { status: 404 } });
        expect(isNoPublicationError(err)).toBe(true);
    });

    it('devuelve true si el mensaje incluye "no data"', () => {
        expect(isNoPublicationError(new Error('no data available'))).toBe(true);
    });

    it('devuelve true si el mensaje incluye "No se encontró publicación"', () => {
        expect(isNoPublicationError(new Error('No se encontró publicación para la fecha 20260322'))).toBe(true);
    });

    it('devuelve false para errores genéricos', () => {
        expect(isNoPublicationError(new Error('Timeout de red'))).toBe(false);
    });

    it('devuelve false para un error sin mensaje ni response', () => {
        expect(isNoPublicationError({})).toBe(false);
    });
});

describe('runIngestion', () => {
    it('no llama a runDailyIngestion si es domingo y retorna 0', async () => {
        const result = await runIngestion(deps, new Date('2026-03-22'));

        expect(mockIngestionController.runDailyIngestion).not.toHaveBeenCalled();
        expect(result).toBe(0);
    });

    it('llama a runDailyIngestion con la fecha correcta y retorna 0', async () => {
        mockIngestionController.runDailyIngestion.mockResolvedValue(true);
        const date = new Date('2026-03-16');

        const result = await runIngestion(deps, date);

        expect(mockIngestionController.runDailyIngestion).toHaveBeenCalledWith(date);
        expect(result).toBe(0);
    });

    it('propagates el error si runDailyIngestion falla', async () => {
        mockIngestionController.runDailyIngestion.mockRejectedValue(new Error('Fallo de red'));

        await expect(runIngestion(deps, new Date('2026-03-16')))
            .rejects.toThrow('Fallo de red');
    });

    it('debe usar la fecha por defecto (hoy) si no se le pasa parámetro', async () => {
        mockIngestionController.runDailyIngestion.mockResolvedValue(true);
        const result = await runIngestion(deps);
        expect(result).toBe(0);
    });

    it('debe ejecutar la ingesta si se invoca desde CLI', async () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
        global.__TEST_CLI__ = true;

        jest.isolateModules(() => {
            require('../../app_server/jobs/boeIngestionJob');
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockExit).toHaveBeenCalledWith(0);

        delete global.__TEST_CLI__;
        mockExit.mockRestore();
    });

    it('debe registrar error y salir con 1 si la ingesta falla en modo CLI', async () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
        
        // Mock container to reject runDailyIngestion
        const mockContainer = require('../../app_server/config/container');
        const depsMocked = mockContainer();
        depsMocked.ingestionController.runDailyIngestion = jest.fn().mockRejectedValue(new Error('CLI Ingestion Failure'));

        global.__TEST_CLI__ = true;

        jest.isolateModules(() => {
            require('../../app_server/jobs/boeIngestionJob');
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockExit).toHaveBeenCalledWith(1);

        delete global.__TEST_CLI__;
        mockExit.mockRestore();
    });
});

// Mock container dependency
jest.mock('../../app_server/config/container', () => {
    const mockIngController = { runDailyIngestion: jest.fn().mockResolvedValue(true) };
    return () => ({
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        ingestionController: mockIngController
    });
});