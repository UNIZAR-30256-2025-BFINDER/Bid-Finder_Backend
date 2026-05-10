const Usuario = require('../models/usuario');

function createUsuariosRepository() {
    async function addFavorito(userId, subastaObjectId) {
        return await Usuario.findByIdAndUpdate(
            userId,
            { $addToSet: { favoritos: subastaObjectId } },
            { new: true }
        ).populate("favoritos");
    }

    async function removeFavorito(userId, subastaObjectId) {
        return await Usuario.findByIdAndUpdate(
            userId,
            { $pull: { favoritos: subastaObjectId } },
            { new: true }
        ).populate("favoritos");
    }

    async function getFavoritos(userId) {
        return await Usuario.findById(userId)
            .populate("favoritos")
            .select("favoritos");
    }

    return { addFavorito, removeFavorito, getFavoritos };
}

module.exports = createUsuariosRepository;