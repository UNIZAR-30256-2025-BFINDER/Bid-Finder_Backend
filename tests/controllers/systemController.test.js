const createSystemController = require('../../app_server/controllers/systemController');

describe('systemController — getEstadoSistema', () => {
    const mockService = { obtenerEstadoSistema: jest.fn() };
    const mockLogger = { error: jest.fn() };
    const controller = createSystemController(mockService, mockLogger);

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    it('responde 200 con los datos del sistema', async () => {
        const fakeData = { estado: 'OK' };
        mockService.obtenerEstadoSistema.mockResolvedValue(fakeData);
        const res = mockRes();

        await controller.getEstadoSistema({}, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            data: fakeData
        });
    });

    it('responde 500 si ocurre un error en el servicio', async () => {
        mockService.obtenerEstadoSistema.mockRejectedValue(new Error('Fallo crítico'));
        const res = mockRes();

        await controller.getEstadoSistema({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(mockLogger.error).toHaveBeenCalled();
    });
});