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

describe("subastasRepository - findAll con filtros", () => {
    beforeEach(async () => {
        await Subasta.create([
            {
                id: "BOE-FILTRO-1",
                estado_ia: "PROCESADO",
                zona: "Madrid",
                titulo_resumido: "Local comercial",
                fechaPublicacion: "20260101",
                titulo: "Título de prueba 1",
                urlPdf: "/ruta/prueba1.pdf",
                texto: "Texto de prueba 1",
                rawXml: "<xml>prueba 1</xml>"
            },
            {
                id: "BOE-FILTRO-2",
                estado_ia: "PROCESADO",
                direccion: "Calle Falsa 123, madrid",
                resumen: "Se subasta un vehículo de alta gama",
                fechaPublicacion: "20260102",
                titulo: "Título de prueba 2",
                urlPdf: "/ruta/prueba2.pdf",
                texto: "Texto de prueba 2",
                rawXml: "<xml>prueba 2</xml>"
            },
            {
                id: "BOE-FILTRO-3",
                estado_ia: "PROCESADO",
                zona: "Valencia",
                texto: "Finca rústica o inmueble",
                fechaPublicacion: "20260103",
                titulo: "Título de prueba 3",
                urlPdf: "/ruta/prueba3.pdf",
                rawXml: "<xml>prueba 3</xml>"
            },
            {
                id: "BOE-FILTRO-4",
                estado_ia: "PENDIENTE", 
                zona: "Madrid",
                titulo: "Título de prueba 4",
                urlPdf: "/ruta/prueba4.pdf",
                texto: "Texto de prueba 4",
                rawXml: "<xml>prueba 4</xml>",
                fechaPublicacion: "20260104"
            }
        ]);
    });

    it("debe devolver todas las PROCESADAS si no hay filtros", async () => {
        const results = await subastasRepository.findAll({});
        expect(results.length).toBe(3); 
    });

    it("debe filtrar por provincia buscando en zona o direccion (insensible a mayúsculas)", async () => {
        const results = await subastasRepository.findAll({ provincia: "madrid" });
        expect(results.length).toBe(2);
        const ids = results.map(r => r.id);
        expect(ids).toContain("BOE-FILTRO-1");
        expect(ids).toContain("BOE-FILTRO-2");
    });

    it("debe filtrar por categoria buscando en titulo, resumen o texto", async () => {
        const resultsVehiculo = await subastasRepository.findAll({ categoria: "vehículo" });
        expect(resultsVehiculo.length).toBe(1);
        expect(resultsVehiculo[0].id).toBe("BOE-FILTRO-2");

        const resultsInmueble = await subastasRepository.findAll({ categoria: "inmueble" });
        expect(resultsInmueble.length).toBe(1);
        expect(resultsInmueble[0].id).toBe("BOE-FILTRO-3");
    });

    it("debe combinar filtros de provincia y categoria correctamente", async () => {
        const results = await subastasRepository.findAll({ provincia: "madrid", categoria: "local" });
        expect(results.length).toBe(1);
        expect(results[0].id).toBe("BOE-FILTRO-1");
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