/**
 * @fileoverview Tests unitarios para catastroService.
 * Cubre CatastralRef (Value Object), DelegacionMapper, _buildBoundingBox y la caché MongoDB.
 * No hace llamadas reales de red: axios y CatastroData se mockean.
 */

jest.mock('axios');
jest.mock('../../app_server/models/catastroData');

const axios = require('axios');
const CatastroData = require('../../app_server/models/catastroData');
const {
    CatastralRef,
    DelegacionMapper,
    CatastroService,
    createCatastroService,
} = require('../../app_server/services/catastroService');

// ─────────────────────────────────────────────────────────────
// CatastralRef — Value Object
// ─────────────────────────────────────────────────────────────
describe('CatastralRef — Value Object', () => {
    const RC_URBANA = '1234567AB1234A0001ZZ';
    const RC_RUSTICA = '12345A123456789012ZZ'; // empieza con 5 dígitos + letra

    it('acepta una referencia catastral válida de 20 caracteres', () => {
        const ref = new CatastralRef(RC_URBANA);
        expect(ref.getFull()).toBe(RC_URBANA);
    });

    it('normaliza a mayúsculas y elimina espacios', () => {
        const ref = new CatastralRef('  1234567ab1234a0001zz  ');
        expect(ref.getFull()).toBe(RC_URBANA);
    });

    it('lanza TypeError si el valor no es string', () => {
        expect(() => new CatastralRef(12345)).toThrow(TypeError);
        expect(() => new CatastralRef(null)).toThrow(TypeError);
    });

    it('lanza Error si la longitud no es 20 caracteres', () => {
        expect(() => new CatastralRef('ABC123')).toThrow(/inválida/);
        expect(() => new CatastralRef('1234567AB1234A0001ZZZ')).toThrow(/inválida/);
    });

    it('getParcela() devuelve los primeros 14 caracteres', () => {
        const ref = new CatastralRef(RC_URBANA);
        expect(ref.getParcela()).toBe('1234567AB1234A');
    });

    it('isRustico() detecta referencias rústicas correctamente', () => {
        const urbana = new CatastralRef(RC_URBANA);
        const rustica = new CatastralRef(RC_RUSTICA);
        expect(urbana.isRustico()).toBe(false);
        expect(rustica.isRustico()).toBe(true);
    });

    it('getUrbRusCode() devuelve U para urbana y R para rústica', () => {
        expect(new CatastralRef(RC_URBANA).getUrbRusCode()).toBe('U');
        expect(new CatastralRef(RC_RUSTICA).getUrbRusCode()).toBe('R');
    });
});

// ─────────────────────────────────────────────────────────────
// DelegacionMapper
// ─────────────────────────────────────────────────────────────
describe('DelegacionMapper', () => {
    it('devuelve el mismo cp cuando no hay gerencia territorial especial', () => {
        // Provincia 28 (Madrid) no tiene gerencias especiales -> devuelve '28'
        const result = DelegacionMapper.resolve('28', '900');
        expect(result).toBe('28');
    });

    it('redirige a la gerencia especial cuando el municipio está en la lista', () => {
        // Provincia 33 (Asturias), municipio 24 -> debe redirigir a gerencia 52 (Gijón)
        const result = DelegacionMapper.resolve('33', '24');
        expect(result).toBe('52');
    });

    it('devuelve el cp original cuando el municipio NO está en la lista especial', () => {
        // Provincia 33 (Asturias), municipio 999 (no existe en la lista)
        const result = DelegacionMapper.resolve('33', '999');
        expect(result).toBe('33');
    });

    it('devuelve el cp original si los argumentos no son numéricos', () => {
        const result = DelegacionMapper.resolve('XX', 'YY');
        expect(result).toBe('XX');
    });
});

// ─────────────────────────────────────────────────────────────
// CatastroService._buildBoundingBox
// ─────────────────────────────────────────────────────────────
describe('CatastroService._buildBoundingBox', () => {
    let service;

    beforeEach(() => {
        service = new CatastroService();
    });

    it('devuelve un objeto con las cuatro esquinas del bounding box', () => {
        const bbox = service._buildBoundingBox(40.4168, -3.7038);
        expect(bbox).toHaveProperty('latMin');
        expect(bbox).toHaveProperty('latMax');
        expect(bbox).toHaveProperty('lonMin');
        expect(bbox).toHaveProperty('lonMax');
    });

    it('latMin < lat < latMax y lonMin < lng < lonMax', () => {
        const lat = 41.65;
        const lng = -0.88;
        const bbox = service._buildBoundingBox(lat, lng);
        expect(bbox.latMin).toBeLessThan(lat);
        expect(bbox.latMax).toBeGreaterThan(lat);
        expect(bbox.lonMin).toBeLessThan(lng);
        expect(bbox.lonMax).toBeGreaterThan(lng);
    });

    it('el delta de latitud es ~0.0008 y el de longitud ~0.0012', () => {
        const bbox = service._buildBoundingBox(0, 0);
        expect(bbox.latMax - bbox.latMin).toBeCloseTo(0.0016, 6);
        expect(bbox.lonMax - bbox.lonMin).toBeCloseTo(0.0024, 6);
    });
});

// ─────────────────────────────────────────────────────────────
// CatastroService.getExtendedInfo — lógica de caché MongoDB
// ─────────────────────────────────────────────────────────────
describe('CatastroService.getExtendedInfo — caché MongoDB', () => {
    const RC = '1234567AB1234A0001ZZ';
    let service;

    beforeEach(() => {
        service = new CatastroService();
        jest.clearAllMocks();
    });

    it('devuelve el resultado cacheado sin llamar a axios si ya existe en BD', async () => {
        CatastroData.findOne = jest.fn().mockResolvedValue({
            referenciaCatastral: RC,
            clase: 'Urbano',
            usoPrincipal: 'Residencial',
            superficieConstruida: 80,
            superficieGrafica: 100,
            anoConstruccion: 1990,
            direccion: 'Calle Test 1',
            coordenadas: { lat: 40.4168, lng: -3.7038 },
            participacion: null,
        });

        const result = await service.getExtendedInfo(RC);

        expect(CatastroData.findOne).toHaveBeenCalledWith({ referenciaCatastral: RC });
        expect(axios.get).not.toHaveBeenCalled();
        expect(result.clase).toBe('Urbano');
        expect(result.coordenadas.lat).toBe(40.4168);
    });

    it('llama a axios cuando no hay caché y devuelve null si axios falla', async () => {
        CatastroData.findOne = jest.fn().mockResolvedValue(null);
        axios.get = jest.fn().mockRejectedValue(new Error('Network error'));

        const result = await service.getExtendedInfo(RC);

        expect(axios.get).toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('devuelve null si la referencia catastral es inválida', async () => {
        const result = await service.getExtendedInfo('INVALIDA');
        expect(result).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────
// CatastroService.buildFacadeImageUrl
// ─────────────────────────────────────────────────────────────
describe('CatastroService.buildFacadeImageUrl', () => {
    let service;

    beforeEach(() => {
        service = new CatastroService();
    });

    it('construye la URL de fachada correctamente', async () => {
        const url = await service.buildFacadeImageUrl('1234567AB1234A0001ZZ');
        expect(url).toContain('OVCFotoFachada');
        expect(url).toContain('1234567AB1234A0001ZZ');
    });

    it('devuelve null si la referencia catastral es inválida', async () => {
        const url = await service.buildFacadeImageUrl('CORTA');
        expect(url).toBeNull();
    });
});

describe('CatastroService — Parseo de XML y Flujos de Servicio', () => {
    let mockClient;
    let service;

    beforeEach(() => {
        mockClient = {
            fetchLocationData: jest.fn(),
            fetchCoordinates: jest.fn(),
            fetchWfsParcel: jest.fn(),
        };
        service = createCatastroService(mockClient);
        CatastroData.findOne = jest.fn().mockResolvedValue(null);
        CatastroData.findOneAndUpdate = jest.fn().mockImplementation(() => ({
            catch: jest.fn()
        }));
    });

    describe('resolverDelMun', () => {
        it('debe resolver del, mun y urbRus correctamente con un XML válido', async () => {
            const fakeXml = '<xml><cp>28</cp><cmc>79</cmc></xml>';
            mockClient.fetchLocationData.mockResolvedValue(fakeXml);

            const result = await service.resolverDelMun('1234567AB1234A0001ZZ');

            expect(mockClient.fetchLocationData).toHaveBeenCalledWith('1234567AB1234A');
            expect(result).toEqual({
                del: '28',
                mun: '79',
                urbRus: 'U'
            });
        });

        it('debe retornar null si la regex de cp o cmc no coincide', async () => {
            const fakeXml = '<xml><cp>28</cp></xml>'; // falta cmc
            mockClient.fetchLocationData.mockResolvedValue(fakeXml);

            const result = await service.resolverDelMun('1234567AB1234A0001ZZ');
            expect(result).toBeNull();
        });

        it('debe retornar null y logear el error si ocurre una excepción inesperada', async () => {
            mockClient.fetchLocationData.mockRejectedValue(new Error('API Down'));

            const result = await service.resolverDelMun('1234567AB1234A0001ZZ');
            expect(result).toBeNull();
        });
    });

    describe('buildFichaUrl', () => {
        it('debe retornar la URL de la ficha si resolverDelMun tiene éxito', async () => {
            const fakeXml = '<xml><cp>28</cp><cmc>79</cmc></xml>';
            mockClient.fetchLocationData.mockResolvedValue(fakeXml);

            const url = await service.buildFichaUrl('1234567AB1234A0001ZZ');
            expect(url).toContain('CYCBienInmueble/OVCConCiud.aspx');
            expect(url).toContain('del=28');
            expect(url).toContain('mun=79');
        });

        it('debe retornar null si resolverDelMun falla', async () => {
            mockClient.fetchLocationData.mockResolvedValue('<xml></xml>');

            const url = await service.buildFichaUrl('1234567AB1234A0001ZZ');
            expect(url).toBeNull();
        });
    });

    describe('getExtendedInfo - Parseo completo de atributos urbanos', () => {
        it('debe retornar el objeto con todos los datos urbanos parseados correctamente', async () => {
            const basicXml = `
                <xml>
                    <cn>UR</cn>
                    <luso>Residencial</luso>
                    <sfc>120</sfc>
                    <ant>2005</ant>
                    <ldt>Calle Falsa 123</ldt>
                    <cpt>100</cpt>
                </xml>
            `;
            const coordXml = `
                <xml>
                    <xcen>-3.7038</xcen>
                    <ycen>40.4168</ycen>
                </xml>
            `;
            const wfsXml = `
                <xml>
                    <cp:areaValue>350</cp:areaValue>
                </xml>
            `;

            mockClient.fetchLocationData.mockResolvedValue(basicXml);
            mockClient.fetchCoordinates.mockResolvedValue(coordXml);
            mockClient.fetchWfsParcel.mockResolvedValue(wfsXml);

            const result = await service.getExtendedInfo('1234567AB1234A0001ZZ');

            expect(result.clase).toBe('Urbano');
            expect(result.usoPrincipal).toBe('Residencial');
            expect(result.superficieConstruida).toBe(120);
            expect(result.superficieGrafica).toBe(350);
            expect(result.anoConstruccion).toBe(2005);
            expect(result.direccion).toBe('Calle Falsa 123');
            expect(result.coordenadas).toEqual({ lat: 40.4168, lng: -3.7038 });
            expect(result.participacion).toBe('100');
        });

        it('debe retornar superficieGrafica usando subparcelas como fallback si la parcela es rustica y falla WFS', async () => {
            // Referencia rústica (empieza por 5 números + letra)
            const rusticaRef = '37014A502001690000BP';
            const basicXml = `
                <xml>
                    <cn>RU</cn>
                    <ssp>150</ssp>
                    <ssp>250</ssp>
                </xml>
            `;
            mockClient.fetchLocationData.mockResolvedValue(basicXml);
            mockClient.fetchCoordinates.mockRejectedValue(new Error('Coord timeout'));
            mockClient.fetchWfsParcel.mockRejectedValue(new Error('WFS error'));

            const result = await service.getExtendedInfo(rusticaRef);

            expect(result.clase).toBe('Rústico');
            expect(result.superficieGrafica).toBe(400); // 150 + 250
            expect(result.coordenadas).toBeNull();
        });

        it('debe registrar y continuar si falla la base de datos al guardar en caché', async () => {
            const basicXml = '<xml><cn>UR</cn></xml>';
            mockClient.fetchLocationData.mockResolvedValue(basicXml);
            mockClient.fetchCoordinates.mockRejectedValue(new Error('Error'));
            mockClient.fetchWfsParcel.mockRejectedValue(new Error('Error'));

            // Simular fallo en FindOneAndUpdate.catch
            let caughtCallback;
            CatastroData.findOneAndUpdate = jest.fn().mockImplementation(() => ({
                catch: jest.fn(cb => {
                    caughtCallback = cb;
                })
            }));

            const result = await service.getExtendedInfo('1234567AB1234A0001ZZ');
            expect(result).toBeDefined();

            // Ejecutamos el callback del catch del findOneAndUpdate
            expect(caughtCallback).toBeDefined();
            caughtCallback(new Error('DB write failed'));
        });
    });

    describe('buildMapImageUrl & buildSatelliteImageUrl', () => {
        it('debe construir la URL WMS del plano si el inmueble tiene coordenadas', async () => {
            const cachedInfo = {
                referenciaCatastral: '1234567AB1234A0001ZZ',
                coordenadas: { lat: 40.4168, lng: -3.7038 }
            };
            CatastroData.findOne = jest.fn().mockResolvedValue(cachedInfo);

            const mapUrl = await service.buildMapImageUrl('1234567AB1234A0001ZZ');
            const satUrl = await service.buildSatelliteImageUrl('1234567AB1234A0001ZZ');

            expect(mapUrl).toContain('cartografia/INSPIRE/spadgcwms.aspx');
            expect(mapUrl).toContain('BBOX=');
            expect(satUrl).toContain('ign.es/wms-inspire/pnoa-ma');
        });

        it('debe retornar null si el inmueble no tiene coordenadas o getExtendedInfo falla', async () => {
            CatastroData.findOne = jest.fn().mockResolvedValue(null);
            mockClient.fetchLocationData.mockRejectedValue(new Error('API error'));

            const mapUrl = await service.buildMapImageUrl('1234567AB1234A0001ZZ');
            expect(mapUrl).toBeNull();
        });
    });
});
