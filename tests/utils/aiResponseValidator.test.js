/**
 * @fileoverview Tests unitarios para aiResponseValidator (formato multi-subasta).
 */

const {
    validarDatosSubasta,
    validarLote,
} = require("../../app_server/utils/aiResponseValidator");

const camposVaciosLote = {
    numero_lote: 1,
    titulo_resumido: null,
    resumen: null,
    direccion: null,
    categoria: null,
    referencia_catastral: null,
    precio_salida: null,
    valor_tasacion: null,
    zona: null,
    cargas_previas: null,
    ocupantes: null,
    riesgo_legal: null,
};

describe("validarDatosSubasta (multi-subasta)", () => {
    it("lanza un error si el input es null", () => {
        expect(() => validarDatosSubasta(null)).toThrow(
            "La respuesta de la IA no es un objeto válido.",
        );
    });

    it("lanza un error si el input es un string (no objeto)", () => {
        expect(() => validarDatosSubasta("texto plano")).toThrow(
            "La respuesta de la IA no es un objeto válido.",
        );
    });

    it("lanza un error si el input es un número", () => {
        expect(() => validarDatosSubasta(42)).toThrow(
            "La respuesta de la IA no es un objeto válido.",
        );
    });

    it("devuelve un array con un lote vacío si el objeto no tiene subastas", () => {
        const result = validarDatosSubasta({});
        expect(result.subastas).toHaveLength(1);
        expect(result.subastas[0]).toEqual(camposVaciosLote);
    });

    it("acepta formato con array de subastas", () => {
        const result = validarDatosSubasta({
            subastas: [
                { numero_lote: 1, titulo_resumido: "Piso en Madrid" },
                { numero_lote: 2, titulo_resumido: "Garaje" },
            ],
        });
        expect(result.subastas).toHaveLength(2);
        expect(result.subastas[0].titulo_resumido).toBe("Piso en Madrid");
        expect(result.subastas[1].titulo_resumido).toBe("Garaje");
    });

    it("acepta formato con array de lotes (retrocompatible)", () => {
        const result = validarDatosSubasta({
            lotes: [
                { numero_lote: 1, titulo_resumido: "Piso en Madrid" },
                { numero_lote: 2, titulo_resumido: "Garaje" },
            ],
        });
        expect(result.subastas).toHaveLength(2);
        expect(result.subastas[0].titulo_resumido).toBe("Piso en Madrid");
        expect(result.subastas[1].titulo_resumido).toBe("Garaje");
    });

    it("fallback: envuelve formato plano antiguo en un array de 1 subasta", () => {
        const result = validarDatosSubasta({
            titulo_resumido: "Piso en Madrid",
            precio_salida: 100000,
        });
        expect(result.subastas).toHaveLength(1);
        expect(result.subastas[0].titulo_resumido).toBe("Piso en Madrid");
        expect(result.subastas[0].precio_salida).toBe(100000);
        expect(result.subastas[0].numero_lote).toBe(1);
    });
});

describe("validarLote", () => {
    it("convierte precio_salida y valor_tasacion a número float", () => {
        const result = validarLote({
            precio_salida: "150000.50",
            valor_tasacion: "200000",
        });

        expect(result.precio_salida).toBe(150000.5);
        expect(result.valor_tasacion).toBe(200000);
    });

    it("acepta precio_salida ya como número", () => {
        const result = validarLote({ precio_salida: 99000 });
        expect(result.precio_salida).toBe(99000);
    });

    it("pone null en precio_salida si el valor no es parseable", () => {
        const result = validarLote({ precio_salida: "no-es-numero" });
        expect(result.precio_salida).toBeNull();
    });

    it("preserva strings válidos en campos de texto", () => {
        const result = validarLote({
            titulo_resumido: "Piso en Madrid",
            resumen: "Un resumen",
            direccion: "Calle Mayor 1",
            referencia_catastral: "1234567AB1234A0001ZZ",
        });

        expect(result.titulo_resumido).toBe("Piso en Madrid");
        expect(result.resumen).toBe("Un resumen");
        expect(result.direccion).toBe("Calle Mayor 1");
        expect(result.referencia_catastral).toBe("1234567AB1234A0001ZZ");
    });

    it("pone null en un campo de texto si el valor es un número (tipo incorrecto)", () => {
        const result = validarLote({ titulo_resumido: 999 });
        expect(result.titulo_resumido).toBeNull();
    });

    it("acepta null explícito en todos los campos", () => {
        const result = validarLote({
            titulo_resumido: null,
            resumen: null,
            direccion: null,
            referencia_catastral: null,
            precio_salida: null,
            valor_tasacion: null,
            zona: null,
        });
        expect(result).toEqual(camposVaciosLote);
    });

    it("acepta y normaliza una categoria válida", () => {
        const resultInmueble = validarLote({ categoria: "inmueble" });
        expect(resultInmueble.categoria).toBe("INMUEBLE");

        const resultJoyas = validarLote({ categoria: "joyas" });
        expect(resultJoyas.categoria).toBe("JOYAS");

        const resultArte = validarLote({ categoria: "arte" });
        expect(resultArte.categoria).toBe("ARTE");

        const resultDerechos = validarLote({ categoria: "derechos" });
        expect(resultDerechos.categoria).toBe("DERECHOS");

        const resultMobiliario = validarLote({ categoria: "mobiliario" });
        expect(resultMobiliario.categoria).toBe("MOBILIARIO");
    });

    it("asigna numero_lote por defecto si no viene", () => {
        const result = validarLote({}, 3);
        expect(result.numero_lote).toBe(3);
    });
});
