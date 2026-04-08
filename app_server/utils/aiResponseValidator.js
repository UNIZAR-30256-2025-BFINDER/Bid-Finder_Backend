/**
 * @fileoverview Validador de esquemas para las respuestas de la IA.
 * Garantiza que los datos tengan el tipo correcto antes de guardarlos.
 */

// Validación básica de zona: solo letras, espacios, longitud razonable, y no frases genéricas
function esZonaValida(zona) {
    if (typeof zona !== "string" || zona === null) return false;
    const z = zona.trim();
    // Solo letras, espacios, guiones y tildes, longitud 2-40
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\- ]{2,40}$/.test(z)) return false;
    // Rechaza frases genéricas típicas
    const frasesInvalidas = [
        "la presente convocatoria",
        "virtud del contrato",
        "sobre cerrado",
        "registro general",
        "registro de la propiedad",
        "subasta pública",
        "administración general",
        "contrato suscrito",
        "convocatoria",
        "presentación de ofertas",
        "titularidad de la administración",
        "procedente de abintestato",
    ];
    return !frasesInvalidas.some((f) => z.toLowerCase().includes(f));
}

function validarDatosSubasta(data) {
    if (!data || typeof data !== "object") {
        throw new Error("La respuesta de la IA no es un objeto válido.");
    }

    const esquema = {
        titulo_resumido: (v) => typeof v === "string" || v === null,
        resumen: (v) => typeof v === "string" || v === null,
        direccion: (v) => typeof v === "string" || v === null,
        referencia_catastral: (v) => typeof v === "string" || v === null,
        precio_salida: (v) => !isNaN(parseFloat(v)) || v === null,
        valor_tasacion: (v) => !isNaN(parseFloat(v)) || v === null,
        zona: (v) => esZonaValida(v) || v === null,
        riesgo_legal: (v) => ["Alto", "Medio", "Bajo", null].includes(v),
        ocupantes: (v) => typeof v === "string" || v === null,
        cargas_previas: (v) => typeof v === "string" || v === null,
    };

    const limpio = {};

    for (const [campo, validador] of Object.entries(esquema)) {
        if (validador(data[campo])) {
            if (campo === "precio_salida" || campo === "valor_tasacion") {
                limpio[campo] =
                    data[campo] !== null ? parseFloat(data[campo]) : null;
            } else if (campo === "zona") {
                limpio[campo] = esZonaValida(data[campo]) ? data[campo] : null;
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
