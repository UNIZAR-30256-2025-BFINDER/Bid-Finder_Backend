/**
 * @fileoverview Controlador para endpoints de Catastro.
 * Gestiona el mapeo de peticiones HTTP, el parsing de referencias catastrales y delega
 * la lógica de negocio a los servicios correspondientes.
 */

const { CatastralRef } = require('../services/catastroService');

/**
 * Crea una instancia de CatastroController inyectando sus servicios correspondientes.
 * @param {Object} catastroService - Servicio de consulta al Catastro.
 * @param {Object} catastroImageService - Servicio de descargas de imágenes de fachada.
 * @param {Object} logger - Servicio de logs.
 * @returns {Object} Interfaz del controlador.
 */
function createCatastroController(catastroService, catastroImageService, logger) {

    /**
     * Redirige al usuario a la ficha oficial del Catastro.
     */
    async function getFicha(req, res) {
        try {
            const { refCatastral } = req.params;
            const ref = new CatastralRef(refCatastral || '');

            const url = await catastroService.buildFichaUrl(ref.getFull());
            if (!url) {
                return res.status(404).json({
                    error: 'No se pudo resolver la referencia catastral en el Catastro.',
                });
            }

            return res.redirect(url);
        } catch (error) {
            if (error instanceof TypeError || error.message.includes('Referencia catastral inválida')) {
                return res.status(400).json({ error: error.message });
            }
            logger.error(`[CatastroController] Error en ficha: ${error.message}`);
            return res.status(500).json({ error: 'Error al consultar la ficha del Catastro.' });
        }
    }

    /**
     * Devuelve los datos catastrales extendidos en formato JSON.
     */
    async function getInfo(req, res) {
        try {
            const { refCatastral } = req.params;
            const ref = new CatastralRef(refCatastral || '');

            const data = await catastroService.getExtendedInfo(ref.getFull());
            if (!data) {
                return res.status(404).json({
                    error: 'No se pudieron recuperar datos para la referencia catastral.',
                });
            }

            return res.json(data);
        } catch (error) {
            if (error instanceof TypeError || error.message.includes('Referencia catastral inválida')) {
                return res.status(400).json({ error: error.message });
            }
            logger.error(`[CatastroController] Error en info: ${error.message}`);
            return res.status(500).json({ error: 'Error al obtener información del Catastro.' });
        }
    }

    /**
     * Retorna el plano catastral de la parcela (caché o descarga).
     */
    async function getImagen(req, res) {
        try {
            const { refCatastral } = req.params;
            const ref = new CatastralRef(refCatastral || '');

            const localPath = await catastroImageService.getOrDownloadImage(ref.getFull(), 'map');
            return res.sendFile(localPath);
        } catch (error) {
            if (error instanceof TypeError || error.message.includes('Referencia catastral inválida')) {
                return res.status(400).json({ error: error.message });
            }
            logger.error(`[CatastroController] Error en plano (imagen): ${error.message}`);
            return res.status(500).json({ error: 'Error al obtener la imagen de la parcela.' });
        }
    }

    /**
     * Retorna la imagen satelital de la parcela (caché o descarga).
     */
    async function getSatelite(req, res) {
        try {
            const { refCatastral } = req.params;
            const ref = new CatastralRef(refCatastral || '');

            const localPath = await catastroImageService.getOrDownloadImage(ref.getFull(), 'satellite');
            return res.sendFile(localPath);
        } catch (error) {
            if (error instanceof TypeError || error.message.includes('Referencia catastral inválida')) {
                return res.status(400).json({ error: error.message });
            }
            logger.error(`[CatastroController] Error en satelite: ${error.message}`);
            return res.status(500).json({ error: 'Error al obtener la imagen satélite.' });
        }
    }

    /**
     * Retorna el archivo local de la fachada (caché o descarga).
     */
    async function getFachada(req, res) {
        try {
            const { refCatastral } = req.params;
            const ref = new CatastralRef(refCatastral || '');
            const fullRef = ref.getFull();
            
            const localPath = await catastroImageService.getOrDownloadFacadeImage(fullRef);
            return res.sendFile(localPath);
        } catch (error) {
            if (error instanceof TypeError || error.message.includes('Referencia catastral inválida')) {
                return res.status(400).json({ error: error.message });
            }
            logger.error(`[CatastroController] Error en fachada: ${error.message}`);
            return res.status(500).json({ error: 'Error al obtener la fachada del inmueble.' });
        }
    }

    return {
        getFicha,
        getInfo,
        getImagen,
        getSatelite,
        getFachada
    };
}

module.exports = createCatastroController;
