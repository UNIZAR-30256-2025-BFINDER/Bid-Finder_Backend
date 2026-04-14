/**
 * @fileoverview Tests unitarios para subastasService.
 */

const createSubastasService = require('../../app_server/services/subastasService');

const mockRepository = {
    findAll:   jest.fn(),
    findById:  jest.fn(),
};

const service = createSubastasService(mockRepository);

beforeEach(() => jest.clearAllMocks());

describe('subastasService', () => {

    describe('getAllSubastas', () => {
        it('devuelve la lista de subastas del repositorio', async () => {
            const lista = [{ id: 'BOE-1' }, { id: 'BOE-2' }];
            mockRepository.findAll.mockResolvedValue(lista);

            const result = await service.getAllSubastas();

            expect(result).toEqual(lista);
            expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
        });

        it('propaga el error si el repositorio falla', async () => {
            mockRepository.findAll.mockRejectedValue(new Error('DB caída'));

            await expect(service.getAllSubastas()).rejects.toThrow('DB caída');
        });

        it('pasa los filtros al repositorio', async () => {
            const lista = [{ id: 'BOE-1' }];
            mockRepository.findAll.mockResolvedValue(lista);
            const filtros = { provincia: 'valencia', categoria: 'inmueble' };

            const result = await service.getAllSubastas(filtros);

            expect(result).toEqual(lista);
            expect(mockRepository.findAll).toHaveBeenCalledWith(filtros);
        });
    });

    describe('getSubastaById', () => {
        it('devuelve la subasta correspondiente al id', async () => {
            const subasta = { id: 'BOE-B-2026-112', titulo: 'Piso en Madrid' };
            mockRepository.findById.mockResolvedValue(subasta);

            const result = await service.getSubastaById('BOE-B-2026-112');

            expect(result).toEqual(subasta);
            expect(mockRepository.findById).toHaveBeenCalledWith('BOE-B-2026-112');
        });

        it('devuelve null si no existe la subasta', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.getSubastaById('BOE-INEXISTENTE');

            expect(result).toBeNull();
        });

        it('propaga el error si el repositorio falla', async () => {
            mockRepository.findById.mockRejectedValue(new Error('DB caída'));

            await expect(service.getSubastaById('BOE-1')).rejects.toThrow('DB caída');
        });
    });
});