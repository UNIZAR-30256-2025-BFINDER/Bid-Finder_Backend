/**
 * @fileoverview Tests unitarios para aiResponseValidator.
 */

const { validarDatosSubasta } = require('../../app_server/utils/aiResponseValidator');

const camposVacios = {
    titulo_resumido:    null,
    resumen:            null,
    direccion:          null,
    referencia_catastral: null,
    precio_salida:      null,
    valor_tasacion:     null,
    zona:               null,
};

describe('validarDatosSubasta', () => {

    it('lanza un error si el input es null', () => {
        expect(() => validarDatosSubasta(null)).toThrow('La respuesta de la IA no es un objeto válido.');
    });

    it('lanza un error si el input es un string (no objeto)', () => {
        expect(() => validarDatosSubasta('texto plano')).toThrow('La respuesta de la IA no es un objeto válido.');
    });

    it('lanza un error si el input es un número', () => {
        expect(() => validarDatosSubasta(42)).toThrow('La respuesta de la IA no es un objeto válido.');
    });

    it('devuelve todos los campos en null si el objeto está vacío', () => {
        expect(validarDatosSubasta({})).toEqual(camposVacios);
    });

    it('convierte precio_salida y valor_tasacion a número float', () => {
        const result = validarDatosSubasta({ precio_salida: '150000.50', valor_tasacion: '200000' });

        expect(result.precio_salida).toBe(150000.50);
        expect(result.valor_tasacion).toBe(200000);
    });

    it('acepta precio_salida ya como número', () => {
        const result = validarDatosSubasta({ precio_salida: 99000 });
        expect(result.precio_salida).toBe(99000);
    });

    it('pone null en precio_salida si el valor no es parseable', () => {
        const result = validarDatosSubasta({ precio_salida: 'no-es-numero' });
        expect(result.precio_salida).toBeNull();
    });

    it('preserva strings válidos en campos de texto', () => {
        const result = validarDatosSubasta({
            titulo_resumido: 'Piso en Madrid',
            resumen:         'Un resumen',
            direccion:       'Calle Mayor 1',
            referencia_catastral: '1234567AB1234A0001ZZ',
        });

        expect(result.titulo_resumido).toBe('Piso en Madrid');
        expect(result.resumen).toBe('Un resumen');
        expect(result.direccion).toBe('Calle Mayor 1');
        expect(result.referencia_catastral).toBe('1234567AB1234A0001ZZ');
    });

    it('pone null en un campo de texto si el valor es un número (tipo incorrecto)', () => {
        const result = validarDatosSubasta({ titulo_resumido: 999 });
        expect(result.titulo_resumido).toBeNull();
    });

    it('acepta null explícito en todos los campos', () => {
        const result = validarDatosSubasta({
            titulo_resumido: null, resumen: null, direccion: null,
            referencia_catastral: null, precio_salida: null, valor_tasacion: null, zona: null
        });
        expect(result).toEqual(camposVacios);
    });
});