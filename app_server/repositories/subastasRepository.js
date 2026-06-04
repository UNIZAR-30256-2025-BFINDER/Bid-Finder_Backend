/**
 * @fileoverview Repositorio principal para la colección de Anuncios y Subastas.
 * Gestiona consultas complejas con $unwind para aplanar las subastas individuales
 * dentro de un anuncio general, filtros, Full-Text Search y agregaciones.
 */

const Anuncio = require('../models/anuncio');

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
 * Crea una instancia del repositorio de subastas.
 * @returns {Object} Colección de métodos de acceso a datos y estadísticas.
 */
function createSubastasRepository() {

    /**
     * Ejecuta un pipeline de agregación para contar subastas agrupadas por categoría.
     * @returns {Promise<Array>} Array de objetos { categoria, total } ordenado descendentemente.
     */
    async function aggregateByCategoria() {
        return await Anuncio.aggregate([
            { $match: { estado_ia: 'PROCESADO' } },
            { $unwind: "$subastas" },
            { $match: { "subastas.categoria": { $ne: null } } },
            { $group: { _id: "$subastas.categoria", total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $project: { categoria: "$_id", total: 1, _id: 0 } }
        ]);
    }

    /**
     * Ejecuta un pipeline de agregación para contar subastas agrupadas por provincia (zona).
     * @returns {Promise<Array>} Array de objetos { provincia, total } ordenado descendentemente.
     */
    async function aggregateByProvincia() {
        return await Anuncio.aggregate([
            { $match: { estado_ia: 'PROCESADO' } },
            { $unwind: "$subastas" },
            { $match: { "subastas.zona": { $ne: null } } },
            { $group: { _id: "$subastas.zona", total: { $sum: 1 } } },
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
        const pipeline = [];

        // Fase 1: Filtrar anuncios procesados
        const matchInicial = { estado_ia: 'PROCESADO' };

        // Full-Text Search
        if (filtros.q) {
            matchInicial.$text = { $search: filtros.q };
        }

        pipeline.push({ $match: matchInicial });

        // Si hay búsqueda por texto, añadir el score
        if (filtros.q) {
            pipeline.push({ $addFields: { _textScore: { $meta: "textScore" } } });
        }

        // Fase 2: Guardar el número total de subastas antes de $unwind
        pipeline.push({
            $addFields: {
                _totalLotes: { $size: { $ifNull: ["$subastas", []] } }
            }
        });

        // Fase 3: Aplanar subastas
        pipeline.push({ $unwind: { path: "$subastas", preserveNullAndEmptyArrays: false } });

        // Fase 4: Filtros sobre campos de la subasta individual
        const matchSubastas = {};

        if (filtros.provincia) {
            const regexProv = new RegExp(filtros.provincia, 'i');
            matchSubastas.$or = [
                { "subastas.zona": regexProv },
                { "subastas.direccion": regexProv }
            ];
        }

        if (filtros.categoria) {
            const regexCat = new RegExp(filtros.categoria, 'i');
            matchSubastas.$or = matchSubastas.$or || [];
            if (filtros.provincia) {
                const provCondition = matchSubastas.$or;
                delete matchSubastas.$or;
                matchSubastas.$and = [
                    { $or: provCondition },
                    {
                        $or: [
                            { "subastas.titulo_resumido": regexCat },
                            { "subastas.resumen": regexCat },
                            { texto: regexCat }
                        ]
                    }
                ];
            } else {
                matchSubastas.$or = [
                    { "subastas.titulo_resumido": regexCat },
                    { "subastas.resumen": regexCat },
                    { texto: regexCat }
                ];
            }
        }

        if (filtros.precio_min || filtros.precio_max) {
            const precioCond = {};
            const precioMin = filtros.precio_min ? Number(filtros.precio_min) : undefined;
            const precioMax = filtros.precio_max ? Number(filtros.precio_max) : undefined;
            if (precioMin !== undefined && !isNaN(precioMin)) precioCond.$gte = precioMin;
            if (precioMax !== undefined && !isNaN(precioMax)) precioCond.$lte = precioMax;
            if (Object.keys(precioCond).length > 0) {
                matchSubastas["subastas.precio_salida"] = { ...precioCond, $ne: null };
            }
        }

        if (filtros.nivel_oportunidad) {
            let viabilidadQuery = filtros.nivel_oportunidad.toUpperCase();
            if (viabilidadQuery === 'ALTO') viabilidadQuery = 'ALTA';
            if (viabilidadQuery === 'MEDIO') viabilidadQuery = 'MEDIA';
            if (viabilidadQuery === 'BAJO') viabilidadQuery = 'BAJA';
            if (['ALTA', 'MEDIA', 'BAJA'].includes(viabilidadQuery)) {
                matchSubastas["subastas.viabilidad"] = viabilidadQuery;
            }
        }

        if (filtros.tipo_lote) {
            if (filtros.tipo_lote === 'multi') {
                matchSubastas["_totalLotes"] = { $gt: 1 };
            } else if (filtros.tipo_lote === 'simple') {
                matchSubastas["_totalLotes"] = 1;
            }
        }

        if (Object.keys(matchSubastas).length > 0) {
            pipeline.push({ $match: matchSubastas });
        }

        // Fase 5: Proyectar campos aplanados para compatibilidad con frontend
        pipeline.push({
            $project: {
                _id: 0,
                id: { $concat: ["$id", "__L", { $toString: "$subastas.numero_lote" }] },
                anuncio_id: "$id",
                numero_lote: "$subastas.numero_lote",
                total_lotes: "$_totalLotes",
                titulo: 1,
                fechaPublicacion: 1,
                urlPdf: 1,
                texto: 1,
                estado_ia: 1,
                titulo_resumido: "$subastas.titulo_resumido",
                resumen: "$subastas.resumen",
                categoria: "$subastas.categoria",
                precio_salida: "$subastas.precio_salida",
                valor_tasacion: "$subastas.valor_tasacion",
                diferencia_porcentual_oportunidad: "$subastas.diferencia_porcentual_oportunidad",
                nivel_oportunidad: "$subastas.nivel_oportunidad",
                viabilidad: "$subastas.viabilidad",
                direccion: "$subastas.direccion",
                zona: "$subastas.zona",
                referencia_catastral: "$subastas.referencia_catastral",
                location: "$subastas.location",
                riesgo_legal: "$subastas.riesgo_legal",
                ocupantes: "$subastas.ocupantes",
                cargas_previas: "$subastas.cargas_previas",
                ...(filtros.q ? { _textScore: 1 } : {})
            }
        });

        // Fase 6: Ordenación
        if (filtros.q) {
            pipeline.push({ $sort: { _textScore: -1 } });
        } else {
            pipeline.push({ $sort: { fechaPublicacion: -1 } });
        }

        return await Anuncio.aggregate(pipeline);
    }

    /**
     * Busca una subasta específica por su ID compuesto (anuncio_id + __L + numero_lote).
     * @param {string} subastaId - ID compuesto de la subasta.
     * @returns {Promise<Object|null>} Documento aplanado de la subasta o null.
     */
    async function findById(subastaId) {
        const { anuncioId, numeroSubasta } = parseSubastaId(subastaId);

        const result = await Anuncio.aggregate([
            { $match: { id: anuncioId } },
            {
                $addFields: {
                    _totalLotes: { $size: { $ifNull: ["$subastas", []] } },
                    _allLotes: "$subastas"
                }
            },
            { $unwind: { path: "$subastas", preserveNullAndEmptyArrays: true } },
            { $match: { "subastas.numero_lote": numeroSubasta } },
            {
                $project: {
                    _id: 0,
                    id: { $concat: ["$id", "__L", { $toString: "$subastas.numero_lote" }] },
                    anuncio_id: "$id",
                    numero_lote: "$subastas.numero_lote",
                    total_lotes: "$_totalLotes",
                    all_lotes: "$_allLotes",
                    titulo: 1,
                    fechaPublicacion: 1,
                    urlPdf: 1,
                    texto: 1,
                    estado_ia: 1,
                    titulo_resumido: "$subastas.titulo_resumido",
                    resumen: "$subastas.resumen",
                    categoria: "$subastas.categoria",
                    precio_salida: "$subastas.precio_salida",
                    valor_tasacion: "$subastas.valor_tasacion",
                    diferencia_porcentual_oportunidad: "$subastas.diferencia_porcentual_oportunidad",
                    nivel_oportunidad: "$subastas.nivel_oportunidad",
                    viabilidad: "$subastas.viabilidad",
                    direccion: "$subastas.direccion",
                    zona: "$subastas.zona",
                    referencia_catastral: "$subastas.referencia_catastral",
                    location: "$subastas.location",
                    riesgo_legal: "$subastas.riesgo_legal",
                    ocupantes: "$subastas.ocupantes",
                    cargas_previas: "$subastas.cargas_previas",
                }
            }
        ]);

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Guarda masivamente un lote de anuncios en la base de datos.
     * @param {Array<Object>} anuncios - Array de objetos de anuncio a guardar.
     * @returns {Promise<Object>} Resumen de la operación (upserted, modified, matched).
     */
    async function saveSubastas(anuncios) {
        const operations = anuncios.map((anuncio) => ({
            updateOne: {
                filter: { id: anuncio.id },
                update: { $set: anuncio },
                upsert: true,
            },
        }));

        const result = await Anuncio.bulkWrite(operations);
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
        return await Anuncio.find({ estado_ia: 'PENDIENTE' }).limit(limit);
    }

    /**
     * Actualiza el registro de un anuncio con las subastas procesadas por la IA.
     * @param {string} id - ID del BOE del anuncio.
     * @param {Array<Object>} subastas - Array de subastas procesadas.
     * @param {string} [estado='PROCESADO'] - Nuevo estado de procesamiento.
     * @returns {Promise<Object>} Documento actualizado.
     */
    async function updateAIExtraction(id, subastas, estado = 'PROCESADO') {
        return await Anuncio.findOneAndUpdate(
            { id: id },
            {
                $set: {
                    subastas: subastas,
                    estado_ia: estado
                }
            },
            { new: true }
        );
    }

    /**
     * Obtiene métricas generales del sistema para el panel de administración.
     * @returns {Promise<Object>} Totales ingresados hoy y fecha de la última ingesta.
     */
    async function getSystemStats() {
        const inicioDeHoy = new Date();
        inicioDeHoy.setHours(0, 0, 0, 0);

        const ingresadasHoy = await Anuncio.countDocuments({
            createdAt: { $gte: inicioDeHoy }
        });

        const ultimoAnuncio = await Anuncio.findOne()
            .sort({ createdAt: -1 })
            .select('createdAt');

        return {
            ingresadasHoy,
            ultimaIngesta: ultimoAnuncio ? ultimoAnuncio.createdAt : null
        };
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
        parseLoteId: parseSubastaId,
        buildLoteId: buildSubastaId
    };
}

module.exports = createSubastasRepository;