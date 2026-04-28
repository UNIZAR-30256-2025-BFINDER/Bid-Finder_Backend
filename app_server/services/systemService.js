/**
 * @fileoverview Servicio para la gestión y monitorización del estado del sistema.
 */

function createSystemService(subastasRepository) {
    
    async function obtenerEstadoSistema() {
        const stats = await subastasRepository.getSystemStats();
        
        return {
            estado_backend: 'ONLINE',
            timestamp_actual: new Date(),
            ...stats
        };
    }

    return { obtenerEstadoSistema };
}

module.exports = createSystemService;