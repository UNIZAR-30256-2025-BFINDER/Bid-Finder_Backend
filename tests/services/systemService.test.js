const createSystemService = require('../../app_server/services/systemService');

describe('systemService — obtenerEstadoSistema', () => {
    const mockRepo = {
        getSystemStats: jest.fn()
    };
    const service = createSystemService(mockRepo);

    it('debería devolver el objeto de estado completo con datos del repositorio', async () => {
        const fakeStats = { ingresadasHoy: 5, ultimaIngesta: new Date() };
        mockRepo.getSystemStats.mockResolvedValue(fakeStats);

        const result = await service.obtenerEstadoSistema();

        expect(result).toHaveProperty('estado_backend', 'ONLINE');
        expect(result.ingresadasHoy).toBe(5);
        expect(result.ultimaIngesta).toEqual(fakeStats.ultimaIngesta);
    });
});