/**
 * @fileoverview Motor genérico de parseo XML.
 * No contiene lógica de negocio; utiliza funciones inyectadas (strategy) para filtrar y mapear.
 */

const { XMLParser } = require("fast-xml-parser");

const parserConfig = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["seccion", "departamento", "epigrafe", "item", "p"].indexOf(name) !== -1,
};

const parser = new XMLParser(parserConfig);

/**
 * Parsea un XML y delega la extracción/mapeo a una función externa.
 * @param {string} xmlString - El XML crudo.
 * @param {Function} strategyFn - La función que sabe cómo navegar el JSON resultante.
 */
function processXml(xmlString, strategyFn) {
    const jsonObj = parser.parse(xmlString);
    return strategyFn(jsonObj);
}

module.exports = {
    processXml
};