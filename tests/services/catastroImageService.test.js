/**
 * @fileoverview Tests unitarios para el servicio CatastroImageService.
 */

const fs = require('fs');
const axios = require('axios');
const path = require('path');
const catastroImageService = require('../../app_server/services/catastroImageService');

jest.mock('fs');
jest.mock('axios');

jest.mock('../../app_server/services/catastroService', () => ({
    buildFacadeImageUrl: jest.fn(),
    buildSatelliteImageUrl: jest.fn(),
    buildMapImageUrl: jest.fn(),
}));

const { buildFacadeImageUrl, buildSatelliteImageUrl } = require('../../app_server/services/catastroService');

describe('CatastroImageService', () => {
    const mockRef = '7756103TP6075N0001LS';

    beforeEach(() => {
        jest.clearAllMocks();
        // Por defecto, fs.existsSync retorna false para simular que no hay caché
        fs.existsSync.mockReturnValue(false);
    });

    it('getLocalImagePath devuelve la ruta correcta en mayúsculas con sufijo de tipo', () => {
        const expectedPath = path.join(catastroImageService.imagesDir, `${mockRef.toUpperCase()}_facade.png`);
        expect(catastroImageService.getLocalImagePath(mockRef.toLowerCase(), 'facade')).toBe(expectedPath);
    });

    it('isCached devuelve true si existe en fs', () => {
        // Mockear de modo que el nuevo archivo sí exista
        fs.existsSync.mockImplementation((filePath) => {
            return filePath.endsWith('_facade.png');
        });

        expect(catastroImageService.isCached(mockRef, 'facade')).toBe(true);
    });

    it('downloadAndSave descarga y escribe el archivo si es mayor al tamaño mínimo', async () => {
        axios.get.mockResolvedValueOnce({
            data: Buffer.from('un buffer de ejemplo bastante largo')
        });

        const targetPath = 'un/path/ejemplo.png';
        const success = await catastroImageService.downloadAndSave('http://ejemplo.com', targetPath, 5);

        expect(success).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalledWith(targetPath, expect.any(Buffer));
    });

    it('downloadAndSave retorna false si el archivo descargado es demasiado pequeño', async () => {
        axios.get.mockResolvedValueOnce({
            data: Buffer.from('pequeño')
        });

        const targetPath = 'un/path/ejemplo.png';
        const success = await catastroImageService.downloadAndSave('http://ejemplo.com', targetPath, 100);

        expect(success).toBe(false);
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('getOrDownloadFacadeImage retorna caché si ya existe', async () => {
        fs.existsSync.mockImplementation((filePath) => {
            return filePath.endsWith('_facade.png');
        });

        const result = await catastroImageService.getOrDownloadFacadeImage(mockRef);
        expect(result).toBe(catastroImageService.getLocalImagePath(mockRef, 'facade'));
        expect(buildFacadeImageUrl).not.toHaveBeenCalled();
    });

    it('getOrDownloadFacadeImage intenta descargar fachada si no existe en caché', async () => {
        buildFacadeImageUrl.mockResolvedValueOnce('http://facade.com/img.png');
        
        // Mock successful download
        axios.get.mockResolvedValueOnce({
            data: Buffer.from('mocked image buffer of substantial size'.repeat(200))
        });

        const result = await catastroImageService.getOrDownloadFacadeImage(mockRef);
        expect(result).toBe(catastroImageService.getLocalImagePath(mockRef, 'facade'));
        expect(buildFacadeImageUrl).toHaveBeenCalledWith(mockRef);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('getOrDownloadFacadeImage cae a satélite si la fachada falla', async () => {
        buildFacadeImageUrl.mockResolvedValueOnce('http://facade.com/img.png');
        buildSatelliteImageUrl.mockResolvedValueOnce('http://satellite.com/img.png');

        // Mock facade download failure
        axios.get.mockRejectedValueOnce(new Error('Facade Timeout'));

        // Mock satellite download success
        axios.get.mockResolvedValueOnce({
            data: Buffer.from('mocked satellite buffer of substantial size'.repeat(100))
        });

        const result = await catastroImageService.getOrDownloadFacadeImage(mockRef);
        expect(result).toBe(catastroImageService.getLocalImagePath(mockRef, 'facade'));
        expect(buildSatelliteImageUrl).toHaveBeenCalledWith(mockRef);
    });

    it('getOrDownloadFacadeImage cae a Unsplash si fachada y satélite fallan', async () => {
        buildFacadeImageUrl.mockResolvedValueOnce(null);
        buildSatelliteImageUrl.mockResolvedValueOnce(null);

        // Mock unsplash fallback success
        axios.get.mockResolvedValueOnce({
            data: Buffer.from('mocked unsplash fallback buffer')
        });

        const result = await catastroImageService.getOrDownloadFacadeImage(mockRef);
        expect(result).toBe(catastroImageService.getLocalImagePath(mockRef, 'facade'));
    });
});
