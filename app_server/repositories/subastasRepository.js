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

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        return await Subasta.find(query).sort({ fechaPublicacion: -1 });
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