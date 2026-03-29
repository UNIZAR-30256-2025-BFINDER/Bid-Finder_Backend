const Subasta = require('../models/subasta');

function createSubastasRepository() {
    async function findAll() {
        return await Subasta.find({ estado_ia: 'PROCESADO' }).sort({ fechaPublicacion: -1 });
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