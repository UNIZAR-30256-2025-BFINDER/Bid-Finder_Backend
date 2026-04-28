/**
 * @fileoverview Tests unitarios para statsService.
 */

const createStatsService = require('../../app_server/services/statsService');

describe('Stats Service', () => {
    beforeEach(() => jest.clearAllMocks());

    it('obtenerStatsCategorias devuelve el resultado del repositorio', async () => {
        const fakeAgg = [{ _id: 'INMUEBLE', total: 3 }];
        const repo = { aggregateByCategoria: jest.fn().mockResolvedValue(fakeAgg) };
        const svc = createStatsService(repo);

        const result = await svc.obtenerStatsCategorias();

        expect(repo.aggregateByCategoria).toHaveBeenCalled();
        expect(result).toEqual(fakeAgg);
    });

    it('obtenerStatsProvincias devuelve el resultado del repositorio', async () => {
        const fakeAgg = [{ _id: 'Madrid', total: 7 }];
        const repo = { aggregateByProvincia: jest.fn().mockResolvedValue(fakeAgg) };
        const svc = createStatsService(repo);

        const result = await svc.obtenerStatsProvincias();

        expect(repo.aggregateByProvincia).toHaveBeenCalled();
        expect(result).toEqual(fakeAgg);
    });

    it('propaga errores del repositorio en obtenerStatsCategorias', async () => {
        const repo = { aggregateByCategoria: jest.fn().mockRejectedValue(new Error('DB caída')) };
        const svc = createStatsService(repo);

        await expect(svc.obtenerStatsCategorias()).rejects.toThrow('DB caída');
    });
});
