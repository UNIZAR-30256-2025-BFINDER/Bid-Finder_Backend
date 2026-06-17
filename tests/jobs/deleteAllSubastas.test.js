/**
 * @fileoverview Tests unitarios para el script de borrado masivo de subastas.
 */

const mongoose = require('mongoose');

jest.mock('dotenv', () => ({
    config: jest.fn()
}));

jest.mock('mongoose', () => {
    const mockDb = {
        dropCollection: jest.fn().mockResolvedValue(true)
    };
    return {
        connect: jest.fn(),
        disconnect: jest.fn().mockResolvedValue(true),
        connection: {
            db: mockDb
        }
    };
});

const Subasta = require('../../app_server/models/subasta');
jest.mock('../../app_server/models/subasta', () => {
    return {
        countDocuments: jest.fn(),
        deleteMany: jest.fn()
    };
});

describe('deleteAllSubastas job', () => {
    let mockExit;
    let mockConsoleLog;
    let mockConsoleError;
    let originalEnv;

    beforeAll(() => {
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        originalEnv = { ...process.env };
    });

    afterAll(() => {
        mockExit.mockRestore();
        mockConsoleLog.mockRestore();
        mockConsoleError.mockRestore();
        process.env = originalEnv;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    it('debe conectarse a MongoDB, contar, borrar, hacer drop de la colección y salir con 0', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        mongoose.connect.mockResolvedValue(true);
        Subasta.countDocuments
            .mockResolvedValueOnce(100) // totalBefore
            .mockResolvedValueOnce(0);  // totalAfter
        Subasta.deleteMany.mockResolvedValue({ deletedCount: 100 });

        jest.isolateModules(() => {
            require('../../app_server/jobs/deleteAllSubastas');
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockExit).toHaveBeenCalledWith(0);
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Eliminados: 100 documentos'));
    });

    it('debe abortar y salir con 1 si no hay MONGODB_URI definida', async () => {
        delete process.env.MONGODB_URI;
        delete process.env.MONGO_URI;
        delete process.env.MONGODB_URL;

        jest.isolateModules(() => {
            require('../../app_server/jobs/deleteAllSubastas');
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockExit).toHaveBeenCalledWith(1);
        expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('No MONGODB_URI found'));
    });

    it('debe salir con 1 si mongoose.connect lanza un error', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        mongoose.connect.mockRejectedValue(new Error('Connection failed'));

        jest.isolateModules(() => {
            require('../../app_server/jobs/deleteAllSubastas');
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(mockExit).toHaveBeenCalledWith(1);
        expect(mockConsoleError).toHaveBeenCalled();
    });
});
