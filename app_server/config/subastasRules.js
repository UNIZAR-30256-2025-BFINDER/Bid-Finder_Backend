/**
 * @fileoverview Reglas de negocio específicas para la extracción y filtrado de Subastas del BOE.
 */

/**
 * Extrae y concatena el texto contenido en los nodos de párrafo de un documento XML.
 * @param {Object} textoNode - Nodo de texto extraído del XML parseado.
 * @returns {string} Texto limpio y concatenado.
 */
function extraerTextoDesdeTextoNode(textoNode) {
    if (!textoNode) return "";
    let parrafos = textoNode.p;
    if (!parrafos) return "";
    const arrayParrafos = Array.isArray(parrafos) ? parrafos : [parrafos];
    return arrayParrafos
        .map((p) => p["#text"] || "")
        .filter((text) => text.trim() !== "")
        .join("\n");
}

/**
 * Objeto que encapsula las estrategias y reglas de filtrado para procesar subastas.
 * @namespace subastasRules
 */
const subastasRules = {
    /**
     * Evalúa si un ítem del BOE corresponde a una subasta válida basándose en su jerarquía.
     * @param {Object} seccion - Nodo de sección del XML.
     * @param {Object} departamento - Nodo de departamento del XML.
     * @param {Object|null} epigrafe - Nodo de epígrafe del XML, si existe.
     * @param {Object} item - Nodo del ítem a evaluar.
     * @returns {boolean} True si cumple las condiciones de subasta, False en caso contrario.
     */
    filterCondition: (seccion, departamento, epigrafe, item) => {
        const nombreSeccion = String(seccion['@_nombre'] || seccion.nombre || "").toUpperCase();
        if (!nombreSeccion.includes('ANUNCIOS')) return false;

        const titulo = String(item.titulo || "").toUpperCase();
        const esTituloSubasta = titulo.includes('SUBASTA');
        
        let esEpigrafeSubasta = false;
        if (epigrafe) {
            const nombreEpigrafe = String(epigrafe['@_nombre'] || epigrafe.nombre || "").toUpperCase();
            esEpigrafeSubasta = nombreEpigrafe.includes('SUBASTAS');
        }

        return esTituloSubasta || esEpigrafeSubasta;
    },
    
    /**
     * Transforma un documento XML crudo en un objeto preliminar de Subasta.
     * Aplica filtros de descarte rápido (ej. enlaces huérfanos o vehículos).
     * @param {Object} documento - Documento parseado del BOE.
     * @returns {Object|null} Objeto subasta formateado, o null si es descartado por las reglas.
     */
    mapFn: (documento) => {
        const metadatos = documento.metadatos || {};
        const textoLimpio = extraerTextoDesdeTextoNode(documento.texto);
        const textoMayus = textoLimpio.toUpperCase();
        
        const esEnlace = textoMayus.includes('HTTPS://SUBASTAS.BOE.ES') && textoLimpio.length < 600;
        
        const esVehiculo = textoMayus.includes('VEHÍCULO') || 
                           textoMayus.includes('VEHICULO') || 
                           textoMayus.includes('MATRÍCULA') || 
                           textoMayus.includes('BASTIDOR');

        if (esEnlace || esVehiculo) {
            return null; 
        }

        const rawXml = typeof documento.texto === 'object' ? JSON.stringify(documento.texto) : String(documento.texto);

        return {
            id: metadatos.identificador || "",
            titulo: metadatos.titulo || "Título no disponible",
            fechaPublicacion: metadatos.fecha_publicacion || "",
            urlPdf: metadatos.url_pdf || "",
            texto: textoLimpio,
            rawXml: rawXml
        };
    },

    /**
     * Estrategia de recorrido para extraer identificadores y URLs a partir del sumario diario del BOE.
     * @param {Object} jsonObj - JSON resultante de parsear el XML del sumario.
     * @returns {Array<{id: string, titulo: string, urlXml: string}>} Lista de ítems encontrados.
     */
    extractSumarioStrategy: (jsonObj) => {
        const itemsEncontrados = [];
        const diario = jsonObj.response?.data?.sumario?.diario;
        if (!diario || !diario.seccion) return itemsEncontrados;

        diario.seccion.forEach((seccion) => {
            if (!seccion.departamento) return;
            seccion.departamento.forEach((departamento) => {
                if (departamento.item) {
                    departamento.item.forEach((item) => {
                        if (subastasRules.filterCondition(seccion, departamento, null, item)) {
                            if (!itemsEncontrados.find((i) => i.id === item.identificador)) {
                                itemsEncontrados.push({ id: item.identificador, titulo: item.titulo, urlXml: item.url_xml });
                            }
                        }
                    });
                }
                if (departamento.epigrafe) {
                    departamento.epigrafe.forEach((epigrafe) => {
                        if (epigrafe.item) {
                            epigrafe.item.forEach((item) => {
                                if (subastasRules.filterCondition(seccion, departamento, epigrafe, item)) {
                                    if (!itemsEncontrados.find((i) => i.id === item.identificador)) {
                                        itemsEncontrados.push({ id: item.identificador, titulo: item.titulo, urlXml: item.url_xml });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });
        return itemsEncontrados;
    },

    /**
     * Estrategia para extraer y validar los detalles de un anuncio individual.
     * @param {Object} jsonObj - JSON resultante de parsear el XML del anuncio.
     * @returns {Object|null} Datos procesados mediante mapFn.
     * @throws {Error} Si el XML carece de la estructura mínima requerida.
     */
    extractAnuncioStrategy: (jsonObj) => {
        const documento = jsonObj.documento;
        if (!documento) throw new Error("El XML proporcionado no tiene la etiqueta raíz <documento>.");
        if (!documento.metadatos || !documento.metadatos.identificador) throw new Error("No se ha encontrado el identificador único.");
        return subastasRules.mapFn(documento);
    }
};

module.exports = subastasRules;