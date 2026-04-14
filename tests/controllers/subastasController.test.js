/**
 * @fileoverview Tests unitarios para subastasController.
 */

const createSubastasController = require('../../app_server/controllers/subastasController');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
}

const mockService = {
    getAllSubastas:  jest.fn(),
    getSubastaById: jest.fn(),
};

const controller = createSubastasController(mockService);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});


describe('subastasController — getAllSubastas', () => {

    it('responde 200 con la lista sin filtros y el objeto meta', async () => {
        const lista = [{ id: 'BOE-1' }];
        mockService.getAllSubastas.mockResolvedValue(lista);
        const req = { query: {} }; 
        const res = mockRes();

        await controller.getAllSubastas(req, res);

        expect(mockService.getAllSubastas).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ 
            status: 'success', 
            meta: { filtrosAplicados: {}, total: 1 },
            data: lista 
        });
    });

    it('responde 200 y pasa los filtros de la URL al servicio (HU-12)', async () => {
        const lista = [{ id: 'BOE-1' }, { id: 'BOE-2' }];
        mockService.getAllSubastas.mockResolvedValue(lista);
        
        const req = { query: { provincia: 'Madrid', categoria: 'Inmueble' } };
        const res = mockRes();

        await controller.getAllSubastas(req, res);

        expect(mockService.getAllSubastas).toHaveBeenCalledWith({ provincia: 'Madrid', categoria: 'Inmueble' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ 
            status: 'success', 
            meta: { 
                filtrosAplicados: { provincia: 'Madrid', categoria: 'Inmueble' }, 
                total: 2 
            },
            data: lista 
        });
    });

    it('responde 500 si el servicio lanza un error', async () => {
        mockService.getAllSubastas.mockRejectedValue(new Error('DB caída'));
        const req = { query: {} };
        const res = mockRes();

        await controller.getAllSubastas(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ status: 500 }) })
        );
    });
});

describe('subastasController — getSubastaById', () => {

    it('responde 200 con la subasta encontrada', async () => {
        const subasta = { id: 'BOE-B-2026-112', titulo: 'Piso' };
        mockService.getSubastaById.mockResolvedValue(subasta);
        const req = { params: { id: 'BOE-B-2026-112' } };
        const res = mockRes();

        await controller.getSubastaById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ status: 'success', data: subasta });
    });

    it('responde 400 si el id no empieza por BOE', async () => {
        const req = { params: { id: 'INVALIDO-123' } };
        const res = mockRes();

        await controller.getSubastaById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockService.getSubastaById).not.toHaveBeenCalled();
    });

    it('responde 404 si la subasta no existe', async () => {
        mockService.getSubastaById.mockResolvedValue(null);
        const req = { params: { id: 'BOE-INEXISTENTE' } };
        const res = mockRes();

        await controller.getSubastaById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 si el servicio lanza un error', async () => {
        mockService.getSubastaById.mockRejectedValue(new Error('DB caída'));
        const req = { params: { id: 'BOE-B-2026-112' } };
        const res = mockRes();

        await controller.getSubastaById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.objectContaining({ status: 500 }) })
        );
    });
});