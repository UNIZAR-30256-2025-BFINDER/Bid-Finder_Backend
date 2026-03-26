/**
 * @fileoverview Motor genérico de parseo XML.
 * No contiene lógica de negocio; utiliza funciones inyectadas (strategy) para filtrar y mapear.
 */

const { XMLParser } = require("fast-xml-parser");

const parserConfig = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["seccion", "departamento", "epigrafe", "item"].indexOf(name) !== -1,
};

const parser = new XMLParser(parserConfig);

function extractItems(sumarioXmlString, filterCondition) {
    const jsonObj = parser.parse(sumarioXmlString);
    const itemsEncontrados = [];

    const diario = jsonObj.response?.data?.sumario?.diario;
    if (!diario || !diario.seccion) return itemsEncontrados;

    diario.seccion.forEach((seccion) => {
        if (!seccion.departamento) return;

        seccion.departamento.forEach((departamento) => {
            if (departamento.item) {
                departamento.item.forEach((item) => {
                    if (filterCondition(seccion, departamento, null, item)) {
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
                            if (filterCondition(seccion, departamento, epigrafe, item)) {
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
}

function parseAnuncioIndividual(xmlString, mapFn) {
    const jsonObj = parser.parse(xmlString);
    const documento = jsonObj.documento;

    if (!documento) throw new Error("El XML proporcionado no tiene la etiqueta raíz <documento>.");
    if (!documento.metadatos || !documento.metadatos.identificador) throw new Error("No se ha encontrado el identificador único.");

    return mapFn(documento);
}

module.exports = {
    extractItems,
    parseAnuncioIndividual,
};