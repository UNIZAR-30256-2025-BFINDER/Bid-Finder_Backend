/**
 * @fileoverview Tests unitarios para subastasRules.
 * Cubre filterCondition, mapFn, extractSumarioStrategy y extractAnuncioStrategy.
 */

const subastasRules = require('../../app_server/config/subastasRules');

function makeSeccion(nombre) {
    return { '@_nombre': nombre };
}

function makeItem(titulo) {
    return { identificador: `BOE-${titulo}`, titulo, url_xml: `/xml/${titulo}.xml` };
}

function makeDocumento(overrides = {}) {
    return {
        documento: {
            metadatos: {
                identificador: 'BOE-B-2026-1',
                titulo: 'Subasta de prueba',
                fecha_publicacion: '20260316',
                url_pdf: '/pdf/1.pdf',
                ...overrides.metadatos,
            },
            texto: {
                p: [
                    { '#text': 'Texto del anuncio de subasta inmobiliaria.' },
                    { '#text': 'Precio de salida: 100.000 euros.' },
                ],
                ...overrides.texto,
            },
            ...overrides.documento,
        },
    };
}

describe('subastasRules.filterCondition', () => {

    it('devuelve false si la sección no contiene "ANUNCIOS"', () => {
        const result = subastasRules.filterCondition(
            makeSeccion('DISPOSICIONES GENERALES'), {}, null,
            makeItem('SUBASTA de un piso')
        );
        expect(result).toBe(false);
    });

    it('devuelve true si la sección es ANUNCIOS y el título contiene SUBASTA', () => {
        const result = subastasRules.filterCondition(
            makeSeccion('ANUNCIOS OFICIALES'), {}, null,
            makeItem('SUBASTA de inmueble')
        );
        expect(result).toBe(true);
    });

    it('devuelve true si la sección es ANUNCIOS y el epígrafe contiene SUBASTAS', () => {
        const epigrafe = { '@_nombre': 'SUBASTAS JUDICIALES' };
        const result = subastasRules.filterCondition(
            makeSeccion('ANUNCIOS VARIOS'), {}, epigrafe,
            makeItem('Licitación pública')
        );
        expect(result).toBe(true);
    });

    it('devuelve false si la sección es ANUNCIOS pero el título no es subasta y no hay epígrafe', () => {
        const result = subastasRules.filterCondition(
            makeSeccion('ANUNCIOS'), {}, null,
            makeItem('Licitación de obra')
        );
        expect(result).toBe(false);
    });

    it('devuelve false si el epígrafe no contiene SUBASTAS', () => {
        const epigrafe = { '@_nombre': 'LICITACIONES' };
        const result = subastasRules.filterCondition(
            makeSeccion('ANUNCIOS'), {}, epigrafe,
            makeItem('Adjudicación de contrato')
        );
        expect(result).toBe(false);
    });

    it('usa la propiedad "nombre" como fallback si falta "@_nombre"', () => {
        const result = subastasRules.filterCondition(
            { nombre: 'ANUNCIOS OFICIALES' }, {}, null,
            makeItem('SUBASTA judicial')
        );
        expect(result).toBe(true);
    });
});

describe('subastasRules.mapFn', () => {

    it('devuelve null si el texto incluye el enlace a subastas.boe.es y es corto', () => {
        const doc = {
            metadatos: { identificador: 'BOE-1' },
            texto: { p: [{ '#text': 'Ver en https://subastas.boe.es para más info.' }] },
        };
        expect(subastasRules.mapFn(doc)).toBeNull();
    });

    it('permite textos que mencionan vehículo', () => {
        const doc = {
            metadatos: { identificador: 'BOE-1', titulo: 'Test Vehiculo' },
            texto: { p: [{ '#text': 'Subasta de VEHÍCULO marca Seat.' }] },
        };
        const result = subastasRules.mapFn(doc);
        expect(result).not.toBeNull();
        expect(result.id).toBe('BOE-1');
    });

    it('permite textos que mencionan matrícula', () => {
        const doc = {
            metadatos: { identificador: 'BOE-1', titulo: 'Test Matricula' },
            texto: { p: [{ '#text': 'Bien embargado con MATRÍCULA 1234ABC.' }] },
        };
        const result = subastasRules.mapFn(doc);
        expect(result).not.toBeNull();
        expect(result.id).toBe('BOE-1');
    });

    it('permite textos que mencionan bastidor', () => {
        const doc = {
            metadatos: { identificador: 'BOE-1', titulo: 'Test Bastidor' },
            texto: { p: [{ '#text': 'Número de BASTIDOR VF7RCNFUC12345678.' }] },
        };
        const result = subastasRules.mapFn(doc);
        expect(result).not.toBeNull();
        expect(result.id).toBe('BOE-1');
    });

    it('devuelve el objeto procesado si el documento es válido', () => {
        const doc = makeDocumento().documento;
        const result = subastasRules.mapFn(doc);

        expect(result).toMatchObject({
            id: 'BOE-B-2026-1',
            titulo: 'Subasta de prueba',
            fechaPublicacion: '20260316',
            urlPdf: '/pdf/1.pdf',
        });
        expect(typeof result.texto).toBe('string');
        expect(result.texto.length).toBeGreaterThan(0);
    });

    it('maneja texto con un solo párrafo (no array)', () => {
        const doc = {
            metadatos: { identificador: 'BOE-1', titulo: 'Test' },
            texto: { p: { '#text': 'Párrafo único de la subasta.' } },
        };
        const result = subastasRules.mapFn(doc);
        expect(result.texto).toBe('Párrafo único de la subasta.');
    });

    it('devuelve string vacío si texto no tiene párrafos', () => {
        const doc = {
            metadatos: { identificador: 'BOE-1', titulo: 'Test' },
            texto: {},
        };
        const result = subastasRules.mapFn(doc);
        expect(result.texto).toBe('');
    });

    it('serializa texto como JSON si es un objeto (para rawXml)', () => {
        const doc = makeDocumento().documento;
        const result = subastasRules.mapFn(doc);
        expect(() => JSON.parse(result.rawXml)).not.toThrow();
    });
});

// ── extractAnuncioStrategy ────────────────────────────────────────────────────

describe('subastasRules.extractAnuncioStrategy', () => {

    it('extrae y devuelve el documento procesado', () => {
        const result = subastasRules.extractAnuncioStrategy(makeDocumento());
        expect(result).toMatchObject({ id: 'BOE-B-2026-1' });
    });

    it('lanza error si falta la etiqueta raíz <documento>', () => {
        expect(() => subastasRules.extractAnuncioStrategy({}))
            .toThrow('El XML proporcionado no tiene la etiqueta raíz <documento>.');
    });

    it('lanza error si falta el identificador en metadatos', () => {
        expect(() => subastasRules.extractAnuncioStrategy({ documento: { metadatos: {} } }))
            .toThrow('No se ha encontrado el identificador único.');
    });
});

// ── extractSumarioStrategy ────────────────────────────────────────────────────

describe('subastasRules.extractSumarioStrategy', () => {

    function makeSumario(secciones) {
        return { response: { data: { sumario: { diario: { seccion: secciones } } } } };
    }

    it('devuelve array vacío si no hay diario', () => {
        expect(subastasRules.extractSumarioStrategy({})).toEqual([]);
    });

    it('devuelve array vacío si no hay secciones', () => {
        const json = { response: { data: { sumario: { diario: {} } } } };
        expect(subastasRules.extractSumarioStrategy(json)).toEqual([]);
    });

    it('extrae items de departamentos directos que cumplen el filtro', () => {
        const json = makeSumario([{
            '@_nombre': 'ANUNCIOS OFICIALES',
            departamento: [{
                item: [{ identificador: 'BOE-1', titulo: 'SUBASTA de piso', url_xml: '/xml/1.xml' }]
            }]
        }]);

        const result = subastasRules.extractSumarioStrategy(json);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('BOE-1');
    });

    it('extrae items de epígrafes que cumplen el filtro', () => {
        const json = makeSumario([{
            '@_nombre': 'ANUNCIOS VARIOS',
            departamento: [{
                epigrafe: [{
                    '@_nombre': 'SUBASTAS',
                    item: [{ identificador: 'BOE-2', titulo: 'Licitación', url_xml: '/xml/2.xml' }]
                }]
            }]
        }]);

        const result = subastasRules.extractSumarioStrategy(json);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('BOE-2');
    });

    it('no duplica items con el mismo identificador', () => {
        const item = { identificador: 'BOE-1', titulo: 'SUBASTA', url_xml: '/xml/1.xml' };
        const json = makeSumario([{
            '@_nombre': 'ANUNCIOS',
            departamento: [{ item: [item, item] }]
        }]);

        const result = subastasRules.extractSumarioStrategy(json);
        expect(result).toHaveLength(1);
    });

    it('ignora departamentos sin items ni epígrafes', () => {
        const json = makeSumario([{
            '@_nombre': 'ANUNCIOS',
            departamento: [{}]
        }]);
        expect(subastasRules.extractSumarioStrategy(json)).toEqual([]);
    });
});