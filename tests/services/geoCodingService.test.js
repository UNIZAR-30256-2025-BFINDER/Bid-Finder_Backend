const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { createGeoCodingService } = require('../../app_server/services/geoCodingService');

describe('geoCodingService', () => {
  let mock;
  let geoCodingService;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    geoCodingService = createGeoCodingService(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('devuelve coordenadas geoJSON para dirección exacta', async () => {
    const address = 'Calle Mayor 1, Madrid';
    const response = [{ lat: '40.4168', lon: '-3.7038' }];
    mock.onGet(/nominatim/).reply(200, response);
    const result = await geoCodingService.getCoordinatesFromAddress(address);
    expect(result.geojson).toEqual({ type: 'Point', coordinates: [-3.7038, 40.4168] });
    expect(result.fallbackUsed).toBe(false);
    expect(result.query).toBe(address);
  });

  it('usa fallback de municipio si la dirección exacta falla', async () => {
    const address = 'Calle Inventada 123, PuebloFalso';
    const municipio = 'Madrid';
    mock.onGet(/nominatim.*Calle%20Inventada/).reply(200, []);
    mock.onGet(/nominatim.*Madrid/).reply(200, [{ lat: '40.4168', lon: '-3.7038' }]);
    const result = await geoCodingService.getCoordinatesFromAddress(address, municipio);
    expect(result.geojson).toEqual({ type: 'Point', coordinates: [-3.7038, 40.4168] });
    expect(result.fallbackUsed).toBe(true);
    expect(result.query).toBe(municipio);
  });

  it('devuelve null si no hay resultados ni en dirección ni en municipio', async () => {
    mock.onGet(/nominatim/).reply(200, []);
    const result = await geoCodingService.getCoordinatesFromAddress('Calle Ficticia', 'CiudadFicticia');
    expect(result.geojson).toBeNull();
    expect(result.fallbackUsed).toBe(true);
  });

  it('devuelve null si la dirección es vacía o no string', async () => {
    const res1 = await geoCodingService.getCoordinatesFromAddress('');
    const res2 = await geoCodingService.getCoordinatesFromAddress(null);
    const res3 = await geoCodingService.getCoordinatesFromAddress(undefined);
    expect(res1.geojson).toBeNull();
    expect(res2.geojson).toBeNull();
    expect(res3.geojson).toBeNull();
  });

  it('devuelve null si la API responde con error HTTP', async () => {
    mock.onGet(/nominatim/).reply(500, {});
    const result = await geoCodingService.getCoordinatesFromAddress('Calle Error', 'Ciudad Error');
    expect(result.geojson).toBeNull();
    expect(result.fallbackUsed).toBe(true);
  });

  it('devuelve null si la API responde con objeto sin lat/lon', async () => {
    mock.onGet(/nominatim/).reply(200, [{ foo: 'bar' }]);
    const result = await geoCodingService.getCoordinatesFromAddress('Calle Sin Coordenadas');
    expect(result.geojson).toBeNull();
    expect(result.raw).toEqual({ foo: 'bar' });
  });

  it('devuelve null si la API responde con un array vacío', async () => {
    mock.onGet(/nominatim/).reply(200, []);
    const result = await geoCodingService.getCoordinatesFromAddress('Calle Vacía');
    expect(result.geojson).toBeNull();
    expect(result.raw).toBeNull();
  });
});
