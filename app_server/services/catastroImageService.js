/**
 * @fileoverview Servicio de almacenamiento y caché local para imágenes de subastas.
 * Implementa principios SOLID y Clean Architecture para desacoplar el sistema de archivos y HTTP del controlador.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');
const {
    buildFacadeImageUrl,
    buildSatelliteImageUrl,
    buildMapImageUrl
} = require('./catastroService');

const { CATASTRO } = require('../config/constants');

const DOWNLOAD_TIMEOUT = CATASTRO.IMAGE.DOWNLOAD_TIMEOUT_MS;
const FACADE_MIN_SIZE = CATASTRO.IMAGE.FACADE_MIN_SIZE_BYTES;
const SATELLITE_MIN_SIZE = CATASTRO.IMAGE.SATELLITE_MIN_SIZE_BYTES;
const FALLBACK_IMAGE_URL = CATASTRO.IMAGE.FALLBACK_URL;

class CatastroImageService {
    /**
     * @param {string} [imagesDir] - Directorio destino de caché.
     * @param {Object} [httpClient] - Cliente HTTP para descargas.
     */
    constructor(
        imagesDir = path.join(__dirname, '..', '..', 'public', 'images'),
        httpClient = axios
    ) {
        this.imagesDir = imagesDir;
        this.httpClient = httpClient;

        this.ensureDirExists();
    }

    /**
     * Asegura la existencia del directorio de caché.
     * @private
     */
    ensureDirExists() {
        if (!fs.existsSync(this.imagesDir)) {
            fs.mkdirSync(this.imagesDir, { recursive: true });
        }
    }

    /**
     * Resuelve la ruta local absoluta para una referencia catastral.
     * Soporta renombrado de archivos legados sin sufijo.
     * @param {string} refCatastral 
     * @param {'facade'|'map'|'satellite'} type
     * @returns {string} Ruta absoluta del archivo local.
     */
    getLocalImagePath(refCatastral, type = 'facade') {
        const legacyPath = path.join(this.imagesDir, `${refCatastral.toUpperCase()}.png`);
        const newPath = path.join(this.imagesDir, `${refCatastral.toUpperCase()}_${type}.png`);
        
        if (type === 'facade' && fs.existsSync(legacyPath) && !fs.existsSync(newPath)) {
            try {
                fs.renameSync(legacyPath, newPath);
            } catch {
                return legacyPath;
            }
        }
        return newPath;
    }

    /**
     * Comprueba si una imagen ya está cacheada localmente.
     * @param {string} refCatastral 
     * @param {'facade'|'map'|'satellite'} type
     * @returns {boolean} True si el archivo existe.
     */
    isCached(refCatastral, type = 'facade') {
        const filePath = this.getLocalImagePath(refCatastral, type);
        return fs.existsSync(filePath);
    }

    /**
     * Descarga la imagen de una URL y la almacena localmente.
     * @param {string} url 
     * @param {string} targetPath 
     * @param {number} minSize - Tamaño mínimo en bytes para considerarse válida.
     * @returns {Promise<boolean>} True si la descarga y el guardado son correctos.
     */
    async downloadAndSave(url, targetPath, minSize = 1000) {
        try {
            const response = await this.httpClient.get(url, {
                responseType: 'arraybuffer',
                timeout: DOWNLOAD_TIMEOUT
            });
            if (response.data && response.data.length > minSize) {
                fs.writeFileSync(targetPath, response.data);
                return true;
            }
            return false;
        } catch (err) {
            logger.warn(`[CatastroImageService] Falló la descarga de ${url}: ${err.message}`);
            return false;
        }
    }

    /**
     * Obtiene o descarga la imagen correspondiente al tipo solicitado.
     * @param {string} refCatastral 
     * @param {'facade'|'map'|'satellite'} type 
     * @returns {Promise<string>} Ruta local al archivo cacheado.
     */
    async getOrDownloadImage(refCatastral, type = 'facade') {
        const localPath = this.getLocalImagePath(refCatastral, type);

        if (this.isCached(refCatastral, type)) {
            return localPath;
        }

        if (type === 'facade') {
            const facadeUrl = await buildFacadeImageUrl(refCatastral);
            if (facadeUrl) {
                const success = await this.downloadAndSave(facadeUrl, localPath, FACADE_MIN_SIZE);
                if (success) return localPath;
            }
            // Fallback para fachada -> Satélite
            const satUrl = await buildSatelliteImageUrl(refCatastral);
            if (satUrl) {
                const success = await this.downloadAndSave(satUrl, localPath, SATELLITE_MIN_SIZE);
                if (success) return localPath;
            }
        } else if (type === 'map') {
            const mapUrl = await buildMapImageUrl(refCatastral);
            if (mapUrl) {
                const success = await this.downloadAndSave(mapUrl, localPath, 1000);
                if (success) return localPath;
            }
        } else if (type === 'satellite') {
            const satUrl = await buildSatelliteImageUrl(refCatastral);
            if (satUrl) {
                const success = await this.downloadAndSave(satUrl, localPath, SATELLITE_MIN_SIZE);
                if (success) return localPath;
            }
        }

        // Fallback final: Imagen genérica (Unsplash)
        const success = await this.downloadAndSave(FALLBACK_IMAGE_URL, localPath, 0);
        if (success) {
            return localPath;
        }

        throw new Error(`No se pudo obtener la imagen del tipo ${type} para la referencia catastral.`);
    }

    /**
     * Garantiza la obtención de la imagen de fachada local. Si no existe, la descarga.
     * Mantenida para plena compatibilidad hacia atrás.
     * @param {string} refCatastral - Referencia catastral validada.
     * @returns {Promise<string>} Ruta absoluta al archivo listo para servir.
     */
    async getOrDownloadFacadeImage(refCatastral) {
        return this.getOrDownloadImage(refCatastral, 'facade');
    }
}

const defaultInstance = new CatastroImageService();
defaultInstance.createCatastroImageService = (imagesDir, httpClient) => {
    return new CatastroImageService(imagesDir, httpClient);
};
defaultInstance.CatastroImageService = CatastroImageService;

module.exports = defaultInstance;
