/**
 * @fileoverview Tests unitarios aislados para las rutas de /catastro utilizando inyección de dependencias.
 */

const express = require('express');
const request = require('supertest');

const catastroRouter = require('../../app_server/routes/catastro');

describe('Catastro Routes (DI Mocked)', () => {
    let app;
    let mockCatastroService;
    let mockCatastroImageService;

    beforeEach(() => {
        mockCatastroService = {
            buildFichaUrl: jest.fn().mockResolvedValue('https://ficha.catastro.com/12345'),
            getExtendedInfo: jest.fn().mockResolvedValue({ referenciaCatastral: '1234567AB1234A0001ZZ', clase: 'Urbano' }),
            buildMapImageUrl: jest.fn().mockResolvedValue('http://map.com/12345.png'),
            buildSatelliteImageUrl: jest.fn().mockResolvedValue('http://satellite.com/12345.jpg'),
        };

        mockCatastroImageService = {
            getOrDownloadFacadeImage: jest.fn().mockResolvedValue('path/to/facade.png'),
            getOrDownloadImage: jest.fn().mockImplementation((ref, type) => {
                if (type === 'map') return Promise.resolve('path/to/map.png');
                if (type === 'satellite') return Promise.resolve('path/to/satellite.png');
                return Promise.resolve('path/to/facade.png');
            })
        };

        app = express();
        const testRouter = catastroRouter.createCatastroRouter(mockCatastroService, mockCatastroImageService);
        app.use('/catastro', testRouter);
    });

    it('GET /catastro/ficha/:refCatastral redirige a la URL de la ficha', async () => {
        const res = await request(app).get('/catastro/ficha/1234567AB1234A0001ZZ');
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('https://ficha.catastro.com/12345');
        expect(mockCatastroService.buildFichaUrl).toHaveBeenCalledWith('1234567AB1234A0001ZZ');
    });

    it('GET /catastro/info/:refCatastral devuelve info en JSON', async () => {
        const res = await request(app).get('/catastro/info/1234567AB1234A0001ZZ');
        expect(res.status).toBe(200);
        expect(res.body.clase).toBe('Urbano');
        expect(mockCatastroService.getExtendedInfo).toHaveBeenCalledWith('1234567AB1234A0001ZZ');
    });

    it('GET /catastro/imagen/:refCatastral retorna la imagen de plano local', async () => {
        const originalSendFile = express.response.sendFile;
        express.response.sendFile = jest.fn(function(path) {
            return this.status(200).send(`fake file response for ${path}`);
        });

        const res = await request(app).get('/catastro/imagen/1234567AB1234A0001ZZ');
        expect(res.status).toBe(200);
        expect(res.text).toBe('fake file response for path/to/map.png');
        expect(mockCatastroImageService.getOrDownloadImage).toHaveBeenCalledWith('1234567AB1234A0001ZZ', 'map');

        express.response.sendFile = originalSendFile;
    });

    it('GET /catastro/satelite/:refCatastral retorna la imagen de satélite local', async () => {
        const originalSendFile = express.response.sendFile;
        express.response.sendFile = jest.fn(function(path) {
            return this.status(200).send(`fake file response for ${path}`);
        });

        const res = await request(app).get('/catastro/satelite/1234567AB1234A0001ZZ');
        expect(res.status).toBe(200);
        expect(res.text).toBe('fake file response for path/to/satellite.png');
        expect(mockCatastroImageService.getOrDownloadImage).toHaveBeenCalledWith('1234567AB1234A0001ZZ', 'satellite');

        express.response.sendFile = originalSendFile;
    });

    it('GET /catastro/fachada/:refCatastral retorna la imagen de fachada local', async () => {
        const originalSendFile = express.response.sendFile;
        express.response.sendFile = jest.fn(function(path) {
            return this.status(200).send(`fake file response for ${path}`);
        });

        const res = await request(app).get('/catastro/fachada/1234567AB1234A0001ZZ');
        expect(res.status).toBe(200);
        expect(res.text).toBe('fake file response for path/to/facade.png');
        expect(mockCatastroImageService.getOrDownloadFacadeImage).toHaveBeenCalledWith('1234567AB1234A0001ZZ');

        express.response.sendFile = originalSendFile;
    });
});
