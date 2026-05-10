/**
 * @fileoverview Tests unitarios para favoritosController
 * Probamos que el controlador se comunique correctamente con el favoritosService
 * y maneje los códigos HTTP y errores adecuadamente.
 */

const createFavoritosController = require("../../app_server/controllers/favoritosController");

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("FavoritosController", () => {
    let controller;
    let mockFavoritosService;
    let mockLogger;
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        // Ahora mockeamos el servicio que hemos inyectado
        mockFavoritosService = {
            addFavorite: jest.fn(),
            removeFavorite: jest.fn(),
            getFavorites: jest.fn()
        };
        
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };
        
        controller = createFavoritosController(mockFavoritosService, mockLogger);

        req = {
            user: { id: "user123" },
            params: {},
        };
        res = mockRes();
    });

    describe("addFavorite", () => {
        it("debe añadir favorito llamando al servicio y devolver 200", async () => {
            req.params.subastaId = "BOE-123";
            const fakeResult = { subasta: { _id: "obj123" }, favoritos: [{ id: "BOE-123" }] };
            mockFavoritosService.addFavorite.mockResolvedValue(fakeResult);

            await controller.addFavorite(req, res);

            expect(mockFavoritosService.addFavorite).toHaveBeenCalledWith("user123", "BOE-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                message: "Subasta añadida a favoritos",
                data: { favoritos: fakeResult.favoritos },
            });
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("añadió favorito"));
        });

        it("debe retornar 404 si el servicio lanza error de 'Subasta no encontrada'", async () => {
            req.params.subastaId = "INEXISTENTE";
            mockFavoritosService.addFavorite.mockRejectedValue(new Error("Subasta no encontrada"));

            await controller.addFavorite(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: { message: "Subasta no encontrada", status: 404 },
            });
        });

        it("debe retornar 500 para cualquier otro error del servicio", async () => {
            req.params.subastaId = "BOE-123";
            mockFavoritosService.addFavorite.mockRejectedValue(new Error("Error de base de datos"));

            await controller.addFavorite(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe("removeFavorite", () => {
        it("debe eliminar favorito llamando al servicio y devolver 200", async () => {
            req.params.subastaId = "BOE-123";
            const fakeResult = { subasta: { _id: "obj123" }, favoritos: [] };
            mockFavoritosService.removeFavorite.mockResolvedValue(fakeResult);

            await controller.removeFavorite(req, res);

            expect(mockFavoritosService.removeFavorite).toHaveBeenCalledWith("user123", "BOE-123");
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("debe retornar 404 si el servicio lanza error de 'Subasta no encontrada'", async () => {
            req.params.subastaId = "INEXISTENTE";
            mockFavoritosService.removeFavorite.mockRejectedValue(new Error("Subasta no encontrada"));

            await controller.removeFavorite(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("debe retornar 500 para cualquier otro error", async () => {
            req.params.subastaId = "BOE-123";
            mockFavoritosService.removeFavorite.mockRejectedValue(new Error("Error random"));

            await controller.removeFavorite(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("listFavorites", () => {
        it("debe devolver la lista de favoritos desde el servicio", async () => {
            const fakeFavoritos = [{ id: "BOE-1" }, { id: "BOE-2" }];
            mockFavoritosService.getFavorites.mockResolvedValue(fakeFavoritos);

            await controller.listFavorites(req, res);

            expect(mockFavoritosService.getFavorites).toHaveBeenCalledWith("user123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                data: { favoritos: fakeFavoritos },
            });
        });

        it("debe manejar error en el servicio y devolver 500", async () => {
            mockFavoritosService.getFavorites.mockRejectedValue(new Error("Fallo BD"));

            await controller.listFavorites(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});