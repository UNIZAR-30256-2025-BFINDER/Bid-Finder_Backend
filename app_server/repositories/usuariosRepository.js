/**
 * @fileoverview Repositorio de acceso a datos para la colección de Usuarios.
 * Gestiona operaciones específicas del perfil como la lista de favoritos.
 */

const Usuario = require("../models/usuario");

/**
 * Crea una instancia del repositorio de usuarios.
 * @returns {Object} Métodos de acceso a datos de perfil y preferencias.
 */
function createUsuariosRepository() {
    /**
     * Añade el ID de una subasta al array de favoritos del usuario.
     * Utiliza $addToSet para evitar duplicados en la base de datos.
     * @param {string} userId - ID interno de Mongo del usuario autenticado.
     * @param {string} subastaObjectId - ID interno de Mongo de la subasta a guardar.
     * @returns {Promise<Object>} Documento de usuario actualizado y poblado con sus favoritos.
     */
    async function addFavorito(userId, loteId) {
        return await Usuario.findByIdAndUpdate(
            userId,
            { $addToSet: { favoritos: loteId } },
            { new: true },
        ).select("favoritos");
    }

    /**
     * Elimina el ID de una subasta del array de favoritos del usuario mediante $pull.
     * @param {string} userId - ID interno de Mongo del usuario autenticado.
     * @param {string} subastaObjectId - ID interno de Mongo de la subasta a eliminar.
     * @returns {Promise<Object>} Documento de usuario actualizado y poblado con sus favoritos.
     */
    async function removeFavorito(userId, loteId) {
        return await Usuario.findByIdAndUpdate(
            userId,
            { $pull: { favoritos: loteId } },
            { new: true },
        ).select("favoritos");
    }

    /**
     * Recupera el documento de un usuario poblando únicamente su array de subastas favoritas.
     * @param {string} userId - ID interno de Mongo del usuario.
     * @returns {Promise<Object>} Documento de usuario con la información de los favoritos expandida.
     */
    async function getFavoritos(userId) {
        return await Usuario.findById(userId)
            .select("favoritos");
    }

    /**
     * Recupera los usuarios de la plataforma con paginación.
     * @param {number} skip - Número de documentos a omitir.
     * @param {number} limit - Número máximo de documentos a devolver.
     * @param {string} search - Cadena de caracteres que filtra los documentos a devolver.
     * @returns {Promise<Object>} Objeto con los usuarios y el total de usuarios.
     */
    async function findAll(skip = 0, limit = 10, search = "") {
        const globalTotal = await Usuario.countDocuments();
        const globalAdmins = await Usuario.countDocuments({ rol: "admin" });

        // Construir el filtro de búsqueda solo si hay término
        const matchCondition = {};
        if (search) {
            matchCondition.$or = [
                { nombre: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        // Pipeline base (siempre empieza con $match si hay condiciones, sino se omite)
        const pipeline = [];

        if (Object.keys(matchCondition).length > 0) {
            pipeline.push({ $match: matchCondition });
        }

        pipeline.push(
            // Añadir campo numFavoritos
            {
                $addFields: {
                    numFavoritos: { $size: { $ifNull: ["$favoritos", []] } },
                },
            },
            // Lookup para contar comentarios
            {
                $lookup: {
                    from: "comentarios",
                    localField: "_id",
                    foreignField: "usuario_id",
                    as: "comentarios",
                },
            },
            {
                $addFields: {
                    numComentarios: { $size: "$comentarios" },
                },
            },
            // Proyección final (excluir campos sensibles y arrays pesados)
            {
                $project: {
                    comentarios: 0, // ya no necesitamos el array
                    password: 0,
                    refreshToken: 0,
                    __v: 0,
                    favoritos: 0, // opcional, si no quieres enviar el array
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        );

        const [usuarios, countResult] = await Promise.all([
            Usuario.aggregate(pipeline),
            Usuario.aggregate([
                ...(Object.keys(matchCondition).length > 0
                    ? [{ $match: matchCondition }]
                    : []),
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        admins: {
                            $sum: { $cond: [{ $eq: ["$rol", "admin"] }, 1, 0] },
                        },
                    },
                },
            ]),
        ]);

        const filteredTotal = countResult[0]?.total || 0;
        const filteredAdmins = countResult[0]?.admins || 0;

        return {
            usuarios,
            total: filteredTotal,
            totalAdmins: filteredAdmins,
            globalTotal,
            globalAdmins,
        };
    }

    /**
     * Busca un usuario por su dirección de correo electrónico.
     * @param {string} email - Correo a buscar.
     * @param {boolean} [selectPassword=false] - Indica si se debe incluir la contraseña (sensible).
     * @returns {Promise<Object|null>} Documento de usuario o null.
     */
    async function findByEmail(email, selectPassword = false) {
        let query = Usuario.findOne({ email });
        if (selectPassword) {
            query = query.select('+password');
        }
        return await query;
    }

    /**
     * Crea un nuevo documento de usuario en la base de datos.
     * @param {Object} datosUsuario - Datos para registrar ({ nombre, email, password }).
     * @returns {Promise<Object>} Documento de usuario creado.
     */
    async function create(datosUsuario) {
        return await Usuario.create(datosUsuario);
    }

    /**
     * Busca un usuario por su ID interno de MongoDB.
     * @param {string} id - ID único del usuario.
     * @param {boolean} [selectRefreshToken=false] - Indica si se debe incluir el refresh token.
     * @returns {Promise<Object|null>} Documento de usuario o null.
     */
    async function findById(id, selectRefreshToken = false) {
        let query = Usuario.findById(id);
        if (selectRefreshToken) {
            query = query.select('+refreshToken');
        }
        return await query;
    }

    /**
     * Actualiza el token de refresco (Refresh Token) asignado a un usuario.
     * @param {string} id - ID único del usuario.
     * @param {string|null} token - Token de refresco o null para revocar.
     * @returns {Promise<Object>} Documento de usuario actualizado.
     */
    async function updateRefreshToken(id, token) {
        return await Usuario.findByIdAndUpdate(
            id,
            { refreshToken: token },
            { new: true }
        );
    }

    return { 
        addFavorito, 
        removeFavorito, 
        getFavoritos, 
        findAll,
        findByEmail,
        create,
        findById,
        updateRefreshToken
    };
}

module.exports = createUsuariosRepository;
