/**
 * @fileoverview Validador de esquemas para las respuestas de la Inteligencia Artificial.
 * Garantiza que los datos tengan el tipo y formato correctos antes de guardarlos en BD,
 * actuando como un escudo contra alucinaciones del modelo.
 */

/**
 * Valida que una cadena de texto corresponda a un municipio/zona real y no a
 * texto legal genérico extraído por error.
 * @param {string} zona - Texto extraído por la IA como ubicación.
 * @returns {boolean} True si el texto parece una zona geográfica válida.
 */
function esZonaValida(zona) {
    if (typeof zona !== "string" || zona === null) return false;
    const z = zona.trim();

    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\- ]{2,40}$/.test(z)) return false;

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

/**
 * Recorre y sanea el objeto JSON devuelto por la IA asegurando tipos de datos.
 * Sustituye por `null` cualquier campo que no cumpla con su esquema predefinido.
 * @param {Object} data - Objeto JSON crudo devuelto por el LLM.
 * @returns {Object} Nuevo objeto saneado listo para ser guardado en MongoDB.
 * @throws {Error} Si la respuesta principal no es un objeto.
 */
function validarDatosSubasta(data) {
    if (!data || typeof data !== "object") {
        throw new Error("La respuesta de la IA no es un objeto válido.");
    }

    const CATEGORIAS = ["inmueble", "vehiculo", "maquinaria", "otros"];

    // Definición de reglas de validación por campo
    const esquema = {
        titulo_resumido: (v) => typeof v === "string" || v === null,
        resumen: (v) => typeof v === "string" || v === null,
        direccion: (v) => typeof v === "string" || v === null,
        categoria: (v) => v === null || (typeof v === "string" && CATEGORIAS.includes(v.toLowerCase())),
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
            } else if (campo === "categoria") {
                limpio[campo] = data[campo] !== null ? data[campo].toUpperCase() : null;
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