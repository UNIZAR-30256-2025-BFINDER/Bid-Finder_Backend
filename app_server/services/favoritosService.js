/**
 * @fileoverview Servicio para gestionar la lógica de subastas guardadas.
 * Trabaja con IDs compuestos de lote (ej. "BOE-B-xxx__L1") almacenados como strings.
 */

/**
 * Crea el servicio inyectando los repositorios y servicios necesarios.
 * @param {Object} usuariosRepository - Repositorio de perfiles de usuario.
 * @param {Object} subastasService - Servicio para consultar la validez de los activos.
 * @returns {Object} Interfaz del servicio.
 */
function createFavoritosService(usuariosRepository, subastasService) {

    /**
     * Vincula un lote de subasta a la colección de favoritos del usuario.
     * @param {string} userId - ID del usuario solicitante.
     * @param {string} loteId - ID compuesto del lote (ej. "BOE-B-xxx__L1").
     * @returns {Promise<Object>} Resumen con el array actualizado de favoritos.
     * @throws {Error} Si el lote no existe en la BD.
     */
    async function addFavorite(userId, loteId) {
        const subasta = await subastasService.getSubastaById(loteId);
        if (!subasta) {
            throw new Error("Subasta no encontrada");
        }
        const usuario = await usuariosRepository.addFavorito(userId, loteId);
        return { subasta, favoritos: usuario.favoritos };
    }

    /**
     * Desvincula un lote de subasta de la colección de favoritos de un usuario.
     * @param {string} userId - ID del usuario solicitante.
     * @param {string} loteId - ID compuesto del lote (ej. "BOE-B-xxx__L1").
     * @returns {Promise<Object>} Resumen con el array actualizado.
     * @throws {Error} Si el lote no existe.
     */
    async function removeFavorite(userId, loteId) {
        const subasta = await subastasService.getSubastaById(loteId);
        if (!subasta) {
            throw new Error("Subasta no encontrada");
        }
        const usuario = await usuariosRepository.removeFavorito(userId, loteId);
        return { subasta, favoritos: usuario.favoritos };
    }

    /**
     * Obtiene todas las subastas favoritas de un usuario, completamente pobladas.
     * @param {string} userId - ID del usuario.
     * @returns {Promise<Array>} Lista de objetos de subastas favoritas.
     */
    async function getFavorites(userId) {
        const usuario = await usuariosRepository.getFavoritos(userId);
        if (!usuario) return [];
        const ids = usuario.favoritos || [];
        const subastas = await Promise.all(
            ids.map(async (id) => {
                try {
                    return await subastasService.getSubastaById(id);
                } catch (err) {
                    return null;
                }
            })
        );
        return subastas.filter((s) => s !== null);
    }

    return { addFavorite, removeFavorite, getFavorites };
}

module.exports = createFavoritosService;