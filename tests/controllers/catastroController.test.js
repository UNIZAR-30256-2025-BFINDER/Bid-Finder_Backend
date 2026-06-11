/**
 * @fileoverview Tests unitarios para el controlador CatastroController.
 */

const createCatastroController = require('../../app_server/controllers/catastroController');

describe('CatastroController', () => {
    let controller;
    let mockCatastroService;
    let mockCatastroImageService;
    let mockLogger;
    let req;
    let res;

    beforeEach(() => {
        mockCatastroService = {
            buildFichaUrl: jest.fn(),
            getExtendedInfo: jest.fn(),
            buildMapImageUrl: jest.fn(),
            buildSatelliteImageUrl: jest.fn()
        };

        mockCatastroImageService = {
            getOrDownloadFacadeImage: jest.fn(),
            getOrDownloadImage: jest.fn()
        };

        mockLogger = {
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn()
        };

        controller = createCatastroController(mockCatastroService, mockCatastroImageService, mockLogger);

        req = {
            params: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis(),
            sendFile: jest.fn().mockReturnThis()
        };
    });

    describe('getFicha', () => {
        it('debe redirigir a la URL si se genera correctamente', async () => {
            req.params.refCatastral = '1234567AB1234A0001ZZ';
            mockCatastroService.buildFichaUrl.mockResolvedValue('http://ficha.url');

            await controller.getFicha(req, res);

            expect(mockCatastroService.buildFichaUrl).toHaveBeenCalledWith('1234567AB1234A0001ZZ');
            expect(res.redirect).toHaveBeenCalledWith('http://ficha.url');
        });

        it('debe retornar 404 si el servicio no retorna URL', async () => {
            req.params.refCatastral = '1234567AB1234A0001ZZ';
            mockCatastroService.buildFichaUrl.mockResolvedValue(null);

            await controller.getFicha(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'No se pudo resolver la referencia catastral en el Catastro.'
            });
        });

        it('debe retornar 400 si la referencia catastral es inválida', async () => {
            req.params.refCatastral = 'CORTA';

            await controller.getFicha(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining('Referencia catastral inválida')
            });
        });
    });

    describe('getInfo', () => {
        it('debe retornar los datos extendidos en formato JSON', async () => {
            req.params.refCatastral = '1234567AB1234A0001ZZ';
            const fakeInfo = { ref: '1234567AB1234A0001ZZ', clase: 'Urbano' };
            mockCatastroService.getExtendedInfo.mockResolvedValue(fakeInfo);

            await controller.getInfo(req, res);

            expect(mockCatastroService.getExtendedInfo).toHaveBeenCalledWith('1234567AB1234A0001ZZ');
            expect(res.json).toHaveBeenCalledWith(fakeInfo);
        });

        it('debe retornar 404 si no se encuentran datos', async () => {
            req.params.refCatastral = '1234567AB1234A0001ZZ';
            mockCatastroService.getExtendedInfo.mockResolvedValue(null);

            await controller.getInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getImagen', () => {
        it('debe retornar el archivo local de plano catastral', async () => {
            req.params.refCatastral = '1234567AB1234A0001ZZ';
            mockCatastroImageService.getOrDownloadImage.mockResolvedValue('/path/to/map.png');

            await controller.getImagen(req, res);

            expect(mockCatastroImageService.getOrDownloadImage).toHaveBeenCalledWith('1234567AB1234A0001ZZ', 'map');
            expect(res.sendFile).toHaveBeenCalledWith('/path/to/map.png');
        });
    });

    describe('getSatelite', () => {
        it('debe retornar el archivo local de la ortofoto satelital PNOA', async () => {
            req.params.refCatastral = '1234567AB1234A0001ZZ';
            mockCatastroImageService.getOrDownloadImage.mockResolvedValue('/path/to/satellite.png');

            await controller.getSatelite(req, res);

            expect(mockCatastroImageService.getOrDownloadImage).toHaveBeenCalledWith('1234567AB1234A0001ZZ', 'satellite');
            expect(res.sendFile).toHaveBeenCalledWith('/path/to/satellite.png');
        });
    });

    describe('getFachada', () => {
        it('debe retornar el archivo local de fachada', async () => {
            req.params.refCatastral = '1234567AB1234A0001ZZ';
            mockCatastroImageService.getOrDownloadFacadeImage.mockResolvedValue('/path/to/facade.png');

            await controller.getFachada(req, res);

            expect(mockCatastroImageService.getOrDownloadFacadeImage).toHaveBeenCalledWith('1234567AB1234A0001ZZ');
            expect(res.sendFile).toHaveBeenCalledWith('/path/to/facade.png');
        });
    });
});
