/**
 * @fileoverview Reglas de negocio específicas para la extracción de Subastas.
 * Aisla la lógica condicional del dominio 
 */

const { IA } = require('./constants');

const subastasRules = {
    /**
     * Evalúa si un nodo del XML corresponde a una subasta válida.
     * * @param {Object} seccion - Nodo sección actual.
     * @param {Object} departamento - Nodo departamento actual.
     * @param {Object|null} epigrafe - Nodo epígrafe actual (si existe).
     * @param {Object} item - Nodo item a evaluar.
     * @returns {boolean} True si es una subasta, false en caso contrario.
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
     * Formatea el documento crudo en un modelo de datos para la base de datos y la IA.
     * * @param {Object} documento - El documento XML ya parseado.
     * @returns {Object} Modelo de datos estructurado.
     */
    mapFn: (documento) => {
        const metadatos = documento.metadatos;
        const titulo = metadatos.titulo || "Título no disponible";
        const departamento = metadatos.departamento?.['#text'] || metadatos.departamento || "Departamento no especificado";
        const fechaPublicacion = metadatos.fecha_publicacion || null;

        // Se agrupa el contenido en texto plano/JSON unificado para la IA
        let textoBruto = "";
        if (documento.texto) {
            textoBruto = typeof documento.texto === 'object' 
                ? JSON.stringify(documento.texto) 
                : String(documento.texto);
        }

        return {
            id_boe: metadatos.identificador,
            titulo: titulo,
            departamento: departamento,
            fecha_boe: fechaPublicacion,
            datos_originales: textoBruto,
            estado_procesamiento_ia: IA.ESTADOS.PENDIENTE, 
            fecha_ingesta: new Date()
        };
    }
};

module.exports = subastasRules;