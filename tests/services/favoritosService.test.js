const createFavoritosService = require("../../app_server/services/favoritosService");

describe("Favoritos Service", () => {
    let mockUsuariosRepository;
    let mockSubastasService;
    let service;

    beforeEach(() => {
        mockUsuariosRepository = {
            addFavorito: jest.fn(),
            removeFavorito: jest.fn(),
            getFavoritos: jest.fn()
        };

        mockSubastasService = {
            getSubastaById: jest.fn()
        };

        service = createFavoritosService(mockUsuariosRepository, mockSubastasService);
    });

    describe("addFavorite", () => {
        it("debe lanzar error si la subasta no existe", async () => {
            mockSubastasService.getSubastaById.mockResolvedValue(null);

            await expect(service.addFavorite("user1", "BOE-99__L1")).rejects.toThrow("Subasta no encontrada");
        });

        it("debe llamar al repositorio si la subasta existe", async () => {
            const fakeSubasta = { id: "BOE-99__L1" };
            const fakeUser = { favoritos: ["BOE-99__L1"] };
            
            mockSubastasService.getSubastaById.mockResolvedValue(fakeSubasta);
            mockUsuariosRepository.addFavorito.mockResolvedValue(fakeUser);

            const result = await service.addFavorite("user1", "BOE-99__L1");

            expect(mockUsuariosRepository.addFavorito).toHaveBeenCalledWith("user1", "BOE-99__L1");
            expect(result.subasta).toBe(fakeSubasta);
            expect(result.favoritos).toBe(fakeUser.favoritos);
        });
    });

    describe("removeFavorite", () => {
        it("debe lanzar error si la subasta no existe", async () => {
            mockSubastasService.getSubastaById.mockResolvedValue(null);

            await expect(service.removeFavorite("user1", "BOE-99__L1")).rejects.toThrow("Subasta no encontrada");
        });

        it("debe llamar al repositorio para borrar si la subasta existe", async () => {
            const fakeSubasta = { id: "BOE-99__L1" };
            const fakeUser = { favoritos: [] };
            
            mockSubastasService.getSubastaById.mockResolvedValue(fakeSubasta);
            mockUsuariosRepository.removeFavorito.mockResolvedValue(fakeUser);

            const result = await service.removeFavorite("user1", "BOE-99__L1");

            expect(mockUsuariosRepository.removeFavorito).toHaveBeenCalledWith("user1", "BOE-99__L1");
            expect(result.favoritos).toEqual([]);
        });
    });

    describe("getFavorites", () => {
        it("debe devolver la lista de favoritos poblada", async () => {
            mockUsuariosRepository.getFavoritos.mockResolvedValue({ favoritos: ["BOE-99__L1"] });
            
            const result = await service.getFavorites("user1");
            
            expect(result).toEqual(["BOE-99__L1"]);
        });

        it("debe devolver un array vacío si usuario.favoritos no existe o es nulo", async () => {
            mockUsuariosRepository.getFavoritos.mockResolvedValue({});
            
            const result = await service.getFavorites("user1");
            
            expect(result).toEqual([]);
        });
    });
});