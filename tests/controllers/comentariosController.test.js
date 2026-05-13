/**
 * @fileoverview Tests unitarios para comentariosController.
 */

const createComentariosController = require("../../app_server/controllers/comentariosController");
const Usuario = require("../../app_server/models/usuario");

jest.mock("../../app_server/models/usuario", () => ({
    findById: jest.fn(),
}));

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const mockService = {
    crearComentario: jest.fn(),
    obtenerComentariosPorSubasta: jest.fn(),
    eliminarComentario: jest.fn(),
};

const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
};

const controller = createComentariosController(mockService, mockLogger);

beforeEach(() => {
    jest.clearAllMocks();
});

describe("comentariosController — crearComentario", () => {
    it("responde 201 y crea el comentario si los datos son válidos", async () => {
        const req = {
            params: { id: "BOE-123" },
            body: { texto: "Buen piso" },
            user: { id: "user-123" },
        };
        const res = mockRes();

        mockService.crearComentario.mockResolvedValue({
            _id: "com-1",
            texto: "Buen piso",
        });

        await controller.crearComentario(req, res);

        expect(mockService.crearComentario).toHaveBeenCalledWith(
            "BOE-123",
            "user-123",
            "Buen piso",
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: { _id: "com-1", texto: "Buen piso" },
        });
    });

    it("responde 400 si el texto está vacío (error de validación)", async () => {
        const req = {
            params: { id: "BOE-123" },
            body: { texto: "" },
            user: { id: "user-123" },
        };
        const res = mockRes();

        mockService.crearComentario.mockRejectedValue(
            new Error("El texto del comentario no puede estar vacío"),
        );

        await controller.crearComentario(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockLogger.error).toHaveBeenCalled();
    });
});

describe("comentariosController — obtenerComentarios", () => {
    it("responde 200 y devuelve la lista de comentarios", async () => {
        const req = { params: { id: "BOE-123" } };
        const res = mockRes();
        const lista = [{ texto: "Comentario 1" }];

        mockService.obtenerComentariosPorSubasta.mockResolvedValue(lista);

        await controller.obtenerComentarios(req, res);

        expect(mockService.obtenerComentariosPorSubasta).toHaveBeenCalledWith(
            "BOE-123",
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: lista,
        });
    });
});

describe("comentariosController — eliminarComentario", () => {
    it("responde 200 y elimina el comentario si todo es correcto", async () => {
        const req = {
            params: { comentarioId: "com-1" },
            user: { id: "admin-id" },
        };
        const res = mockRes();

        Usuario.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ rol: "admin" }),
        });

        mockService.eliminarComentario.mockResolvedValue({ _id: "com-1" });

        await controller.eliminarComentario(req, res);

        expect(mockService.eliminarComentario).toHaveBeenCalledWith(
            "com-1",
            "admin-id",
            "admin",
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            message: "Comentario eliminado permanentemente",
            data: { _id: "com-1" },
        });
    });

    it("responde 403 si el servicio indica falta de permisos (no es admin)", async () => {
        const req = {
            params: { comentarioId: "com-1" },
            user: { id: "usuario-id" },
        };
        const res = mockRes();

        Usuario.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ rol: "usuario" }),
        });

        mockService.eliminarComentario.mockRejectedValue(
            new Error(
                "No autorizado para eliminar este comentario. Se requiere privilegios de administrador.",
            ),
        );

        await controller.eliminarComentario(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockLogger.error).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.objectContaining({ status: 403 }),
            }),
        );
    });

    it("responde 404 si el comentario no existe", async () => {
        const req = {
            params: { comentarioId: "com-999" },
            user: { rol: "admin" },
        };
        const res = mockRes();

        mockService.eliminarComentario.mockRejectedValue(
            new Error("Comentario no encontrado"),
        );

        await controller.eliminarComentario(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(mockLogger.error).toHaveBeenCalled();
    });
});
