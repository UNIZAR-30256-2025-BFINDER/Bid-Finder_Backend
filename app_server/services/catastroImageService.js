/**
 * @fileoverview Servicio de almacenamiento y caché local para imágenes de subastas.
 * Implementa principios SOLID y Clean Architecture para desacoplar el sistema de archivos y HTTP del controlador.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { 
    buildFacadeImageUrl, 
    buildSatelliteImageUrl 
} = require('./catastroService');

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
     * @param {string} refCatastral 
     * @returns {string} Ruta absoluta del archivo local.
     */
    getLocalImagePath(refCatastral) {
        return path.join(this.imagesDir, `${refCatastral.toUpperCase()}.png`);
    }

    /**
     * Comprueba si una imagen ya está cacheada localmente.
     * @param {string} refCatastral 
     * @returns {boolean} True si el archivo existe.
     */
    isCached(refCatastral) {
        const filePath = this.getLocalImagePath(refCatastral);
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
                timeout: 5000
            });
            if (response.data && response.data.length > minSize) {
                fs.writeFileSync(targetPath, response.data);
                return true;
            }
            return false;
        } catch (err) {
            console.warn(`[CatastroImageService] Falló la descarga de ${url}:`, err.message);
            return false;
        }
    }

    /**
     * Garantiza la obtención de la imagen de fachada local. Si no existe, la descarga.
     * Implementa fallback en cascada: Fachada → Satélite → Imagen de reserva (Unsplash).
     * @param {string} refCatastral - Referencia catastral validada.
     * @returns {Promise<string>} Ruta absoluta al archivo listo para servir.
     */
    async getOrDownloadFacadeImage(refCatastral) {
        const localPath = this.getLocalImagePath(refCatastral);

        // 1. Retornar si ya existe en caché
        if (this.isCached(refCatastral)) {
            return localPath;
        }

        // 2. Intentar descargar foto de fachada
        const facadeUrl = await buildFacadeImageUrl(refCatastral);
        if (facadeUrl) {
            const success = await this.downloadAndSave(facadeUrl, localPath, 5000);
            if (success) return localPath;
        }

        // 3. Fallback: Intentar descargar imagen satelital
        const satUrl = await buildSatelliteImageUrl(refCatastral);
        if (satUrl) {
            const success = await this.downloadAndSave(satUrl, localPath, 1000);
            if (success) return localPath;
        }

        // 4. Fallback final: Imagen genérica (Unsplash)
        const fallbackUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=300";
        const success = await this.downloadAndSave(fallbackUrl, localPath, 0);
        if (success) {
            return localPath;
        }

        throw new Error('No se pudo descargar ninguna imagen para la referencia catastral.');
    }
}

// Instancia singleton por defecto
module.exports = new CatastroImageService();
