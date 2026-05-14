/**
 * @fileoverview Tests unitarios para usuariosService.
 */

const createUsuariosService = require("../../app_server/services/usuariosService");

const mockRepository = {
    findAll: jest.fn(),
};

const service = createUsuariosService(mockRepository);

beforeEach(() => {
    jest.clearAllMocks();
});

describe("usuariosService — obtenerTodosLosUsuarios", () => {
    it("debería calcular el skip correctamente en base a la página y límite", async () => {
        const fakeData = { usuarios: [{ nombre: "User1" }], total: 100 };
        mockRepository.findAll.mockResolvedValue(fakeData);

        const result = await service.obtenerTodosLosUsuarios(3, 10);

        expect(mockRepository.findAll).toHaveBeenCalledWith(20, 10, "");
        expect(result).toEqual(fakeData);
    });

    it("debería usar valores por defecto para page (1) y limit (10) si no se proveen", async () => {
        const fakeData = { usuarios: [], total: 0 };
        mockRepository.findAll.mockResolvedValue(fakeData);

        await service.obtenerTodosLosUsuarios();

        expect(mockRepository.findAll).toHaveBeenCalledWith(0, 10, "");
    });

    it("debería pasar el término de búsqueda al repositorio cuando se proporciona", async () => {
        const fakeData = {
            usuarios: [{ nombre: "resultado filtrado" }],
            total: 1,
        };
        mockRepository.findAll.mockResolvedValue(fakeData);

        const result = await service.obtenerTodosLosUsuarios(
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
