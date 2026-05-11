/**
 * @fileoverview Servicio para gestionar la lógica de subastas guardadas.
 * Relaciona los usuarios con la colección de subastas para asegurar integridad referencial.
 */

/**
 * Crea el servicio inyectando los repositorios y servicios necesarios.
 * @param {Object} usuariosRepository - Repositorio de perfiles de usuario.
 * @param {Object} subastasService - Servicio para consultar la validez de los activos.
 * @returns {Object} Interfaz del servicio.
 */
function createFavoritosService(usuariosRepository, subastasService) {
    
    /**
     * Vincula una subasta a la colección de favoritos del usuario si esta existe.
     * @param {string} userId - ID del usuario solicitante.
     * @param {string} subastaId - ID (BOE) del activo a guardar.
     * @returns {Promise<Object>} Resumen con la subasta y el array actualizado de favoritos.
     * @throws {Error} Si el identificador de subasta no existe en la BD.
     */
    async function addFavorite(userId, subastaId) {
        const subasta = await subastasService.getSubastaById(subastaId);
        if (!subasta) {
            throw new Error("Subasta no encontrada");
        }
        const usuario = await usuariosRepository.addFavorito(userId, subasta._id);
        return { subasta, favoritos: usuario.favoritos };
    }

    /**
     * Desvincula una subasta de la colección de favoritos de un usuario.
     * @param {string} userId - ID del usuario solicitante.
     * @param {string} subastaId - ID (BOE) del activo a desvincular.
     * @returns {Promise<Object>} Resumen con la subasta eliminada y el array actualizado.
     * @throws {Error} Si el identificador de subasta no existe.
     */
    async function removeFavorite(userId, subastaId) {
        const subasta = await subastasService.getSubastaById(subastaId);
        if (!subasta) {
            throw new Error("Subasta no encontrada");
        }
        const usuario = await usuariosRepository.removeFavorito(userId, subasta._id);
        return { subasta, favoritos: usuario.favoritos };
    }

    /**
     * Obtiene todos los objetos 'Subasta' guardados por un usuario específico.
     * @param {string} userId - ID del usuario.
     * @returns {Promise<Array>} Lista de subastas favoritas.
     */
    async function getFavorites(userId) {
        const usuario = await usuariosRepository.getFavoritos(userId);
        return usuario.favoritos || [];
    }

    return { addFavorite, removeFavorite, getFavorites };
}

module.exports = createFavoritosService;