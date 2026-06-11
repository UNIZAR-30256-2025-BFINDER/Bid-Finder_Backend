/**
 * @fileoverview Reglas de negocio específicas para la extracción y filtrado de Subastas del BOE.
 * Respeta el principio de Responsabilidad Única (SRP) delegando tareas a extractores y mapeadores especializados.
 */

const { BOE } = require('./constants');

/**
 * Helper para extraer y limpiar textos de nodos de párrafo XML.
 */
const XmlTextHelper = {
    extraerTextoDesdeTextoNode(textoNode) {
        if (!textoNode) return "";
        let parrafos = textoNode.p;
        if (!parrafos) return "";
        const arrayParrafos = Array.isArray(parrafos) ? parrafos : [parrafos];
        return arrayParrafos
            .map((p) => p["#text"] || "")
            .filter((text) => text.trim() !== "")
            .join("\n");
    }
};

/**
 * Componente especializado en evaluar y extraer ítems desde el sumario diario del BOE.
 */
const SumarioExtractor = {
    /**
     * Evalúa si un ítem del BOE corresponde a una subasta válida basándose en su jerarquía.
     */
    filterCondition(seccion, departamento, epigrafe, item) {
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
     * Estrategia de recorrido para extraer identificadores y URLs a partir del sumario diario del BOE.
     */
    extractSumarioStrategy(jsonObj) {
        const itemsEncontrados = [];
        const idsVistos = new Set();
        const diario = jsonObj.response?.data?.sumario?.diario;
        if (!diario || !diario.seccion) return itemsEncontrados;

        const addItem = (item) => {
            if (!idsVistos.has(item.identificador)) {
                idsVistos.add(item.identificador);
                itemsEncontrados.push({ id: item.identificador, titulo: item.titulo, urlXml: item.url_xml });
            }
        };

        diario.seccion.forEach((seccion) => {
            if (!seccion.departamento) return;
            seccion.departamento.forEach((departamento) => {
                if (departamento.item) {
                    departamento.item.forEach((item) => {
                        if (this.filterCondition(seccion, departamento, null, item)) {
                            addItem(item);
                        }
                    });
                }
                if (departamento.epigrafe) {
                    departamento.epigrafe.forEach((epigrafe) => {
                        if (epigrafe.item) {
                            epigrafe.item.forEach((item) => {
                                if (this.filterCondition(seccion, departamento, epigrafe, item)) {
                                    addItem(item);
                                }
                            });
                        }
                    });
                }
            });
        });
        return itemsEncontrados;
    }
};

/**
 * Componente especializado en mapear y transformar datos de anuncios individuales del BOE.
 */
const AnuncioMapper = {
    /**
     * Transforma un documento XML crudo en un objeto preliminar de Subasta.
     * Aplica filtros de descarte rápido (ej. enlaces huérfanos o vehículos).
     */
    mapFn(documento) {
        const metadatos = documento.metadatos || {};
        const textoLimpio = XmlTextHelper.extraerTextoDesdeTextoNode(documento.texto);
        const textoMayus = textoLimpio.toUpperCase();
        
        const esEnlace = textoMayus.includes(BOE.SUBASTAS_URL) && textoLimpio.length < BOE.ENLACE_MAX_LENGTH;

        if (esEnlace) {
            return null; 
        }

        const rawXml = typeof documento.texto === 'object' ? JSON.stringify(documento.texto) : String(documento.texto);

        // Extraemos información adicional del nodo <departamento> si está presente
        const departamentoNombre = metadatos.departamento && typeof metadatos.departamento === 'string'
            ? metadatos.departamento.trim()
            : (metadatos.departamento && metadatos.departamento['#text']) ? metadatos.departamento['#text'].trim() : null;
        const departamentoCodigo = metadatos.departamento && metadatos.departamento['@_codigo']
            ? metadatos.departamento['@_codigo']
            : null;

        return {
            id: metadatos.identificador || "",
            titulo: metadatos.titulo || "Título no disponible",
            fechaPublicacion: metadatos.fecha_publicacion || "",
            urlPdf: metadatos.url_pdf || "",
            texto: textoLimpio,
            rawXml: rawXml,
            departamento: departamentoNombre,
            departamentoCodigo: departamentoCodigo,
        };
    },

    /**
     * Estrategia para extraer y validar los detalles de un anuncio individual.
     */
    extractAnuncioStrategy(jsonObj) {
        const documento = jsonObj.documento;
        if (!documento) throw new Error("El XML proporcionado no tiene la etiqueta raíz <documento>.");
        if (!documento.metadatos || !documento.metadatos.identificador) throw new Error("No se ha encontrado el identificador único.");
        return this.mapFn(documento);
    }
};

/**
 * Fachada para mantener la compatibilidad hacia atrás con el resto de la aplicación.
 */
const subastasRules = {
    filterCondition: (seccion, departamento, epigrafe, item) => 
        SumarioExtractor.filterCondition(seccion, departamento, epigrafe, item),
        
    mapFn: (documento) => 
        AnuncioMapper.mapFn(documento),
        
    extractSumarioStrategy: (jsonObj) => 
        SumarioExtractor.extractSumarioStrategy(jsonObj),
        
    extractAnuncioStrategy: (jsonObj) => 
        AnuncioMapper.extractAnuncioStrategy(jsonObj)
};

module.exports = subastasRules;