/**
 * @fileoverview Tests unitarios para comentariosService.
 */

const createComentariosService = require("../../app_server/services/comentariosService");

const mockRepository = {
    save: jest.fn(),
    findBySubastaId: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
};

const service = createComentariosService(mockRepository);

beforeEach(() => {
    jest.clearAllMocks();
});

describe("comentariosService — crearComentario", () => {
    it("debería guardar y devolver el comentario si el texto es válido, aplicando trim", async () => {
        const fakeComentario = { _id: "1", texto: "Buen piso" };
        mockRepository.save.mockResolvedValue(fakeComentario);

        const result = await service.crearComentario(
            "BOE-123",
            "user-123",
            "   Buen piso   ",
        );

        expect(mockRepository.save).toHaveBeenCalledWith({
            subasta_id: "BOE-123",
            usuario_id: "user-123",
            texto: "Buen piso",
        });
        expect(result).toEqual(fakeComentario);
    });

    it("debería lanzar un error si el texto está vacío", async () => {
        await expect(
            service.crearComentario("BOE-123", "user-123", ""),
        ).rejects.toThrow("El texto del comentario no puede estar vacío");

        expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería lanzar un error si el texto contiene solo espacios", async () => {
        await expect(
            service.crearComentario("BOE-123", "user-123", "      "),
        ).rejects.toThrow("El texto del comentario no puede estar vacío");

        expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("debería lanzar un error si el texto es null o undefined", async () => {
        await expect(
            service.crearComentario("BOE-123", "user-123", null),
        ).rejects.toThrow("El texto del comentario no puede estar vacío");

        expect(mockRepository.save).not.toHaveBeenCalled();
    });
});

describe("comentariosService — obtenerComentariosPorSubasta", () => {
    it("debería devolver la lista de comentarios llamando al repositorio", async () => {
        const fakeLista = [
            { texto: "Comentario 1" },
            { texto: "Comentario 2" },
        ];
        mockRepository.findBySubastaId.mockResolvedValue(fakeLista);

        const result = await service.obtenerComentariosPorSubasta("BOE-123");

        expect(mockRepository.findBySubastaId).toHaveBeenCalledWith("BOE-123");
        expect(result).toEqual(fakeLista);
    });
});

describe("comentariosService — obtenerTodosLosComentarios", () => {
    it("debería calcular el skip correctamente en base a la página y límite", async () => {
        const fakeData = { comentarios: [{ texto: "Hola" }], total: 100 };
        mockRepository.findAll.mockResolvedValue(fakeData);

        const result = await service.obtenerTodosLosComentarios(3, 10);

        expect(mockRepository.findAll).toHaveBeenCalledWith(20, 10, "");
        expect(result).toEqual(fakeData);
    });

    it("debería usar valores por defecto para page (1) y limit (10) si no se proveen", async () => {
        const fakeData = { comentarios: [], total: 0 };
        mockRepository.findAll.mockResolvedValue(fakeData);

        await service.obtenerTodosLosComentarios();

        expect(mockRepository.findAll).toHaveBeenCalledWith(0, 10, "");
    });

    it("debería pasar el término de búsqueda al repositorio cuando se proporciona", async () => {
        const fakeData = {
            comentarios: [{ texto: "resultado filtrado" }],
            total: 1,
        };
        mockRepository.findAll.mockResolvedValue(fakeData);

        const result = await service.obtenerTodosLosComentarios(
            2,
            5,
            "test búsqueda",
        );

        expect(mockRepository.findAll).toHaveBeenCalledWith(
            5,
            5,
            "test búsqueda",
        );
        expect(result).toEqual(fakeData);
    });
});

describe("comentariosService — eliminarComentario", () => {
    it("debería eliminar el comentario llamando al repositorio si es admin y existe", async () => {
        mockRepository.findById.mockResolvedValue({
            _id: "com-1",
            texto: "test",
            usuario_id: "dueño-123",
        });
        mockRepository.deleteById.mockResolvedValue({ _id: "com-1" });

        const result = await service.eliminarComentario(
            "com-1",
            "otro-id",
            "admin",
        );

        expect(mockRepository.findById).toHaveBeenCalledWith("com-1");
        expect(mockRepository.deleteById).toHaveBeenCalledWith("com-1");
        expect(result).toEqual({ _id: "com-1" });
    });

    it("debería lanzar un error si el comentario no se encuentra en base de datos", async () => {
        mockRepository.findById.mockResolvedValue(null);

        await expect(
            service.eliminarComentario("com-999", "id-1", "admin"),
        ).rejects.toThrow("Comentario no encontrado");

        expect(mockRepository.deleteById).not.toHaveBeenCalled();
    });

    it("debería lanzar un error si el rol del usuario no es admin ni el autor", async () => {
        mockRepository.findById.mockResolvedValue({
            _id: "com-1",
            texto: "test",
            usuario_id: "dueño-123",
        });

        await expect(
            service.eliminarComentario("com-1", "otro-id", "usuario"),
        ).rejects.toThrow(
            "No autorizado para eliminar este comentario. Se requiere privilegios de administrador.",
        );

        expect(mockRepository.deleteById).not.toHaveBeenCalled();
    });

    it("debería permitir eliminar al autor (usuario normal)", async () => {
        const mockComentario = {
            _id: "com-1",
            texto: "test",
            usuario_id: "propio-id",
        };
        mockRepository.findById.mockResolvedValue(mockComentario);
        mockRepository.deleteById.mockResolvedValue({ _id: "com-1" });

        const result = await service.eliminarComentario(
            "com-1",
            "propio-id",
            "usuario",
        );

        expect(mockRepository.deleteById).toHaveBeenCalledWith("com-1");
        expect(result).toEqual({ _id: "com-1" });
    });
});
