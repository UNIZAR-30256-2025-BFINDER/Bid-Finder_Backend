const { processXml } = require("../../app_server/services/xmlParserService");
const subastasRules = require("../../app_server/config/subastasRules");

describe("processXml (con extractAnuncioStrategy)", () => {
    
    const validXmlString = `
    <documento>
        <metadatos>
            <identificador>BOE-B-2026-999</identificador>
            <titulo>U.R. SUBASTAS MADRID</titulo>
            <fecha_publicacion>20260328</fecha_publicacion>
            <url_pdf>/boe/dias/2026/03/28/pdfs/BOE-B-2026-999.pdf</url_pdf>
        </metadatos>
        <texto>
            <p class="parrafo">Subasta de una vivienda urbana situada en la Calle Gran Vía, 1, Madrid.</p>
            <p class="parrafo">Referencia catastral: 1234567AB9999C0001DE.</p>
            <p class="parrafo">Valor de tasación: 200.000 euros.</p>
            <p class="parrafo">Este es un texto válido para simular una subasta real de inmueble que no será filtrada por nuestras reglas.</p>
        </texto>
    </documento>
    `;

    const expectedOutput = {
        id: "BOE-B-2026-999",
        titulo: "U.R. SUBASTAS MADRID",
        fechaPublicacion: 20260328, 
        urlPdf: "/boe/dias/2026/03/28/pdfs/BOE-B-2026-999.pdf",
        texto: "Subasta de una vivienda urbana situada en la Calle Gran Vía, 1, Madrid.\nReferencia catastral: 1234567AB9999C0001DE.\nValor de tasación: 200.000 euros.\nEste es un texto válido para simular una subasta real de inmueble que no será filtrada por nuestras reglas.",
        rawXml: expect.any(String),
        departamento: null,
        departamentoCodigo: null
    };

    it("1. Debería parsear un XML VÁLIDO de inmueble y aplicar el mapper", () => {
        const result = processXml(validXmlString, subastasRules.extractAnuncioStrategy);
        expect(result).toEqual(expectedOutput);
    });

    it("2. Debería devolver null (FILTRAR) si es un mero enlace a la Agencia Tributaria", () => {
        const xmlBasura = `
        <documento>
            <metadatos>
                <identificador>BOE-BASURA</identificador>
                <titulo>BASURA</titulo>
            </metadatos>
            <texto>
                <p class="parrafo">Anuncio corto. Dirección electrónica: https://subastas.boe.es/ds.php</p>
            </texto>
        </documento>`;
        
        const result = processXml(xmlBasura, subastasRules.extractAnuncioStrategy);
        expect(result).toBeNull(); 
    });

    it("3. Debería lanzar un error si falta el identificador en los metadatos", () => {
        const xmlSinId = "<documento><metadatos></metadatos></documento>";
        expect(() => processXml(xmlSinId, subastasRules.extractAnuncioStrategy)).toThrow(
            "No se ha encontrado el identificador único."
        );
    });

    it("4. Debería lanzar un error si falta la etiqueta raíz <documento>", () => {
        const xmlInvalido = "<otraRaiz></otraRaiz>";
        expect(() => processXml(xmlInvalido, subastasRules.extractAnuncioStrategy)).toThrow(
            "El XML proporcionado no tiene la etiqueta raíz <documento>."
        );
    });
});