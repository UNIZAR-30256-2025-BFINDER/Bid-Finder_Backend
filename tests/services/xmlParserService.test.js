const fs = require("fs");
const path = require("path");
const {
    parseSubastaXml,
} = require("../../app_server/services/xmlParserService");

describe("parseSubastaXml", () => {
    const expectedOutput = {
        id: "BOE-B-2026-112",
        titulo: "U.R. SUBASTAS ANDALUCIA 41",
        fechaPublicacion: 20260103,
        urlPdf: "/boe/dias/2026/01/03/pdfs/BOE-B-2026-112.pdf",
        texto: `Anuncio de subasta administrativa de la Agencia Estatal de Administración Tributaria, con número de referencia S2025R4186001497.\nDirección electrónica: https://subastas.boe.es/ds.php?id=SUB-AT-2025-25R4186001497\nFecha de inicio de la subasta: La subasta se iniciará en la fecha indicada a través de la dirección electrónica anterior.\nSevilla, 29 de diciembre de 2025.- Jefe del Equipo Regional de Recaudación.`,
    };

    it("debería parsear el XML de ejemplo de subasta del BOE y devolver la estructura esperada", () => {
        const xmlPath = path.join(__dirname, "../utils/sample_subasta.xml");
        const xmlString = fs.readFileSync(xmlPath, "utf8");
        const result = parseSubastaXml(xmlString);
        expect(result).toEqual(expectedOutput);
    });

    it("debería lanzar un error si falta el identificador en los metadatos", () => {
        const xmlSinId = "<documento><metadatos></metadatos></documento>";
        expect(() => parseSubastaXml(xmlSinId)).toThrow(
            "No se ha encontrado el identificador único en los metadatos del XML.",
        );
    });

    it("debería lanzar un error si falta la etiqueta raíz <documento>", () => {
        const xmlInvalido = "<otraRaiz></otraRaiz>";
        expect(() => parseSubastaXml(xmlInvalido)).toThrow(
            "El XML proporcionado no tiene la etiqueta raíz <documento>.",
        );
    });
});
