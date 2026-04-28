/**
 * @fileoverview Tests unitarios para statsController.
 */

const createStatsController = require('../../app_server/controllers/statsController');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
};

describe('statsController', () => {
    beforeEach(() => jest.clearAllMocks());

    it('getStatsSubastasPorCategoria responde 200 con datos', async () => {
        const mockService = { obtenerStatsCategorias: jest.fn().mockResolvedValue([{ _id: 'INMUEBLE', total: 2 }]) };
        const controller = createStatsController(mockService, mockLogger);
        const req = {};
        const res = mockRes();

        await controller.getStatsSubastasPorCategoria(req, res);

        expect(mockService.obtenerStatsCategorias).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ _id: 'INMUEBLE', total: 2 }] });
    });

    it('getStatsSubastasPorCategoria responde 500 y loggea si hay error', async () => {
        const mockService = { obtenerStatsCategorias: jest.fn().mockRejectedValue(new Error('DB caída')) };
        const controller = createStatsController(mockService, mockLogger);
        const req = {};
        const res = mockRes();

        await controller.getStatsSubastasPorCategoria(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('getStatsSubastasPorProvincia responde 200 con datos', async () => {
        const mockService = { obtenerStatsProvincias: jest.fn().mockResolvedValue([{ _id: 'Madrid', total: 5 }]) };
        const controller = createStatsController(mockService, mockLogger);
        const req = {};
        const res = mockRes();

        await controller.getStatsSubastasPorProvincia(req, res);

        expect(mockService.obtenerStatsProvincias).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ _id: 'Madrid', total: 5 }] });
    });

    it('getStatsSubastasPorProvincia responde 500 y loggea si hay error', async () => {
        const mockService = { obtenerStatsProvincias: jest.fn().mockRejectedValue(new Error('DB caída')) };
        const controller = createStatsController(mockService, mockLogger);
        const req = {};
        const res = mockRes();

        await controller.getStatsSubastasPorProvincia(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(mockLogger.error).toHaveBeenCalled();
    });
});
