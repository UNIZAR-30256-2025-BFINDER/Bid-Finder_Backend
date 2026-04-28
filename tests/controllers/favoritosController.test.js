/**
 * @fileoverview Tests unitarios para favoritosController
 * Probamos concurrencia a nivel de lógica de negocio con mocks,
 * y persistencia (populate, manejo de errores, etc.)
 */

const createFavoritosController = require("../../app_server/controllers/favoritosController");
const Usuario = require("../../app_server/models/usuario");

// Mock del modelo Usuario (para evitar conexión real a BD)
jest.mock("../../app_server/models/usuario", () => ({
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
}));

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("FavoritosController", () => {
    let controller;
    let mockSubastasService;
    let mockLogger;
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();

        mockSubastasService = {
            getSubastaById: jest.fn(),
        };
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };
        controller = createFavoritosController(mockSubastasService, mockLogger);

        req = {
            user: { id: "user123" },
            params: {},
            body: {},
        };
        res = mockRes();
    });

    describe("addFavorite", () => {
        it("debe añadir favorito correctamente y devolver 200 con la lista poblada", async () => {
            const subastaId = "BOE-B-2026-123";
            req.params.subastaId = subastaId;

            const mockSubasta = {
                _id: "objId123",
                id: subastaId,
                titulo: "Subasta test",
            };
            mockSubastasService.getSubastaById.mockResolvedValue(mockSubasta);

            const mockUsuarioActualizado = {
                favoritos: [mockSubasta],
            };
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
            };
            // Simulamos la cadena findByIdAndUpdate(...).populate('favoritos')
            Usuario.findByIdAndUpdate.mockReturnValue(mockQuery);
            mockQuery.populate.mockResolvedValue(mockUsuarioActualizado);

            await controller.addFavorite(req, res);

            expect(mockSubastasService.getSubastaById).toHaveBeenCalledWith(
                subastaId,
            );
            expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith(
                "user123",
                { $addToSet: { favoritos: "objId123" } },
                { new: true },
            );
            expect(mockQuery.populate).toHaveBeenCalledWith("favoritos");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                message: "Subasta añadida a favoritos",
                data: { favoritos: [mockSubasta] },
            });
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining("añadió favorito BOE-B-2026-123"),
            );
        });

        it("debe retornar 404 si la subasta no existe", async () => {
            req.params.subastaId = "INEXISTENTE";
            mockSubastasService.getSubastaById.mockResolvedValue(null);

            await controller.addFavorite(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: { message: "Subasta no encontrada", status: 404 },
            });
            expect(Usuario.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it("debe manejar error del servicio y retornar 500", async () => {
            req.params.subastaId = "BOE-123";
            mockSubastasService.getSubastaById.mockRejectedValue(
                new Error("BD caída"),
            );

            await controller.addFavorite(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: {
                    message: "Error interno al añadir favorito",
                    status: 500,
                },
            });
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe("removeFavorite", () => {
        it("debe eliminar favorito correctamente y devolver 200", async () => {
            const subastaId = "BOE-B-2026-123";
            req.params.subastaId = subastaId;

            const mockSubasta = { _id: "objId123", id: subastaId };
            mockSubastasService.getSubastaById.mockResolvedValue(mockSubasta);

            const mockUsuarioActualizado = { favoritos: [] };
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
            };
            Usuario.findByIdAndUpdate.mockReturnValue(mockQuery);
            mockQuery.populate.mockResolvedValue(mockUsuarioActualizado);

            await controller.removeFavorite(req, res);

            expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith(
                "user123",
                { $pull: { favoritos: "objId123" } },
                { new: true },
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                message: "Subasta eliminada de favoritos",
                data: { favoritos: [] },
            });
        });

        it("debe retornar 404 si la subasta a eliminar no existe", async () => {
            req.params.subastaId = "INEXISTENTE";
            mockSubastasService.getSubastaById.mockResolvedValue(null);

            await controller.removeFavorite(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(Usuario.findByIdAndUpdate).not.toHaveBeenCalled();
        });
    });

    describe("listFavorites", () => {
        it("debe devolver la lista poblada de favoritos", async () => {
            const mockSubastas = [
                { _id: "obj1", id: "BOE-1", titulo: "Subasta 1" },
                { _id: "obj2", id: "BOE-2", titulo: "Subasta 2" },
            ];
            const mockUsuario = { favoritos: mockSubastas };

            // Creamos el objeto query que simula la cadena .populate().select()
            const mockQuery = {
                populate: jest.fn().mockReturnThis(), // populate devuelve el mismo objeto
                select: jest.fn().mockResolvedValue(mockUsuario), // select devuelve una promesa con el usuario
            };
            Usuario.findById.mockReturnValue(mockQuery);

            await controller.listFavorites(req, res);

            expect(Usuario.findById).toHaveBeenCalledWith("user123");
            expect(mockQuery.populate).toHaveBeenCalledWith("favoritos");
            expect(mockQuery.select).toHaveBeenCalledWith("favoritos");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: { favoritos: mockSubastas },
            });
        });

        it("debe devolver array vacío si usuario no tiene favoritos", async () => {
            const mockUsuario = { favoritos: [] };
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValue(mockUsuario),
            };
            Usuario.findById.mockReturnValue(mockQuery);

            await controller.listFavorites(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: { favoritos: [] },
            });
            expect(mockQuery.populate).toHaveBeenCalledWith("favoritos");
            expect(mockQuery.select).toHaveBeenCalledWith("favoritos");
        });

        it("debe manejar error en la consulta y devolver 500", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockRejectedValue(new Error("Fallo BD")),
            };
            Usuario.findById.mockReturnValue(mockQuery);

            await controller.listFavorites(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: {
                    message: "Error interno al listar favoritos",
                    status: 500,
                },
            });
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    // Prueba específica de concurrencia (aquí verificamos que $addToSet evita duplicados a nivel de lógica del controlador)
    describe("Concurrencia (lógica de $addToSet)", () => {
        it("llamar a addFavorite dos veces con la misma subasta no debería intentar duplicar en la BD (gracias a $addToSet)", async () => {
            const subastaId = "BOE-B-2026-123";
            req.params.subastaId = subastaId;
            const mockSubasta = { _id: "objId123", id: subastaId };
            mockSubastasService.getSubastaById.mockResolvedValue(mockSubasta);

            const mockUsuarioActualizado = { favoritos: [mockSubasta] };
            const mockQuery = {
                populate: jest.fn().mockResolvedValue(mockUsuarioActualizado),
            };
            Usuario.findByIdAndUpdate.mockReturnValue(mockQuery);

            // Primera llamada
            await controller.addFavorite(req, res);
            // Segunda llamada (simulando otro request)
            await controller.addFavorite(req, res);

            // Aunque llamamos dos veces, el controlador usa $addToSet,
            // por lo que la operación MongoDB es idempotente.
            // Pero no podemos probar el resultado final porque no hay BD real.
            // Sólo verificamos que ambas llamadas no lanzan error y llaman al modelo.
            expect(Usuario.findByIdAndUpdate).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
