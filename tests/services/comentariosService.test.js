/**
 * @fileoverview Tests unitarios para comentariosService.
 */

const createComentariosService = require('../../app_server/services/comentariosService');

const mockRepository = {
    save: jest.fn(),
    findBySubastaId: jest.fn(),
    findById: jest.fn(), 
    deleteById: jest.fn()
};

const service = createComentariosService(mockRepository);

beforeEach(() => {
    jest.clearAllMocks();
});

describe('comentariosService — crearComentario', () => {
    
    it('debería guardar y devolver el comentario si el texto es válido, aplicando trim', async () => {
        const fakeComentario = { _id: '1', texto: 'Buen piso' };
        mockRepository.save.mockResolvedValue(fakeComentario);

        const result = await service.crearComentario('BOE-123', 'user-123', '   Buen piso   ');

        expect(mockRepository.save).toHaveBeenCalledWith({
            subasta_id: 'BOE-123',
            usuario_id: 'user-123',
            texto: 'Buen piso'
        });
        expect(result).toEqual(fakeComentario);
    });

    it('debería lanzar un error si el texto está vacío', async () => {
        await expect(service.crearComentario('BOE-123', 'user-123', ''))
            .rejects
            .toThrow('El texto del comentario no puede estar vacío');
        
        expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar un error si el texto contiene solo espacios', async () => {
        await expect(service.crearComentario('BOE-123', 'user-123', '      '))
            .rejects
            .toThrow('El texto del comentario no puede estar vacío');
        
        expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar un error si el texto es null o undefined', async () => {
        await expect(service.crearComentario('BOE-123', 'user-123', null))
            .rejects
            .toThrow('El texto del comentario no puede estar vacío');
        
        expect(mockRepository.save).not.toHaveBeenCalled();
    });
});

describe('comentariosService — obtenerComentariosPorSubasta', () => {
    
    it('debería devolver la lista de comentarios llamando al repositorio', async () => {
        const fakeLista = [{ texto: 'Comentario 1' }, { texto: 'Comentario 2' }];
        mockRepository.findBySubastaId.mockResolvedValue(fakeLista);

        const result = await service.obtenerComentariosPorSubasta('BOE-123');

        expect(mockRepository.findBySubastaId).toHaveBeenCalledWith('BOE-123');
        expect(result).toEqual(fakeLista);
    });
});

describe('comentariosService — eliminarComentario', () => {
    
    it('debería eliminar el comentario llamando al repositorio si es admin y existe', async () => {
        mockRepository.findById.mockResolvedValue({ _id: 'com-1', texto: 'test' });
        mockRepository.deleteById.mockResolvedValue({ _id: 'com-1' });

        const result = await service.eliminarComentario('com-1', 'admin');

        expect(mockRepository.findById).toHaveBeenCalledWith('com-1');
        expect(mockRepository.deleteById).toHaveBeenCalledWith('com-1');
        expect(result).toEqual({ _id: 'com-1' });
    });

    it('debería lanzar un error si el comentario no se encuentra en base de datos', async () => {
        mockRepository.findById.mockResolvedValue(null);

        await expect(service.eliminarComentario('com-999', 'admin'))
            .rejects
            .toThrow('Comentario no encontrado');
        
        expect(mockRepository.deleteById).not.toHaveBeenCalled();
    });

    it('debería lanzar un error si el rol del usuario no es admin', async () => {
        mockRepository.findById.mockResolvedValue({ _id: 'com-1', texto: 'test' });

        await expect(service.eliminarComentario('com-1', 'usuario'))
            .rejects
            .toThrow('No autorizado para eliminar este comentario');
        
        expect(mockRepository.deleteById).not.toHaveBeenCalled();
    });
});