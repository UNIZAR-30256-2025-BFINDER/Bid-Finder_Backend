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
}));

const { buildFacadeImageUrl, buildSatelliteImageUrl } = require('../../app_server/services/catastroService');

describe('CatastroImageService', () => {
    const mockRef = '7756103TP6075N0001LS';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getLocalImagePath devuelve la ruta correcta en mayúsculas', () => {
        const expectedPath = path.join(catastroImageService.imagesDir, `${mockRef.toUpperCase()}.png`);
        expect(catastroImageService.getLocalImagePath(mockRef.toLowerCase())).toBe(expectedPath);
    });

    it('isCached devuelve true si existe en fs', () => {
        fs.existsSync.mockReturnValueOnce(true);
        expect(catastroImageService.isCached(mockRef)).toBe(true);
        expect(fs.existsSync).toHaveBeenCalledWith(catastroImageService.getLocalImagePath(mockRef));
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
        fs.existsSync.mockReturnValueOnce(true);

        const result = await catastroImageService.getOrDownloadFacadeImage(mockRef);
        expect(result).toBe(catastroImageService.getLocalImagePath(mockRef));
        expect(buildFacadeImageUrl).not.toHaveBeenCalled();
    });

    it('getOrDownloadFacadeImage intenta descargar fachada si no existe en caché', async () => {
        fs.existsSync.mockReturnValueOnce(false); // mock isCached check
        buildFacadeImageUrl.mockResolvedValueOnce('http://facade.com/img.png');
        
        // Mock successful download
        axios.get.mockResolvedValueOnce({
            data: Buffer.from('mocked image buffer of substantial size'.repeat(200))
        });

        const result = await catastroImageService.getOrDownloadFacadeImage(mockRef);
        expect(result).toBe(catastroImageService.getLocalImagePath(mockRef));
        expect(buildFacadeImageUrl).toHaveBeenCalledWith(mockRef);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('getOrDownloadFacadeImage cae a satélite si la fachada falla', async () => {
        fs.existsSync.mockReturnValueOnce(false); // mock isCached
        buildFacadeImageUrl.mockResolvedValueOnce('http://facade.com/img.png');
        buildSatelliteImageUrl.mockResolvedValueOnce('http://satellite.com/img.png');

        // Mock facade download failure
        axios.get.mockRejectedValueOnce(new Error('Facade Timeout'));

        // Mock satellite download success
        axios.get.mockResolvedValueOnce({
            data: Buffer.from('mocked satellite buffer of substantial size'.repeat(100))
        });

        const result = await catastroImageService.getOrDownloadFacadeImage(mockRef);
        expect(result).toBe(catastroImageService.getLocalImagePath(mockRef));
        expect(buildSatelliteImageUrl).toHaveBeenCalledWith(mockRef);
    });

    it('getOrDownloadFacadeImage cae a Unsplash si fachada y satélite fallan', async () => {
        fs.existsSync.mockReturnValueOnce(false); // mock isCached
        buildFacadeImageUrl.mockResolvedValueOnce(null);
        buildSatelliteImageUrl.mockResolvedValueOnce(null);

        // Mock unsplash fallback success
        axios.get.mockResolvedValueOnce({
            data: Buffer.from('mocked unsplash fallback buffer')
        });

        const result = await catastroImageService.getOrDownloadFacadeImage(mockRef);
        expect(result).toBe(catastroImageService.getLocalImagePath(mockRef));
    });
});
