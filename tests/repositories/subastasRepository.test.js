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
        await Subasta.collection.insertMany([
            {
                id: "BOE-FILTRO-1", estado_ia: "PROCESADO", zona: "Madrid", titulo_resumido: "Local comercial", 
                fechaPublicacion: "20260101", titulo: "Prueba 1", urlPdf: "/1.pdf", texto: "Prueba", rawXml: "<x/>",
                precio_salida: 100000, nivel_oportunidad: "ALTO"
            },
            {
                id: "BOE-FILTRO-2", estado_ia: "PROCESADO", direccion: "Calle, madrid", resumen: "vehículo alta gama",
                fechaPublicacion: "20260102", titulo: "Prueba 2", urlPdf: "/2.pdf", texto: "Prueba", rawXml: "<x/>",
                precio_salida: 50000, nivel_oportunidad: "MEDIO"
            },
            {
                id: "BOE-FILTRO-3", estado_ia: "PROCESADO", zona: "Valencia", texto: "Finca rústica",
                fechaPublicacion: "20260103", titulo: "Prueba 3", urlPdf: "/3.pdf", rawXml: "<x/>",
                precio_salida: 200000, nivel_oportunidad: "BAJO"
            },
            {
                id: "BOE-FILTRO-4", estado_ia: "PENDIENTE", zona: "Madrid", titulo: "Prueba 4", urlPdf: "/4.pdf", 
                texto: "Prueba 4", rawXml: "<x/>", fechaPublicacion: "20260104", precio_salida: 150000
            }
        ]);
        await Subasta.ensureIndexes();
    });

    it("debe filtrar por precio mínimo y máximo", async () => {
        const resultsMin = await subastasRepository.findAll({ precio_min: 60000 });
        expect(resultsMin.length).toBe(2); 

        const resultsMax = await subastasRepository.findAll({ precio_max: 60000 });
        expect(resultsMax.length).toBe(1);

        const resultsRango = await subastasRepository.findAll({ precio_min: 60000, precio_max: 150000 });
        expect(resultsRango.length).toBe(1); 
    });

    it("debe filtrar por nivel de oportunidad inclusivo", async () => {
        const resultsMedio = await subastasRepository.findAll({ nivel_oportunidad: "MEDIO" });
        expect(resultsMedio.length).toBe(2);
        const niveles = resultsMedio.map(r => r.nivel_oportunidad);
        expect(niveles).toContain("ALTO");
        expect(niveles).toContain("MEDIO");
    });

    it("debe encontrar una subasta por ID", async () => {
        const subasta = await subastasRepository.findById("BOE-FILTRO-1");
        expect(subasta).not.toBeNull();
        expect(subasta.id).toBe("BOE-FILTRO-1");
    });
    
    it("debe encontrar subastas pendientes de IA con límite", async () => {
        const results = await subastasRepository.findPendingAI(5);
        expect(results.length).toBe(1);
        expect(results[0].estado_ia).toBe("PENDIENTE");
    });

    it("debe ignorar filtros de precio inválidos (letras) y niveles de oportunidad inexistentes", async () => {
        const results = await subastasRepository.findAll({
            precio_min: "esto_no_es_un_numero",
            precio_max: "tampoco_esto",
            nivel_oportunidad: "INVENTADO"
        });
        
        expect(results.length).toBe(3); 
    });
});

describe("subastasRepository - Operaciones Especiales y Agregaciones", () => {
    beforeEach(async () => {
        await Subasta.collection.insertMany([
            { id: "BOE-AG-1", estado_ia: "PROCESADO", categoria: "Piso", zona: "Madrid", fechaPublicacion: "20260101", titulo: "A", urlPdf: "/1", texto: "txt", rawXml: "<x/>" },
            { id: "BOE-AG-2", estado_ia: "PROCESADO", categoria: "Piso", zona: "Madrid", fechaPublicacion: "20260101", titulo: "A", urlPdf: "/1", texto: "txt", rawXml: "<x/>" },
            { id: "BOE-AG-3", estado_ia: "PROCESADO", categoria: "Coche", zona: "Zaragoza", fechaPublicacion: "20260101", titulo: "A", urlPdf: "/1", texto: "txt", rawXml: "<x/>" }
        ]);
    });

    it("debe guardar múltiples subastas con bulkWrite (saveSubastas)", async () => {
        const nuevasSubastas = [
            { id: "BOE-AG-1", titulo: "Actualizado" }, 
            { id: "BOE-AG-4", titulo: "Nueva", fechaPublicacion: "2026", urlPdf: "/x", texto: "txt", rawXml: "<x/>", estado_ia: "PENDIENTE" } 
        ];

        const stats = await subastasRepository.saveSubastas(nuevasSubastas);
        expect(stats.upserted).toBe(1);
        expect(stats.modified).toBe(1);
        expect(stats.matched).toBe(1);
    });

    it("debe actualizar datos de extracción IA", async () => {
        const updated = await subastasRepository.updateAIExtraction("BOE-AG-3", { valor_tasacion: 5000 }, "PROCESADO");
        expect(updated.valor_tasacion).toBe(5000);
        expect(updated.estado_ia).toBe("PROCESADO");
    });

    it("debe agrupar estadísticas por categoría", async () => {
        const stats = await subastasRepository.aggregateByCategoria();
        expect(stats.length).toBe(2);
        const pisos = stats.find(s => s.categoria === "Piso");
        expect(pisos.total).toBe(2);
    });

    it("debe agrupar estadísticas por provincia", async () => {
        const stats = await subastasRepository.aggregateByProvincia();
        expect(stats.length).toBe(2);
        const madrid = stats.find(s => s.provincia === "Madrid");
        expect(madrid.total).toBe(2);
    });

    it("debe obtener los System Stats generales", async () => {
        const stats = await subastasRepository.getSystemStats();
        expect(stats).toHaveProperty("ingresadasHoy");
        expect(stats).toHaveProperty("ultimaIngesta");
    });
});