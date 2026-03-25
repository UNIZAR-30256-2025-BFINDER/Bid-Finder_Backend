const Subasta = require("../models/subasta");

/**
 * Guarda una lista de subastas en base de datos, evitando duplicados por id.
 * @param {Array} subastas - Array de objetos con estructura { id, titulo, fechaPublicacion, urlPdf, texto, rawXml }
 * @returns {Promise<Object>} - Resumen de operaciones realizadas.
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

module.exports = { saveSubastas };
