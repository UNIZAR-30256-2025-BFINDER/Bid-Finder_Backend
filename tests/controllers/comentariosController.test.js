/**
 * @fileoverview Tests unitarios para comentariosController.
 */

const createComentariosController = require('../../app_server/controllers/comentariosController');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const mockService = {
    crearComentario: jest.fn(),
    obtenerComentariosPorSubasta: jest.fn(),
};

const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
};

const controller = createComentariosController(mockService, mockLogger);

beforeEach(() => {
    jest.clearAllMocks();
});

describe('comentariosController — crearComentario', () => {
    it('responde 201 y crea el comentario si los datos son válidos', async () => {
        const req = {
            params: { id: 'BOE-123' },
            body: { texto: 'Buen piso' },
            user: { id: 'user-123' }
        };
        const res = mockRes();
        
        mockService.crearComentario.mockResolvedValue({ _id: 'com-1', texto: 'Buen piso' });

        await controller.crearComentario(req, res);

        expect(mockService.crearComentario).toHaveBeenCalledWith('BOE-123', 'user-123', 'Buen piso');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            data: { _id: 'com-1', texto: 'Buen piso' }
        });
    });

    it('responde 400 si el texto está vacío (error de validación)', async () => {
        const req = {
            params: { id: 'BOE-123' },
            body: { texto: '' },
            user: { id: 'user-123' }
        };
        const res = mockRes();
        
        mockService.crearComentario.mockRejectedValue(new Error('El texto del comentario no puede estar vacío'));

        await controller.crearComentario(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockLogger.error).toHaveBeenCalled();
    });
});

describe('comentariosController — obtenerComentarios', () => {
    it('responde 200 y devuelve la lista de comentarios', async () => {
        const req = { params: { id: 'BOE-123' } };
        const res = mockRes();
        const lista = [{ texto: 'Comentario 1' }];
        
        mockService.obtenerComentariosPorSubasta.mockResolvedValue(lista);

        await controller.obtenerComentarios(req, res);

        expect(mockService.obtenerComentariosPorSubasta).toHaveBeenCalledWith('BOE-123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            data: lista
        });
    });
});