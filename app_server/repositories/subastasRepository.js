/**
 * @fileoverview Repositorio principal para la colección de Anuncios y Subastas.
 * Gestiona consultas complejas con $unwind para aplanar las subastas individuales
 * dentro de un anuncio general, filtros, Full-Text Search y agregaciones.
 */

const Subasta = require('../models/subasta');

/**
 * Genera un ID compuesto para identificar una subasta específica dentro de un anuncio.
 * Formato: "BOE-B-2025-12345__L1"
 * @param {string} anuncioId - ID del anuncio del BOE.
 * @param {number} numeroSubasta - Número de la subasta (lote).
 * @returns {string} ID compuesto de la subasta.
 */
function buildSubastaId(anuncioId, numeroSubasta) {
    return `${anuncioId}__L${numeroSubasta}`;
}

/**
 * Parsea un ID compuesto para extraer el ID del anuncio y el número de subasta.
 * @param {string} subastaId - ID compuesto (ej. "BOE-B-2025-12345__L2") o ID simple.
 * @returns {{ anuncioId: string, numeroSubasta: number }} Componentes del ID.
 */
function parseSubastaId(subastaId) {
    const parts = subastaId.split('__L');
    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
        return { anuncioId: parts[0], numeroSubasta: parseInt(parts[1]) };
    }
    // ID simple sin sufijo → asumir subasta/lote 1
    return { anuncioId: subastaId, numeroSubasta: 1 };
}

/**
 * Calcula la fecha de finalización por defecto a partir de la fecha de publicación (20 días después).
 * Soporta de manera robusta formatos de texto YYYYMMDD y valores numéricos.
 * @param {string|number} fechaPublicacion - Fecha de publicación original.
 * @returns {Date|null} Fecha de finalización calculada, o null si la entrada es inválida.
 */
function calculateDefaultFinalizacion(fechaPublicacion) {
    if (!fechaPublicacion) return null;
    const pubStr = String(fechaPublicacion).trim();
    let pubDate;
    if (/^\d{8}$/.test(pubStr)) {
        const y = parseInt(pubStr.substring(0, 4), 10);
        const m = parseInt(pubStr.substring(4, 6), 10) - 1;
        const d = parseInt(pubStr.substring(6, 8), 10);
        pubDate = new Date(y, m, d);
    } else {
        pubDate = new Date(pubStr);
    }
    if (!isNaN(pubDate.getTime())) {
        pubDate.setDate(pubDate.getDate() + 20);
        return pubDate;
    }
    return null;
}

const FILTER_STRATEGIES = {
    q: (val, query) => {
        query.$text = { $search: val };
    },
    provincia: (val, query) => {
        const regexProv = new RegExp(val, 'i');
        const provOr = [
            { zona: regexProv },
            { direccion: regexProv }
        ];
        if (query.$or) {
            query.$and = query.$and || [];
            const existingOr = query.$or;
            delete query.$or;
            query.$and.push({ $or: existingOr });
            query.$and.push({ $or: provOr });
        } else {
            query.$or = provOr;
        }
    },
    categoria: (val, query) => {
        const regexCat = new RegExp(val, 'i');
        const catOr = [
            { titulo_resumido: regexCat },
            { resumen: regexCat },
            { texto: regexCat }
        ];
        if (query.$or) {
            query.$and = query.$and || [];
            const existingOr = query.$or;
            delete query.$or;
            query.$and.push({ $or: existingOr });
            query.$and.push({ $or: catOr });
        } else if (query.$and) {
            query.$and.push({ $or: catOr });
        } else {
            query.$or = catOr;
        }
    },
    precio_min: (val, query) => {
        const num = Number(val);
        if (!isNaN(num)) {
            query.precio_salida = query.precio_salida || { $ne: null };
            query.precio_salida.$gte = num;
        }
    },
    precio_max: (val, query) => {
        const num = Number(val);
        if (!isNaN(num)) {
            query.precio_salida = query.precio_salida || { $ne: null };
            query.precio_salida.$lte = num;
        }
    },
    nivel_oportunidad: (val, query) => {
        let viabilidadQuery = val.toUpperCase();
        if (viabilidadQuery === 'ALTO') viabilidadQuery = 'ALTA';
        if (viabilidadQuery === 'MEDIO') viabilidadQuery = 'MEDIA';
        if (viabilidadQuery === 'BAJO') viabilidadQuery = 'BAJA';
        if (['ALTA', 'MEDIA', 'BAJA'].includes(viabilidadQuery)) {
            query.viabilidad = viabilidadQuery;
        }
    },
    tipo_lote: (val, query) => {
        if (val === 'multi') {
            query.total_lotes = { $gt: 1 };
        } else if (val === 'simple') {
            query.total_lotes = 1;
        }
    }
};

/**
 * Crea una instancia del repositorio de subastas.
 * @returns {Object} Colección de métodos de acceso a datos y estadísticas.
 */
function createSubastasRepository() {

    /**
     * Ejecuta un pipeline de agregación para contar subastas agrupadas por categoría.
     * @returns {Promise<Array>} Array de objetos { categoria, total } ordenado descendentemente.
     */
    async function aggregateByCategoria() {
        return await Subasta.aggregate([
            { $match: { estado_ia: 'PROCESADO', categoria: { $ne: null } } },
            { $group: { _id: "$categoria", total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $project: { categoria: "$_id", total: 1, _id: 0 } }
        ]);
    }

    /**
     * Ejecuta un pipeline de agregación para contar subastas agrupadas por provincia (zona).
     * @returns {Promise<Array>} Array de objetos { provincia, total } ordenado descendentemente.
     */
    async function aggregateByProvincia() {
        return await Subasta.aggregate([
            { $match: { estado_ia: 'PROCESADO', zona: { $ne: null } } },
            { $group: { _id: "$zona", total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $project: { provincia: "$_id", total: 1, _id: 0 } }
        ]);
    }

    /**
     * Recupera una lista plana de subastas individuales aplicando filtros.
     * @param {Object} [filtros={}] - Diccionario de filtros.
     * @returns {Promise<Array>} Array de documentos de subastas individuales aplanados.
     */
    async function findAll(filtros = {}) {
        const query = { estado_ia: 'PROCESADO' };

        for (const [key, val] of Object.entries(filtros)) {
            if (val !== undefined && val !== null && val !== '' && FILTER_STRATEGIES[key]) {
                FILTER_STRATEGIES[key](val, query);
            }
        }

        let mQuery = Subasta.find(query);
        if (filtros.q) {
            mQuery = mQuery.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
        } else {
            mQuery = mQuery.sort({ fechaPublicacion: -1 });
        }

        const docs = await mQuery.lean();
        return docs.map(doc => {
            if (doc.score !== undefined) {
                doc._textScore = doc.score;
            }
            return doc;
        });
    }

    /**
     * Busca una subasta específica por su ID compuesto (anuncio_id + __L + numero_lote).
     * @param {string} subastaId - ID compuesto de la subasta.
     * @returns {Promise<Object|null>} Documento aplanado de la subasta o null.
     */
    async function findById(subastaId) {
        const { anuncioId, numeroSubasta } = parseSubastaId(subastaId);
        const targetId = `${anuncioId}__L${numeroSubasta}`;
        return await Subasta.findOne({ id: targetId }).lean();
    }

    /**
     * Guarda masivamente un lote de anuncios en la base de datos.
     * @param {Array<Object>} anuncios - Array de objetos de anuncio a guardar.
     * @returns {Promise<Object>} Resumen de la operación (upserted, modified, matched).
     */
    async function saveSubastas(anuncios) {
        const operations = anuncios.map((anuncio) => {
            const docToSave = (!anuncio.fechaFinalizacion && anuncio.fechaPublicacion)
                ? { ...anuncio, fechaFinalizacion: calculateDefaultFinalizacion(anuncio.fechaPublicacion) }
                : { ...anuncio };

            return {
                updateOne: {
                    filter: { id: docToSave.id },
                    update: { $set: docToSave },
                    upsert: true,
                },
            };
        });

        const result = await Subasta.bulkWrite(operations);
        return {
            upserted: result.upsertedCount,
            modified: result.modifiedCount,
            matched: result.matchedCount,
        };
    }

    /**
     * Busca anuncios que aún no han sido procesados por la IA.
     * @param {number} [limit=10] - Número máximo de anuncios a devolver.
     * @returns {Promise<Array>} Anuncios en estado 'PENDIENTE'.
     */
    async function findPendingAI(limit = 10) {
        return await Subasta.find({ estado_ia: 'PENDIENTE' }).limit(limit);
    }

    /**
     * Actualiza el registro de un anuncio con las subastas procesadas por la IA.
     * @param {string} id - ID del BOE del anuncio.
     * @param {Array<Object>} subastas - Array de subastas procesadas.
     * @param {string} [estado='PROCESADO'] - Nuevo estado de procesamiento.
     * @returns {Promise<Object>} Documento actualizado.
     */
    async function updateAIExtraction(id, subastas, estado = 'PROCESADO') {
        const original = await Subasta.findOne({ id: id });
        if (!original) {
            return null;
        }

        if (estado === 'ERROR' || !subastas || subastas.length === 0) {
            return await Subasta.findOneAndUpdate(
                { id: id },
                { $set: { estado_ia: estado === 'ERROR' ? 'ERROR' : 'PROCESADO', total_lotes: 0 } },
                { new: true }
            );
        }

        const all_lotes = subastas.map(s => ({
            numero_lote: s.numero_lote,
            precio_salida: s.precio_salida,
            titulo_resumido: s.titulo_resumido,
            categoria: s.categoria,
            direccion: s.direccion
        }));

        const bulkOps = subastas.map(s => {
            const lotDoc = {
                id: `${id}__L${s.numero_lote}`,
                anuncio_id: id,
                titulo: original.titulo,
                fechaPublicacion: original.fechaPublicacion,
                fechaFinalizacion: original.fechaFinalizacion && original.fechaFinalizacion.getFullYear() !== 1970
                    ? original.fechaFinalizacion
                    : calculateDefaultFinalizacion(original.fechaPublicacion),
                urlPdf: original.urlPdf,
                texto: original.texto,
                rawXml: original.rawXml,
                fechaExtraccion: original.fechaExtraccion,
                estado_ia: 'PROCESADO',
                numero_lote: s.numero_lote,
                total_lotes: subastas.length,
                all_lotes: all_lotes,
                titulo_resumido: s.titulo_resumido,
                resumen: s.resumen,
                categoria: s.categoria,
                precio_salida: s.precio_salida,
                valor_tasacion: s.valor_tasacion,
                diferencia_porcentual_oportunidad: s.diferencia_porcentual_oportunidad,
                nivel_oportunidad: s.nivel_oportunidad,
                viabilidad: s.viabilidad,
                direccion: s.direccion,
                zona: s.zona,
                referencia_catastral: s.referencia_catastral,
                location: s.location,
                riesgo_legal: s.riesgo_legal,
                ocupantes: s.ocupantes,
                cargas_previas: s.cargas_previas
            };

            return {
                updateOne: {
                    filter: { id: lotDoc.id },
                    update: { $set: lotDoc },
                    upsert: true
                }
            };
        });

        await Subasta.bulkWrite(bulkOps);
        await Subasta.deleteOne({ id: id });

        return await Subasta.findOne({ id: `${id}__L1` }).lean();
    }

    /**
     * Obtiene métricas generales del sistema para el panel de administración.
     * @returns {Promise<Object>} Totales ingresados hoy y fecha de la última ingesta.
     */
    async function getSystemStats() {
        const inicioDeHoy = new Date();
        inicioDeHoy.setHours(0, 0, 0, 0);

        const ingresadasHoy = await Subasta.countDocuments({
            createdAt: { $gte: inicioDeHoy }
        });

        const ultimoAnuncio = await Subasta.findOne()
            .sort({ createdAt: -1 })
            .select('createdAt');

        return {
            ingresadasHoy,
            ultimaIngesta: ultimoAnuncio ? ultimoAnuncio.createdAt : null
        };
    }

    /**
     * Purga las subastas cuya fecha de finalización ya ha pasado.
     * @param {Date} [now=new Date()] - Fecha de corte para la purga.
     * @returns {Promise<number>} Número de documentos eliminados.
     */
    async function purgePastSubastas(now = new Date()) {
        const result = await Subasta.deleteMany({
            fechaFinalizacion: { $lt: now }
        });
        return result.deletedCount;
    }

    return {
        findAll,
        findById,
        saveSubastas,
        findPendingAI,
        updateAIExtraction,
        getSystemStats,
        aggregateByCategoria,
        aggregateByProvincia,
        purgePastSubastas,
        parseLoteId: parseSubastaId,
        buildLoteId: buildSubastaId
    };
}


module.exports = createSubastasRepository;