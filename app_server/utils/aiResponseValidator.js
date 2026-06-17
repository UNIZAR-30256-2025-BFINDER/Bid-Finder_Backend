/**
 * @fileoverview Validador de esquemas para las respuestas de la Inteligencia Artificial.
 * Soporta el formato multi-subasta: espera un objeto con array "subastas" (o "lotes") y valida cada una.
 * Incluye fallback para respuestas en formato antiguo (objeto plano sin array).
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
 * Valida y sanea una única subasta individual devuelta por la IA.
 * @param {Object} data - Objeto JSON de una subasta cruda devuelto por el LLM.
 * @param {number} [defaultNumero=1] - Número de lote por defecto si no viene.
 * @returns {Object} Subasta saneada lista para ser guardada en MongoDB.
 */
function validarLote(data, defaultNumero = 1) {
    if (!data || typeof data !== "object") {
        return { numero_lote: defaultNumero };
    }

    const CATEGORIAS = ["inmueble", "vehiculo", "maquinaria", "joyas", "arte", "derechos", "mobiliario", "otros"];

    const ESTADOS_PERMITIDOS = ["ACTIVA", "ANULADA", "SUSPENDIDA", "CONCLUIDA"];

    // Definición de reglas de validación por campo
    const esquema = {
        estado_subasta: (v) => v === null || (typeof v === "string" && ESTADOS_PERMITIDOS.includes(v.toUpperCase())),
        fecha_finalizacion: (v) => typeof v === "string" || v === null,
        titulo_resumido: (v) => typeof v === "string" || v === null,
        resumen: (v) => typeof v === "string" || v === null,
        direccion: (v) => typeof v === "string" || v === null,
        categoria: (v) => v === null || (typeof v === "string" && CATEGORIAS.includes(v.toLowerCase())),
        referencia_catastral: (v) => typeof v === "string" || v === null,
        precio_salida: (v) => !isNaN(parseFloat(v)) || v === null,
        zona: (v) => esZonaValida(v) || v === null,
        riesgo_legal: (v) => v === null || (typeof v === "string" && ["alto", "medio", "bajo"].includes(v.toLowerCase())),
        ocupantes: (v) => typeof v === "string" || v === null,
        cargas_previas: (v) => typeof v === "string" || v === null,
    };

    const limpio = {
        numero_lote: typeof data.numero_lote === "number" ? data.numero_lote : defaultNumero,
    };

    for (const [campo, validador] of Object.entries(esquema)) {
        if (validador(data[campo])) {
            if (campo === "precio_salida" || campo === "valor_tasacion") {
                limpio[campo] =
                    data[campo] !== null ? parseFloat(data[campo]) : null;
            } else if (campo === "zona") {
                limpio[campo] = esZonaValida(data[campo]) ? data[campo] : null;
            } else if (campo === "categoria" || campo === "riesgo_legal") {
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

/**
 * Valida la respuesta completa de la IA, esperando el formato multi-subasta.
 * Soporta fallback: si recibe un objeto plano (formato antiguo), lo envuelve en un array.
 * @param {Object} data - Objeto JSON crudo devuelto por el LLM.
 * @returns {Object} Objeto con propiedad `subastas` (array de subastas validadas).
 * @throws {Error} Si la respuesta no es un objeto válido.
 */
function validarDatosSubasta(data) {
    if (!data || typeof data !== "object") {
        throw new Error("La respuesta de la IA no es un objeto válido.");
    }

    // Formato nuevo: { subastas: [...] } o { lotes: [...] }
    const items = data.subastas || data.lotes;
    if (Array.isArray(items)) {
        const subastasValidadas = items.map((item, idx) =>
            validarLote(item, idx + 1)
        );
        return { subastas: subastasValidadas };
    }

    // Formato antiguo (fallback): objeto plano con los campos directamente
    const subastaUnica = validarLote(data, 1);
    return { subastas: [subastaUnica] };
}

module.exports = { validarDatosSubasta, validarLote, esZonaValida };