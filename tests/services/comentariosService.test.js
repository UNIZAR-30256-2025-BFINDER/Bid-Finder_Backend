/**
 * @fileoverview Tests unitarios para comentariosService.
 */

const createComentariosService = require('../../app_server/services/comentariosService');

const mockRepository = {
    save: jest.fn(),
    findBySubastaId: jest.fn()
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