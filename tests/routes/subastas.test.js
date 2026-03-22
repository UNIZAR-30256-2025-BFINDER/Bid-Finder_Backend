const request = require('supertest');
const app = require('../../app');

describe('GET /subastas/:id', () => {
  test('debe devolver 200 y la subasta si el id existe', async () => {
    const response = await request(app).get('/subastas/1');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(1);
    expect(response.body.data.titulo).toBeDefined();
    expect(response.body.data.descripcion).toBeDefined();
    expect(response.body.data.urlOriginal).toBeDefined();
  });

  test('debe devolver 404 si la subasta no existe', async () => {
    const response = await request(app).get('/subastas/999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Subasta no encontrada');
    expect(response.body.error.status).toBe(404);
  });

  test('debe devolver 400 si el id es inválido', async () => {
    const response = await request(app).get('/subastas/abc');

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('ID inválido');
    expect(response.body.error.status).toBe(400);
  });
});