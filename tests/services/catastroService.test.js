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
} = require('../../app_server/services/catastroService');

// ─────────────────────────────────────────────────────────────
// CatastralRef — Value Object
// ─────────────────────────────────────────────────────────────
describe('CatastralRef — Value Object', () => {
    const RC_URBANA   = '1234567AB1234A0001ZZ';
    const RC_RUSTICA  = '12345A123456789012ZZ'; // empieza con 5 dígitos + letra

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
        const urbana  = new CatastralRef(RC_URBANA);
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
