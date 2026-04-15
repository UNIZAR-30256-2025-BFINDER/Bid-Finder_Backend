const Subasta = require('../models/subasta');

function createSubastasRepository() {
   async function findAll(filtros = {}) {
        const query = { estado_ia: 'PROCESADO' };
        const andConditions = [];

        if (filtros.provincia) {
            const regexProvincia = new RegExp(filtros.provincia, 'i');
            andConditions.push({
                $or: [
                    { zona: regexProvincia },
                    { direccion: regexProvincia }
                ]
            });
        }

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

        if (filtros.q) {
            andConditions.push({ $text: { $search: filtros.q } });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        let projection = null;
        let sortOptions = { fechaPublicacion: -1 };

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

    async function findById(id) {
        return await Subasta.findOne({ id: id });
    }

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
    
    async function findPendingAI(limit = 10) {
        return await Subasta.find({ estado_ia: 'PENDIENTE' }).limit(limit);
    }

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

    return {
        findAll,
        findById,
        saveSubastas,
        findPendingAI,
        updateAIExtraction
    };
}

module.exports = createSubastasRepository;