/**
 * @fileoverview Rutas de integración con el Catastro.
 */

const express = require('express');
const router = express.Router();
const {
    buildFichaUrl,
    getExtendedInfo,
    buildMapImageUrl,
    buildSatelliteImageUrl,
    CatastralRef,
} = require('../services/catastroService');
const catastroImageService = require('../services/catastroImageService');

/**
 * GET /api/v1/catastro/ficha/:refCatastral
 * Redirige al usuario a la ficha de la sede oficial del Catastro.
 */
router.get('/ficha/:refCatastral', async (req, res) => {
    try {
        const { refCatastral } = req.params;
        const ref = new CatastralRef(refCatastral || '');

        const url = await buildFichaUrl(ref.getFull());
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
        console.error('[CatastroRoute] Error en ficha:', error.message);
        return res.status(500).json({ error: 'Error al consultar la ficha del Catastro.' });
    }
});

/**
 * GET /api/v1/catastro/info/:refCatastral
 * Devuelve datos catastrales extendidos en formato JSON.
 */
router.get('/info/:refCatastral', async (req, res) => {
    try {
        const { refCatastral } = req.params;
        const ref = new CatastralRef(refCatastral || '');

        const data = await getExtendedInfo(ref.getFull());
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
        console.error('[CatastroRoute] Error en info:', error.message);
        return res.status(500).json({ error: 'Error al obtener información del Catastro.' });
    }
});

/**
 * GET /api/v1/catastro/imagen/:refCatastral
 * Redirige a la imagen WMS de la parcela catastral.
 */
router.get('/imagen/:refCatastral', async (req, res) => {
    try {
        const { refCatastral } = req.params;
        const ref = new CatastralRef(refCatastral || '');

        const imageUrl = await buildMapImageUrl(ref.getFull());
        if (!imageUrl) {
            return res.status(404).json({
                error: 'No se pudieron obtener coordenadas o plano para la parcela catastral.',
            });
        }

        return res.redirect(imageUrl);
    } catch (error) {
        if (error instanceof TypeError || error.message.includes('Referencia catastral inválida')) {
            return res.status(400).json({ error: error.message });
        }
        console.error('[CatastroRoute] Error en imagen:', error.message);
        return res.status(500).json({ error: 'Error al obtener la imagen de la parcela.' });
    }
});

/**
 * GET /api/v1/catastro/satelite/:refCatastral
 * Redirige a la imagen satélite (ortofoto PNOA) de la parcela catastral.
 */
router.get('/satelite/:refCatastral', async (req, res) => {
    try {
        const { refCatastral } = req.params;
        const ref = new CatastralRef(refCatastral || '');

        const imageUrl = await buildSatelliteImageUrl(ref.getFull());
        if (!imageUrl) {
            return res.status(404).json({
                error: 'No se pudieron obtener coordenadas o foto satélite para la parcela catastral.',
            });
        }

        return res.redirect(imageUrl);
    } catch (error) {
        if (error instanceof TypeError || error.message.includes('Referencia catastral inválida')) {
            return res.status(400).json({ error: error.message });
        }
        console.error('[CatastroRoute] Error en satelite:', error.message);
        return res.status(500).json({ error: 'Error al obtener la imagen satélite.' });
    }
});

router.get('/fachada/:refCatastral', async (req, res) => {
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
        console.error('[CatastroRoute] Error en fachada:', error.message);
        return res.status(500).json({ error: 'Error al obtener la fachada del inmueble.' });
    }
});

module.exports = router;
