/**
 * @fileoverview Repositorio principal para la colección de Subastas.
 * Gestiona consultas complejas (Filtros, Full-Text Search), agregaciones y 
 * operaciones masivas para la ingesta.
 */

const Subasta = require('../models/subasta');

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
     * Recupera una lista de subastas aplicando múltiples filtros combinados.
     * Implementa lógica de Full-Text Search si se proporciona un término de búsqueda.
     * @param {Object} [filtros={}] - Diccionario de filtros (provincia, categoria, precio_min, precio_max, nivel_oportunidad, q).
     * @returns {Promise<Array>} Array de documentos de Mongoose procesados.
     */
    async function findAll(filtros = {}) {
        const query = { estado_ia: 'PROCESADO' };
        const andConditions = [];

        // Filtro por provincia (Regex)
        if (filtros.provincia) {
            const regexProvincia = new RegExp(filtros.provincia, 'i');
            andConditions.push({
                $or: [
                    { zona: regexProvincia },
                    { direccion: regexProvincia }
                ]
            });
        }

        // Filtro por categoría (Regex amplio a varios campos)
        if (filtros.categoria) {
            const regexCategoria = new RegExp(filtros.categoria, 'i');
            andConditions.push({
                $or: [
                    { titulo_resumido: regexCategoria },
                    { resumen: regexCategoria },
                    { texto: regexCategoria }
                ]
            });
        }

        // Filtro por rango de precios
        if (filtros.precio_min || filtros.precio_max) {
            const precioMin = filtros.precio_min ? Number(filtros.precio_min) : undefined;
            const precioMax = filtros.precio_max ? Number(filtros.precio_max) : undefined;
            const precioCond = {};
            if (precioMin !== undefined && !isNaN(precioMin)) precioCond.$gte = precioMin;
            if (precioMax !== undefined && !isNaN(precioMax)) precioCond.$lte = precioMax;
            if (Object.keys(precioCond).length > 0) {
                andConditions.push({ precio_salida: { ...precioCond, $ne: null } });
            }
        }

        // Filtro acumulativo por nivel de oportunidad (Ej: ALTO trae también lo de mayor prioridad si lo hubiera)
        if (filtros.nivel_oportunidad) {
            const prioridad = Subasta.NIVEL_OPORTUNIDAD_PRIORIDAD;
            const idx = prioridad.findIndex(
                n => n.toUpperCase() === filtros.nivel_oportunidad.toUpperCase()
            );
            if (idx !== -1) {
                const niveles = prioridad.slice(0, idx + 1);
                andConditions.push({ 
                    nivel_oportunidad: { $in: niveles, $ne: null }
                });
            }
        }

        // Búsqueda global por texto (Full-Text Search)
        if (filtros.q) {
            andConditions.push({ $text: { $search: filtros.q } });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        let projection = null;
        let sortOptions = { fechaPublicacion: -1 };

        // Si hay búsqueda por texto, ordenamos por relevancia de coincidencia (textScore)
        if (filtros.q) {
            projection = { score: { $meta: "textScore" } };
            sortOptions = { score: { $meta: "textScore" } };
        }

        if (projection) {
            return await Subasta.find(query, projection).sort(sortOptions);
        } else {
            return await Subasta.find(query).sort(sortOptions);
        }
    }

    /**
     * Busca una subasta por su identificador único del BOE.
     * @param {string} id - ID del BOE (ej. "BOE-B-...").
     * @returns {Promise<Object|null>} Documento de Mongoose o null.
     */
    async function findById(id) {
        return await Subasta.findOne({ id: id });
    }

    /**
     * Guarda masivamente un lote de subastas en la base de datos.
     * Utiliza operaciones Upsert (actualiza si existe, crea si no existe).
     * @param {Array<Object>} subastas - Array de objetos de subasta a guardar.
     * @returns {Promise<Object>} Resumen de la operación (upserted, modified, matched).
     */
    async function saveSubastas(subastas) {
        const operations = subastas.map((subasta) => ({
            updateOne: {
                filter: { id: subasta.id },
                update: { $set: subasta },
                upsert: true,
            },
        }));

        const result = await Subasta.bulkWrite(operations);
        return {
            upserted: result.upsertedCount,
            modified: result.modifiedCount,
            matched: result.matchedCount,
        };
    }
    
    /**
     * Busca un lote de subastas que aún no han sido procesadas por la IA.
     * @param {number} [limit=10] - Número máximo de subastas a devolver por petición.
     * @returns {Promise<Array>} Subastas en estado 'PENDIENTE'.
     */
    async function findPendingAI(limit = 10) {
        return await Subasta.find({ estado_ia: 'PENDIENTE' }).limit(limit);
    }

    /**
     * Actualiza el registro de una subasta con los datos procesados por la IA.
     * @param {string} id - ID del BOE de la subasta.
     * @param {Object} aiData - Diccionario con los campos extraídos y geolocalizados.
     * @param {string} [estado='PROCESADO'] - Nuevo estado de procesamiento.
     * @returns {Promise<Object>} Documento actualizado.
     */
    async function updateAIExtraction(id, aiData, estado = 'PROCESADO') {
        return await Subasta.findOneAndUpdate(
            { id: id },
            { 
                $set: {
                    ...aiData,
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

        const ingresadasHoy = await Subasta.countDocuments({
            createdAt: { $gte: inicioDeHoy }
        });

        const ultimaSubasta = await Subasta.findOne()
            .sort({ createdAt: -1 })
            .select('createdAt');

        return {
            ingresadasHoy,
            ultimaIngesta: ultimaSubasta ? ultimaSubasta.createdAt : null
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
        aggregateByProvincia
    };
}

module.exports = createSubastasRepository;