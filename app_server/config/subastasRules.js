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

    extractAnuncioStrategy: (jsonObj) => {
        const documento = jsonObj.documento;
        if (!documento) throw new Error("El XML proporcionado no tiene la etiqueta raíz <documento>.");
        if (!documento.metadatos || !documento.metadatos.identificador) throw new Error("No se ha encontrado el identificador único.");
        return subastasRules.mapFn(documento);
    }
};

module.exports = subastasRules;