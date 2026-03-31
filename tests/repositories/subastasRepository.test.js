const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const createSubastasRepository = require("../../app_server/repositories/subastasRepository");
const Subasta = require("../../app_server/models/subasta");

let mongoServer;
let subastasRepository;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    subastasRepository = createSubastasRepository();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Subasta.deleteMany({});
});

describe("subastasRepository - saveSubastas", () => {
    const subasta1 = {
        id: "BOE-B-2026-112",
        titulo: "U.R. SUBASTAS ANDALUCIA 41",
        fechaPublicacion: "20260103",
        urlPdf: "/boe/dias/2026/01/03/pdfs/BOE-B-2026-112.pdf",
        texto: "Texto de prueba",
        rawXml: "<documento>...</documento>",
        estado_ia: "PENDIENTE" 
    };

    const subasta2 = {
        id: "BOE-B-2026-113",
        titulo: "Otra subasta",
        fechaPublicacion: "20260104",
        urlPdf: "/boe/dias/2026/01/04/pdfs/BOE-B-2026-113.pdf",
        texto: "Otro texto",
        rawXml: "<documento>...</documento>",
        estado_ia: "PENDIENTE"
    };

    it("debe insertar nuevas subastas", async () => {
        const result = await subastasRepository.saveSubastas([subasta1, subasta2]);
        expect(result.upserted).toBe(2);
        expect(result.modified).toBe(0);
        expect(result.matched).toBe(0);

        const count = await Subasta.countDocuments();
        expect(count).toBe(2);
    });

    it("debe actualizar subastas existentes sin duplicar", async () => {
        await subastasRepository.saveSubastas([subasta1]);

        const subasta1Modificada = {
            ...subasta1,
            titulo: "Título modificado",
        };
        const result = await subastasRepository.saveSubastas([subasta1Modificada, subasta2]);

        expect(result.upserted).toBe(1); 
        expect(result.modified).toBe(1); 
        expect(result.matched).toBe(1); 

        const subastaGuardada = await Subasta.findOne({ id: subasta1.id });
        expect(subastaGuardada.titulo).toBe("Título modificado");
    });
});

describe("subastasRepository - updateAIExtraction", () => {
    it("debe persistir nivel_oportunidad y diferencia_porcentual_oportunidad", async () => {
        await Subasta.create({
            id: "BOE-B-2026-999",
            titulo: "Subasta oportunidad",
            fechaPublicacion: "20260105",
            urlPdf: "/boe/dias/2026/01/05/pdfs/BOE-B-2026-999.pdf",
            texto: "Texto de prueba",
            rawXml: "<documento>...</documento>",
            estado_ia: "PENDIENTE"
        });

        await subastasRepository.updateAIExtraction(
            "BOE-B-2026-999",
            {
                precio_salida: 100000,
                valor_tasacion: 150000,
                diferencia_porcentual_oportunidad: -33.33,
                nivel_oportunidad: "MEDIO"
            },
            "PROCESADO"
        );

        const subastaGuardada = await Subasta.findOne({ id: "BOE-B-2026-999" });

        expect(subastaGuardada.estado_ia).toBe("PROCESADO");
        expect(subastaGuardada.precio_salida).toBe(100000);
        expect(subastaGuardada.valor_tasacion).toBe(150000);
        expect(subastaGuardada.diferencia_porcentual_oportunidad).toBe(-33.33);
        expect(subastaGuardada.nivel_oportunidad).toBe("MEDIO");
    });
});