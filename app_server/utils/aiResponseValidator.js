/**
 * @fileoverview Validador de esquemas para las respuestas de la IA.
 * Garantiza que los datos tengan el tipo correcto antes de guardarlos.
 */

function validarDatosSubasta(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('La respuesta de la IA no es un objeto válido.');
    }

    const esquema = {
        titulo_resumido: (v) => typeof v === 'string' || v === null,
        resumen: (v) => typeof v === 'string' || v === null,
        direccion: (v) => typeof v === 'string' || v === null,
        referencia_catastral: (v) => typeof v === 'string' || v === null,
        precio_salida: (v) => !isNaN(parseFloat(v)) || v === null,
        valor_tasacion: (v) => !isNaN(parseFloat(v)) || v === null
    };

    const limpio = {};

    for (const [campo, validador] of Object.entries(esquema)) {
        if (validador(data[campo])) {
            if (campo === 'precio_salida' || campo === 'valor_tasacion') {
                limpio[campo] = data[campo] !== null ? parseFloat(data[campo]) : null;
            } else {
                limpio[campo] = data[campo];
            }
        } else {
            limpio[campo] = null; 
        }
    }

    return limpio;
}

module.exports = { validarDatosSubasta };