/**
 * @fileoverview Repositorio de acceso a datos para la colección de Comentarios.
 * Encapsula las operaciones de lectura y escritura en MongoDB mediante Mongoose.
 */

const Comentario = require("../models/comentario");

/**
 * Crea una instancia del repositorio de comentarios.
 * @returns {Object} Métodos de acceso a datos (save, findBySubastaId).
 */
function createComentariosRepository() {
    /**
     * Guarda un nuevo comentario en la base de datos y adjunta los datos del usuario.
     * @param {Object} comentarioData - Objeto con los datos del comentario (subasta_id, usuario_id, texto).
     * @returns {Promise<Object>} Documento de Mongoose guardado y poblado con el nombre del usuario.
     */
    async function save(comentarioData) {
        const comentario = new Comentario(comentarioData);
        await comentario.save();
        return await comentario.populate("usuario_id", "nombre");
    }

    /**
     * Recupera todos los comentarios asociados a una subasta, ordenados del más reciente al más antiguo.
     * @param {string} subasta_id - Identificador único de la subasta.
     * @returns {Promise<Array>} Array de documentos de Mongoose.
     */
    async function findBySubastaId(subasta_id) {
        return await Comentario.find({ subasta_id })
            .populate("usuario_id", "nombre")
            .sort({ createdAt: -1 });
    }

    /**
     * Recupera los comentarios de la plataforma con paginación.
     * @param {number} skip - Número de documentos a omitir.
     * @param {number} limit - Número máximo de documentos a devolver.
     * @param {string} search - Cadena de caracteres que filtra los documentos a devolver.
     * @returns {Promise<Object>} Objeto con los comentarios y el total de documentos.
     */
    async function findAll(skip = 0, limit = 10, search = "") {
        // Pipeline base: siempre hacemos lookup para obtener el usuario
        const pipeline = [
            {
                $lookup: {
                    from: "usuarios", // nombre de la colección de usuarios en MongoDB
                    localField: "usuario_id",
                    foreignField: "_id",
                    as: "usuario",
                },
            },
            { $unwind: { path: "$usuario", preserveNullAndEmptyArrays: true } },
        ];

        // Si hay término de búsqueda, añadimos el match correspondiente
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { texto: { $regex: search, $options: "i" } },
                        { "usuario.nombre": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }

        // Orden, paginación
        pipeline.push(
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        );

        // Pipeline para contar el total (con el mismo filtro)
        const countPipeline = [
            {
                $lookup: {
                    from: "usuarios",
                    localField: "usuario_id",
                    foreignField: "_id",
                    as: "usuario",
                },
            },
            { $unwind: { path: "$usuario", preserveNullAndEmptyArrays: true } },
        ];

        if (search) {
            countPipeline.push({
                $match: {
                    $or: [
                        { texto: { $regex: search, $options: "i" } },
                        { "usuario.nombre": { $regex: search, $options: "i" } },
                    ],
                },
            });
        }
        countPipeline.push({ $count: "total" });

        const [comentarios, totalResult] = await Promise.all([
            Comentario.aggregate(pipeline),
            Comentario.aggregate(countPipeline),
        ]);

        // Transformar para mantener la misma estructura que con populate
        const comentariosConPopulate = comentarios.map((c) => {
            const { usuario, ...rest } = c;
            return {
                ...rest,
                usuario_id: usuario
                    ? { _id: usuario._id, nombre: usuario.nombre }
                    : null,
            };
        });

        const total = totalResult[0]?.total || 0;
        return { comentarios: comentariosConPopulate, total };
    }

    async function findById(comentarioId) {
        return await Comentario.findById(comentarioId);
    }

    async function deleteById(comentarioId) {
        return await Comentario.findByIdAndDelete(comentarioId);
    }

    return { save, findBySubastaId, findAll, findById, deleteById };
}

module.exports = createComentariosRepository;
