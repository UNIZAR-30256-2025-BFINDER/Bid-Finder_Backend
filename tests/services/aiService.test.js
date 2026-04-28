/**
 * @fileoverview Pruebas unitarias para el servicio de Inteligencia Artificial
 */

const createAiService = require("../../app_server/services/aiService");

describe("AI Service - Sistema de Fallback y Rotación", () => {
    beforeEach(() => {
        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const defaultValidados = {
        titulo_resumido: null,
        resumen: null,
        categoria: null,
        direccion: null,
        referencia_catastral: null,
        precio_salida: null,
        valor_tasacion: null,
        zona: null,
        cargas_previas: null,
        ocupantes: null,
        riesgo_legal: null,
    };

    it("Debería devolver el JSON parseado y validado si el PRIMER proveedor tiene éxito", async () => {
        const provider1 = {
            generate: jest.fn().mockResolvedValue('{"precio_salida": 150000}'),
        };
        const provider2 = { generate: jest.fn() };

        const aiService = createAiService([provider1, provider2]);

        const result = await aiService.extraerDatosSubasta(
            "Texto BOE",
            "Prompt",
        );

        expect(result).toEqual({ ...defaultValidados, precio_salida: 150000 });
        expect(provider1.generate).toHaveBeenCalledTimes(1);
        expect(provider2.generate).not.toHaveBeenCalled();
    });

    it("Debería usar el SEGUNDO proveedor (Fallback) si el primero lanza un error (ej. 429 Quota)", async () => {
        const errorCuota = new Error("429 Too Many Requests");
        const provider1 = { generate: jest.fn().mockRejectedValue(errorCuota) };
        const provider2 = {
            generate: jest.fn().mockResolvedValue('{"direccion": "Madrid"}'),
        };

        const aiService = createAiService([provider1, provider2]);

        const result = await aiService.extraerDatosSubasta(
            "Texto BOE",
            "Prompt",
        );

        expect(result).toEqual({ ...defaultValidados, direccion: "Madrid" });
        expect(provider1.generate).toHaveBeenCalledTimes(1);
        expect(provider2.generate).toHaveBeenCalledTimes(1);
    });

    it("Debería usar el Fallback si el primer proveedor devuelve un JSON mal formado (Alucinación)", async () => {
        const provider1 = {
            generate: jest
                .fn()
                .mockResolvedValue("Hola, soy una IA y me he liado"),
        };
        const provider2 = {
            generate: jest
                .fn()
                .mockResolvedValue('{"titulo_resumido": "Piso"}'),
        };

        const aiService = createAiService([provider1, provider2]);

        const result = await aiService.extraerDatosSubasta(
            "Texto BOE",
            "Prompt",
        );

        expect(result).toEqual({
            ...defaultValidados,
            titulo_resumido: "Piso",
        });
        expect(provider1.generate).toHaveBeenCalledTimes(1);
        expect(provider2.generate).toHaveBeenCalledTimes(1);
    });

    it("Debería lanzar un Error crítico si TODOS los proveedores fallan", async () => {
        const provider1 = {
            generate: jest.fn().mockRejectedValue(new Error("Fallo API 1")),
        };
        const provider2 = {
            generate: jest.fn().mockRejectedValue(new Error("Fallo API 2")),
        };

        const aiService = createAiService([provider1, provider2]);

        await expect(
            aiService.extraerDatosSubasta("Texto BOE", "Prompt"),
        ).rejects.toThrow(
            "Fallo en todos los proveedores de IA. Último error: Fallo API 2",
        );

        expect(provider1.generate).toHaveBeenCalledTimes(1);
        expect(provider2.generate).toHaveBeenCalledTimes(1);
    });
});
