/**
 * @fileoverview Tests unitarios para el seedingJob.
 */

const mockConnectDB = jest.fn().mockResolvedValue(true);
jest.mock('../../app_server/config/database', () => mockConnectDB);

const mockRunSeeding = jest.fn().mockResolvedValue(true);
jest.mock('../../app_server/controllers/seedingController', () => {
    return jest.fn().mockImplementation(() => ({
        runSeeding: mockRunSeeding
    }));
});

const mockRunWorker = jest.fn().mockResolvedValue(true);
jest.mock('../../app_server/jobs/aiWorkerJob', () => ({
    runWorker: mockRunWorker
}));

jest.mock('../../app_server/config/container', () => () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    ingestionController: {}
}));

describe('seedingJob', () => {
    let mockExit;

    beforeAll(() => {
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterAll(() => {
        mockExit.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe exportar el seedingController', () => {
        const seedingController = require('../../app_server/jobs/seedingJob');
        expect(seedingController).toBeDefined();
        expect(seedingController.runSeeding).toBeDefined();
    });

    it('debe ejecutar el flujo completo si se invoca desde CLI', async () => {
        const originalArgv = process.argv;

        // Simulamos argumentos de CLI: node seedingJob.js 5
        process.argv = ['node', 'seedingJob.js', '5'];
        global.__TEST_CLI__ = true;

        jest.isolateModules(() => {
            require('../../app_server/jobs/seedingJob');
        });

        // Esperamos a que terminen las promesas de seedingJob
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockConnectDB).toHaveBeenCalledTimes(1);
        expect(mockRunSeeding).toHaveBeenCalledWith(5);
        expect(mockRunWorker).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(0);

        delete global.__TEST_CLI__;
        process.argv = originalArgv;
    });

    it('debe abortar con 1 si los argumentos de CLI son inválidos', async () => {
        const originalArgv = process.argv;

        process.argv = ['node', 'seedingJob.js', 'invalido'];
        global.__TEST_CLI__ = true;

        jest.isolateModules(() => {
            require('../../app_server/jobs/seedingJob');
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockExit).toHaveBeenCalledWith(1);

        delete global.__TEST_CLI__;
        process.argv = originalArgv;
    });

    it('debe abortar con 1 si runSeeding lanza un error', async () => {
        const originalArgv = process.argv;

        mockRunSeeding.mockRejectedValueOnce(new Error('Seeding failure'));
        process.argv = ['node', 'seedingJob.js', '3'];
        global.__TEST_CLI__ = true;

        jest.isolateModules(() => {
            require('../../app_server/jobs/seedingJob');
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockExit).toHaveBeenCalledWith(1);

        delete global.__TEST_CLI__;
        process.argv = originalArgv;
    });
});
