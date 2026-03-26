/**
 * @fileoverview Reglas de negocio específicas para la extracción de Subastas.
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

const subastasRules = {
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
    
    mapFn: (documento) => {
        const metadatos = documento.metadatos || {};
        const textoLimpio = extraerTextoDesdeTextoNode(documento.texto);
        const rawXml = typeof documento.texto === 'object' ? JSON.stringify(documento.texto) : String(documento.texto);

        return {
            id: metadatos.identificador || "",
            titulo: metadatos.titulo || "Título no disponible",
            fechaPublicacion: metadatos.fecha_publicacion || "",
            urlPdf: metadatos.url_pdf || "",
            texto: textoLimpio,
            rawXml: rawXml
        };
    }
};

module.exports = subastasRules;