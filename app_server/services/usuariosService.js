/**
 * @fileoverview Servicio de gestión de usuarios.
 * Conecta las reglas de validación de negocio con el repositorio de datos subyacente.
 */

/**
 * Crea el servicio inyectando su repositorio correspondiente.
 * @param {Object} usuariosRepository - Repositorio de persistencia de Mongo.
 * @returns {Object} Interfaz de métodos del servicio.
 */
function createUsuariosService(usuariosRepository) {
    /**
     * Recupera todos los usuarios de la plataforma con paginación (para administración).
     * @param {number} page - Página actual solicitada.
     * @param {number} limit - Cantidad de elementos por página.
     * @param {string} search - Cadena que filtra los elementos a devolver.
     * @returns {Promise<Object>} Objeto con la lista global paginada y el total.
     */
    async function obtenerTodosLosUsuarios(page = 1, limit = 10, search = "") {
        const pageNumber = Math.max(1, page);
        const limitNumber = Math.max(1, limit);

        const skip = (pageNumber - 1) * limitNumber;

        return await usuariosRepository.findAll(skip, limitNumber, search);
    }

    return {
        obtenerTodosLosUsuarios,
    };
}

module.exports = createUsuariosService;
