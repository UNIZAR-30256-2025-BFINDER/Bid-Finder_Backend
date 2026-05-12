/**
 * @fileoverview Tests de integración para las rutas de comentarios.
 * Verifica la protección JWT y el enrutamiento.
 */

const request = require('supertest');
const express = require('express');

jest.mock('../../app_server/repositories/comentariosRepository', () => {
    return jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: '1', texto: 'Test' }),
        findBySubastaId: jest.fn().mockResolvedValue([]),
        deleteById: jest.fn().mockResolvedValue({ _id: '1' })
    }));
});

const comentariosRouter = require('../../app_server/routes/comentarios');

const app = express();
app.use(express.json());
app.use('/subastas/:id/comentarios', comentariosRouter);

describe('Rutas de Comentarios', () => {

    describe('GET /subastas/:id/comentarios', () => {
        it('debería permitir el acceso público sin JWT', async () => {
            const response = await request(app).get('/subastas/BOE-TEST/comentarios');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        });
    });

    describe('POST /subastas/:id/comentarios', () => {
        it('debería rechazar la petición con un 401 si no hay token JWT', async () => {
            const response = await request(app)
                .post('/subastas/BOE-TEST/comentarios')
                .send({ texto: 'Hack intento' });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/Acceso denegado/i);
        });

        it('debería rechazar la petición con un 401 si el token JWT es inválido', async () => {
            const response = await request(app)
                .post('/subastas/BOE-TEST/comentarios')
                .set('Authorization', 'Bearer token_falso_inventado')
                .send({ texto: 'Hack intento 2' });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/Token inválido/i);
        });
    });

    describe('DELETE /subastas/:id/comentarios/:comentarioId', () => {
        it('debería rechazar la petición con un 401 si no hay token JWT', async () => {
            const response = await request(app).delete('/subastas/BOE-TEST/comentarios/1');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/Acceso denegado/i);
        });

        it('debería rechazar la petición con un 401 si el token JWT es inválido', async () => {
            const response = await request(app)
                .delete('/subastas/BOE-TEST/comentarios/1')
                .set('Authorization', 'Bearer token_falso_inventado');
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/Token inválido/i);
        });
    });
});
