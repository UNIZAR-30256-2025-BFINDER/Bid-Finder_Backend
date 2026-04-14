const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { createGeoCodingService } = require('../../app_server/services/geoCodingService');

describe('geoCodingService', () => {
  let mock;
  let geoCodingService;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    geoCodingService = createGeoCodingService(axios, 0);
  });

  afterEach(() => {
    mock.restore();
  });

  it('devuelve coordenadas geoJSON para dirección exacta', async () => {
    const address = 'Calle Mayor 1, Madrid';
    mock.onGet(/Calle%20Mayor%201%2C%20Madrid%2C%20Espa%C3%B1a/).reply(200, [{ lat: '40.4168', lon: '-3.7038' }]);
    
    const result = await geoCodingService.getCoordinatesFromAddress(address);
    expect(result.geojson).toEqual({ type: 'Point', coordinates: [-3.7038, 40.4168] });
    expect(result.query).toContain('España');
  });

  it('usa fallback de municipio si la dirección exacta falla', async () => {
    const address = 'Calle Inventada 123';
    const municipio = 'Madrid';
    
    mock.onGet(/Calle%20Inventada.*Espa%C3%B1a/).reply(200, []);
    mock.onGet(/Madrid%2C%20Espa%C3%B1a/).reply(200, [{ lat: '40.4168', lon: '-3.7038' }]);
    
    const result = await geoCodingService.getCoordinatesFromAddress(address, municipio);
    expect(result.geojson).toEqual({ type: 'Point', coordinates: [-3.7038, 40.4168] });
    expect(result.fallbackUsed).toBe(true);
  });

  it('devuelve null si falla la dirección y el municipio', async () => {
    mock.onGet(/nominatim/).reply(200, []);
    const result = await geoCodingService.getCoordinatesFromAddress('Calle Ficticia', 'PuebloFalso');
    expect(result.geojson).toBeNull();
  });

  it('devuelve null si la API responde con error HTTP', async () => {
    mock.onGet(/nominatim/).reply(500, {});
    const result = await geoCodingService.getCoordinatesFromAddress('Calle Error', 'Ciudad Error');
    expect(result.geojson).toBeNull();
  });

  it('devuelve null si la API responde con objeto sin coordenadas válidas', async () => {
    mock.onGet(/Calle%20Basura%2C%20Espa%C3%B1a/).reply(200, [{ foo: 'bar' }]);
    const result = await geoCodingService.getCoordinatesFromAddress('Calle Basura');
    expect(result.geojson).toBeNull();
    expect(result.raw).toEqual({ foo: 'bar' });
  });
});