/**
 * @fileoverview Tests de integración ligera para las rutas de /catastro
 */

const express = require('express');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

jest.mock('fs');
jest.mock('axios');

jest.mock('../../app_server/services/catastroService', () => {
    return {
        buildFichaUrl: jest.fn().mockResolvedValue('https://ficha.catastro.com/12345'),
        getExtendedInfo: jest.fn().mockResolvedValue({ referenciaCatastral: '1234567AB1234A0001ZZ', clase: 'Urbano' }),
        buildMapImageUrl: jest.fn().mockResolvedValue('http://map.com/12345.png'),
        buildSatelliteImageUrl: jest.fn().mockResolvedValue('http://satellite.com/12345.jpg'),
        buildFacadeImageUrl: jest.fn().mockResolvedValue('http://facade.com/12345.png'),
        CatastralRef: class {
            constructor(val) {
                this.value = val;
            }
            getFull() {
                return '1234567AB1234A0001ZZ';
            }
        }
    };
});

describe('Catastro Routes', () => {
    let app;

    beforeAll(() => {
        // Mock fs.existsSync to return false first, then true
        fs.existsSync.mockReturnValue(false);
        fs.writeFileSync.mockImplementation(() => {});
        fs.mkdirSync.mockImplementation(() => {});

        app = express();
        const catastroRouter = require('../../app_server/routes/catastro');
        app.use('/catastro', catastroRouter);
    });

    it('GET /catastro/ficha/:refCatastral redirige a la URL de la ficha', async () => {
        const res = await request(app).get('/catastro/ficha/1234567AB1234A0001ZZ');
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('https://ficha.catastro.com/12345');
    });

    it('GET /catastro/info/:refCatastral devuelve info en JSON', async () => {
        const res = await request(app).get('/catastro/info/1234567AB1234A0001ZZ');
        expect(res.status).toBe(200);
        expect(res.body.clase).toBe('Urbano');
    });

    it('GET /catastro/imagen/:refCatastral redirige a la URL del mapa', async () => {
        const res = await request(app).get('/catastro/imagen/1234567AB1234A0001ZZ');
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('http://map.com/12345.png');
    });

    it('GET /catastro/satelite/:refCatastral redirige a la URL del satélite', async () => {
        const res = await request(app).get('/catastro/satelite/1234567AB1234A0001ZZ');
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('http://satellite.com/12345.jpg');
    });

    it('GET /catastro/fachada/:refCatastral intenta descargar y guardar la imagen', async () => {
        const originalSendFile = express.response.sendFile;
        express.response.sendFile = jest.fn(function(filePath) {
            return this.status(200).send('fake file response');
        });

        // Mock a successful download response for axios
        axios.get.mockResolvedValue({
            data: Buffer.from('fake image content longer than 5000 bytes'.repeat(200))
        });

        const res = await request(app).get('/catastro/fachada/1234567AB1234A0001ZZ');
        expect(res.status).toBe(200);
        expect(fs.writeFileSync).toHaveBeenCalled();

        express.response.sendFile = originalSendFile;
    });
});
