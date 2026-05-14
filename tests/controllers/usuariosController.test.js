/**
 * @fileoverview Tests unitarios para usuariosController.
 */

const createUsuariosController = require("../../app_server/controllers/usuariosController");

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const mockService = {
    obtenerTodosLosUsuarios: jest.fn(),
};

const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
};

const controller = createUsuariosController(mockService, mockLogger);

beforeEach(() => {
    jest.clearAllMocks();
});

describe("usuariosController — obtenerTodos", () => {
    it("responde 200 y devuelve lista paginada con métricas usando valores por defecto", async () => {
        const req = { query: {} };
        const res = mockRes();

        const resultadoService = {
            usuarios: [{ nombre: "Ana" }, { nombre: "Carlos" }],
            total: 2,
            globalTotal: 5,
            globalAdmins: 1,
            totalAdmins: 0,
        };

        mockService.obtenerTodosLosUsuarios.mockResolvedValue(resultadoService);

        await controller.obtenerTodos(req, res);

        expect(mockService.obtenerTodosLosUsuarios).toHaveBeenCalledWith(
            1,
            10,
            "",
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: resultadoService.usuarios,
            pagination: {
                totalItems: 2,
                currentPage: 1,
                totalPages: Math.ceil(2 / 10),
                itemsPerPage: 10,
            },
            metrics: {
                globalTotal: 5,
                globalAdmins: 1,
                filteredTotal: 2,
                filteredAdmins: 0,
            },
        });
    });

    it("responde 200 usando page, limit y search proporcionados", async () => {
        const req = { query: { page: "3", limit: "5", search: "maria" } };
        const res = mockRes();

        const resultadoService = {
            usuarios: [{ nombre: "Maria" }],
            total: 1,
            globalTotal: 10,
            globalAdmins: 2,
            totalAdmins: 0,
        };

        mockService.obtenerTodosLosUsuarios.mockResolvedValue(resultadoService);

        await controller.obtenerTodos(req, res);

        expect(mockService.obtenerTodosLosUsuarios).toHaveBeenCalledWith(
            3,
            5,
            "maria",
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: resultadoService.usuarios,
            pagination: {
                totalItems: 1,
                currentPage: 3,
                totalPages: Math.ceil(1 / 5),
                itemsPerPage: 5,
            },
            metrics: {
                globalTotal: 10,
                globalAdmins: 2,
                filteredTotal: 1,
                filteredAdmins: 0,
            },
        });
    });

    it("maneja correctamente páginas sin resultados", async () => {
        const req = { query: { page: "99", limit: "10" } };
        const res = mockRes();

        mockService.obtenerTodosLosUsuarios.mockResolvedValue({
            usuarios: [],
            total: 0,
            globalTotal: 5,
            globalAdmins: 1,
            totalAdmins: 0,
        });

        await controller.obtenerTodos(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [],
                pagination: expect.objectContaining({
                    totalItems: 0,
                    totalPages: 0,
                }),
            }),
        );
    });

    it("responde 500 si el servicio lanza un error", async () => {
        const req = { query: {} };
        const res = mockRes();

        mockService.obtenerTodosLosUsuarios.mockRejectedValue(
            new Error("Fallo en la base de datos"),
        );

        await controller.obtenerTodos(req, res);

        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                "[Usuarios Controller] Error al obtener todos los usuarios: Fallo en la base de datos",
            ),
            expect.anything(),
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                message: "Error interno al recuperar los usuarios",
                status: 500,
            },
        });
    });

    it("convierte correctamente los parámetros numéricos", async () => {
        const req = { query: { page: "2", limit: "invalid" } };
        const res = mockRes();

        mockService.obtenerTodosLosUsuarios.mockResolvedValue({
            usuarios: [],
            total: 0,
            globalTotal: 0,
            globalAdmins: 0,
            totalAdmins: 0,
        });

        await controller.obtenerTodos(req, res);

        // limit "invalid" debe caer al valor por defecto 10
        expect(mockService.obtenerTodosLosUsuarios).toHaveBeenCalledWith(
            2,
            10,
            "",
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
