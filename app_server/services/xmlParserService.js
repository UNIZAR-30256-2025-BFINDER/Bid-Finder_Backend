/**
 * @fileoverview Motor genérico de parseo XML.
 * No contiene lógica de negocio; utiliza funciones inyectadas (strategy) para filtrar y mapear.
 */

const { XMLParser } = require('fast-xml-parser');

const parserConfig = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Forzamos que estas etiquetas sean siempre arrays para facilitar la iteración
    isArray: (name) => ['seccion', 'departamento', 'epigrafe', 'item'].indexOf(name) !== -1
};

const parser = new XMLParser(parserConfig);

/**
 * Navega por el sumario del BOE y extrae los items que cumplen una condición.
 * * @param {string} sumarioXmlString - Contenido XML del sumario en crudo.
 * @param {Function} filterCondition - Función que evalúa si un item debe extraerse (devuelve boolean).
 * @returns {Array<Object>} Lista de items encontrados con su ID, título y URL.
 * @throws {Error} Si el parseo del XML estructural falla.
 */
function extractItems(sumarioXmlString, filterCondition) {
    try {
        const jsonObj = parser.parse(sumarioXmlString);
        const itemsEncontrados = [];

        const diario = jsonObj.response?.data?.sumario?.diario;
        if (!diario || !diario.seccion) return itemsEncontrados;

        diario.seccion.forEach(seccion => {
            if (!seccion.departamento) return;

            seccion.departamento.forEach(departamento => {
                // Extracción para items directos bajo departamento
                if (departamento.item) {
                    departamento.item.forEach(item => {
                        if (filterCondition(seccion, departamento, null, item)) {
                            if (!itemsEncontrados.find(i => i.id === item.identificador)) {
                                itemsEncontrados.push({
                                    id: item.identificador,
                                    titulo: item.titulo,
                                    urlXml: item.url_xml
                                });
                            }
                        }
                    });
                }

                // Extracción para items agrupados bajo epígrafes
                if (departamento.epigrafe) {
                    departamento.epigrafe.forEach(epigrafe => {
                        if (epigrafe.item) {
                            epigrafe.item.forEach(item => {
                                if (filterCondition(seccion, departamento, epigrafe, item)) {
                                    if (!itemsEncontrados.find(i => i.id === item.identificador)) {
                                        itemsEncontrados.push({
                                            id: item.identificador,
                                            titulo: item.titulo,
                                            urlXml: item.url_xml
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });

        return itemsEncontrados;
    } catch (error) {
        throw error;
    }
}

/**
 * Transforma un documento XML individual en un objeto JSON manejable.
 * * @param {string} xmlString - Contenido XML del anuncio individual.
 * @param {Function} mapFn - Función que define cómo mapear los datos estructurados.
 * @returns {Object} Objeto procesado y listo para ser persistido.
 * @throws {Error} Si el XML es inválido o no tiene la estructura mínima requerida.
 */
function parseAnuncioIndividual(xmlString, mapFn) {
    try {
        const jsonObj = parser.parse(xmlString);
        const documento = jsonObj.documento;
        
        if (!documento) {
            throw new Error("El XML proporcionado no tiene la etiqueta raíz <documento>.");
        }
        if (!documento.metadatos || !documento.metadatos.identificador) {
            throw new Error("No se ha encontrado el identificador único en los metadatos del XML.");
        }

        return mapFn(documento);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    extractItems,
    parseAnuncioIndividual
};