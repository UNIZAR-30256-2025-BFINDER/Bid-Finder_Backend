/**
 * @fileoverview Motor de parseo XML agnóstico (General-purpose XML Parser).
 * Convierte los documentos en bruto del BOE en estructuras JSON navegables.
 * No contiene lógica de negocio; utiliza el patrón Strategy para inyectar reglas de filtrado.
 */

const { XMLParser } = require("fast-xml-parser");

/**
 * Configuración del analizador sintáctico.
 * Fuerza a que elementos repetitivos se parseen como arrays incluso si solo hay uno,
 * evitando errores de "undefined is not iterable" en pasos posteriores.
 */
const parserConfig = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["seccion", "departamento", "epigrafe", "item", "p"].indexOf(name) !== -1,
};

const parser = new XMLParser(parserConfig);

/**
 * Convierte un documento XML en JSON y le aplica una estrategia de extracción concreta.
 * @param {string} xmlString - El código fuente XML crudo (buffer o string).
 * @param {Function} strategyFn - Función de orden superior que determina qué datos extraer del JSON.
 * @returns {any} El resultado procesado y devuelto por la estrategia inyectada.
 */
function processXml(xmlString, strategyFn) {
    const jsonObj = parser.parse(xmlString);
    return strategyFn(jsonObj);
}

module.exports = {
    processXml
};