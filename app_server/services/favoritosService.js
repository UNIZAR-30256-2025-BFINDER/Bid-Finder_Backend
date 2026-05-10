function createFavoritosService(usuariosRepository, subastasService) {
    async function addFavorite(userId, subastaId) {
        const subasta = await subastasService.getSubastaById(subastaId);
        if (!subasta) {
            throw new Error("Subasta no encontrada");
        }
        const usuario = await usuariosRepository.addFavorito(userId, subasta._id);
        return { subasta, favoritos: usuario.favoritos };
    }

    async function removeFavorite(userId, subastaId) {
        const subasta = await subastasService.getSubastaById(subastaId);
        if (!subasta) {
            throw new Error("Subasta no encontrada");
        }
        const usuario = await usuariosRepository.removeFavorito(userId, subasta._id);
        return { subasta, favoritos: usuario.favoritos };
    }

    async function getFavorites(userId) {
        const usuario = await usuariosRepository.getFavoritos(userId);
        return usuario.favoritos || [];
    }

    return { addFavorite, removeFavorite, getFavorites };
}

module.exports = createFavoritosService;