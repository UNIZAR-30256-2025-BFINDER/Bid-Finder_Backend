const { extractFallbackMunicipio } = require('../../app_server/utils/textParser');

describe('textParser - extractFallbackMunicipio', () => {
    test('debe extraer el municipio tras la preposición "en"', () => {
        const texto = "Finca urbana sita en Albacete, calle Mayor.";
        expect(extractFallbackMunicipio(texto)).toBe("Albacete");
    });

    test('debe extraer el municipio de la firma de fecha', () => {
        const texto = "Albacete, 28 de mayo de 2026.- El Director Provincial.";
        expect(extractFallbackMunicipio(texto)).toBe("Albacete");
    });

    test('debe devolver null si no hay texto o no coincide ningún patrón', () => {
        expect(extractFallbackMunicipio(null)).toBeNull();
        expect(extractFallbackMunicipio("")).toBeNull();
        expect(extractFallbackMunicipio("Texto sin patrones conocidos")).toBeNull();
    });
});
