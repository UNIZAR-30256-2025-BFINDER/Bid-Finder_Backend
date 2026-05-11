/**
 * @fileoverview Repositorio de acceso a datos para la colección de Usuarios.
 * Gestiona operaciones específicas del perfil como la lista de favoritos.
 */

const Usuario = require('../models/usuario');

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
    async function addFavorito(userId, subastaObjectId) {
        return await Usuario.findByIdAndUpdate(
            userId,
            { $addToSet: { favoritos: subastaObjectId } },
            { new: true }
        ).populate("favoritos");
    }

    /**
     * Elimina el ID de una subasta del array de favoritos del usuario mediante $pull.
     * @param {string} userId - ID interno de Mongo del usuario autenticado.
     * @param {string} subastaObjectId - ID interno de Mongo de la subasta a eliminar.
     * @returns {Promise<Object>} Documento de usuario actualizado y poblado con sus favoritos.
     */
    async function removeFavorito(userId, subastaObjectId) {
        return await Usuario.findByIdAndUpdate(
            userId,
            { $pull: { favoritos: subastaObjectId } },
            { new: true }
        ).populate("favoritos");
    }

    /**
     * Recupera el documento de un usuario poblando únicamente su array de subastas favoritas.
     * @param {string} userId - ID interno de Mongo del usuario.
     * @returns {Promise<Object>} Documento de usuario con la información de los favoritos expandida.
     */
    async function getFavoritos(userId) {
        return await Usuario.findById(userId)
            .populate("favoritos")
            .select("favoritos");
    }

    return { addFavorito, removeFavorito, getFavoritos };
}

module.exports = createUsuariosRepository;