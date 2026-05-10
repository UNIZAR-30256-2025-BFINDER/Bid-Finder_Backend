/**
 * @fileoverview Tests de integración ligera para la ruta /stats
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../app_server/middlewares/authMiddleware', () => ({
    protect: (req, res, next) => next(),
    isAdmin: (req, res, next) => next(),
}));

jest.mock('../../app_server/utils/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
}));

jest.mock('../../app_server/controllers/statsController', () => {
    return jest.fn(() => ({
        getStatsSubastasPorCategoria: (req, res) => res.status(200).json({ success: true, data: [{ _id: 'INMUEBLE', total: 1 }] }),
        getStatsSubastasPorProvincia: (req, res) => res.status(200).json({ success: true, data: [{ _id: 'Madrid', total: 2 }] }),
    }));
});

describe('Stats Routes', () => {
    let app;

    beforeAll(() => {
        app = express();
        const statsRouter = require('../../app_server/routes/estadisticas');
        app.use('/estadisticas', statsRouter);
    });

    it('GET /estadisticas/categorias responde 200 con datos', async () => {
        const res = await request(app).get('/estadisticas/categorias');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: [{ _id: 'INMUEBLE', total: 1 }] });
    });

    it('GET /estadisticas/provincias responde 200 con datos', async () => {
        const res = await request(app).get('/estadisticas/provincias');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: [{ _id: 'Madrid', total: 2 }] });
    });
});
