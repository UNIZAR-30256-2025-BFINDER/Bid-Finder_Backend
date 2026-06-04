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
                id: "BOE-FILTRO-1__L1",
                anuncio_id: "BOE-FILTRO-1",
                estado_ia: "PROCESADO",
                fechaPublicacion: "20260101",
                titulo: "Prueba 1",
                urlPdf: "/1.pdf",
                texto: "Prueba",
                rawXml: "<x/>",
                numero_lote: 1,
                total_lotes: 1,
                all_lotes: [{ numero_lote: 1, titulo_resumido: "Local comercial", precio_salida: 100000 }],
                titulo_resumido: "Local comercial", 
                zona: "Madrid",
                precio_salida: 100000, 
                nivel_oportunidad: "ALTO",
                viabilidad: "ALTA",
                categoria: "INMUEBLE"
            },
            {
                id: "BOE-FILTRO-2__L1",
                anuncio_id: "BOE-FILTRO-2",
                estado_ia: "PROCESADO",
                fechaPublicacion: "20260102",
                titulo: "Prueba 2",
                urlPdf: "/2.pdf",
                texto: "Prueba",
                rawXml: "<x/>",
                numero_lote: 1,
                total_lotes: 1,
                all_lotes: [{ numero_lote: 1, titulo_resumido: "Garaje", precio_salida: 50000 }],
                resumen: "vehículo alta gama",
                direccion: "Calle, madrid", 
                precio_salida: 50000, 
                nivel_oportunidad: "MEDIO",
                viabilidad: "MEDIA",
                categoria: "VEHICULO"
            },
            {
                id: "BOE-FILTRO-3__L1",
                anuncio_id: "BOE-FILTRO-3",
                estado_ia: "PROCESADO",
                fechaPublicacion: "20260103",
                titulo: "Prueba 3",
                urlPdf: "/3.pdf",
                texto: "Finca rústica",
                rawXml: "<x/>",
                numero_lote: 1,
                total_lotes: 1,
                all_lotes: [{ numero_lote: 1, titulo_resumido: "Finca", precio_salida: 200000 }],
                zona: "Valencia", 
                precio_salida: 200000, 
                nivel_oportunidad: "BAJO",
                viabilidad: "BAJA",
                categoria: "OTROS"
            },
            {
                id: "BOE-FILTRO-4",
                estado_ia: "PENDIENTE",
                titulo: "Prueba 4",
                urlPdf: "/4.pdf", 
                texto: "Prueba 4",
                rawXml: "<x/>",
                fechaPublicacion: "20260104",
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

    it("debe filtrar por nivel de oportunidad exacto (mapeado a viabilidad)", async () => {
        const resultsMedio = await subastasRepository.findAll({ nivel_oportunidad: "MEDIO" });
        expect(resultsMedio.length).toBe(1);
        expect(resultsMedio[0].viabilidad).toBe("MEDIA");
    });

    it("debe encontrar una subasta por ID compuesto", async () => {
        const subasta = await subastasRepository.findById("BOE-FILTRO-1__L1");
        expect(subasta).not.toBeNull();
        expect(subasta.id).toBe("BOE-FILTRO-1__L1");
        expect(subasta.titulo_resumido).toBe("Local comercial");
    });
    
    it("debe encontrar anuncios pendientes de IA con límite", async () => {
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
            { 
                id: "BOE-AG-1",
                anuncio_id: "BOE-AG-1",
                estado_ia: "PROCESADO",
                fechaPublicacion: "20260101",
                titulo: "A",
                urlPdf: "/1",
                texto: "txt",
                rawXml: "<x/>",
                numero_lote: 1,
                total_lotes: 1,
                categoria: "INMUEBLE",
                zona: "Madrid"
            },
            { 
                id: "BOE-AG-2__L1",
                anuncio_id: "BOE-AG-2",
                estado_ia: "PROCESADO",
                fechaPublicacion: "20260101",
                titulo: "A",
                urlPdf: "/1",
                texto: "txt",
                rawXml: "<x/>",
                numero_lote: 1,
                total_lotes: 1,
                categoria: "INMUEBLE",
                zona: "Madrid"
            },
            { 
                id: "BOE-AG-3__L1",
                anuncio_id: "BOE-AG-3",
                estado_ia: "PROCESADO",
                fechaPublicacion: "20260101",
                titulo: "A",
                urlPdf: "/1",
                texto: "txt",
                rawXml: "<x/>",
                numero_lote: 1,
                total_lotes: 1,
                categoria: "VEHICULO",
                zona: "Zaragoza"
            },
            {
                id: "BOE-AG-3", // Pending document to test updateAIExtraction
                estado_ia: "PENDIENTE",
                fechaPublicacion: "20260101",
                titulo: "A",
                urlPdf: "/1",
                texto: "txt",
                rawXml: "<x/>"
            }
        ]);
    });

    it("debe guardar múltiples anuncios con bulkWrite (saveSubastas)", async () => {
        const nuevosAnuncios = [
            { id: "BOE-AG-1", titulo: "Actualizado" }, 
            { id: "BOE-AG-4", titulo: "Nueva", fechaPublicacion: "2026-06-01", urlPdf: "/x", texto: "txt", rawXml: "<x/>", estado_ia: "PENDIENTE" } 
        ];

        const stats = await subastasRepository.saveSubastas(nuevosAnuncios);
        expect(stats.upserted).toBe(1);
        expect(stats.modified).toBe(1);
        expect(stats.matched).toBe(1);

        const saved = await Subasta.findOne({ id: "BOE-AG-4" });
        expect(saved.fechaFinalizacion).toBeDefined();
        // check that 20 days were added (2026-06-01 + 20 days = 2026-06-21)
        expect(saved.fechaFinalizacion.toISOString()).toContain("2026-06-21");
    });

    it("debe actualizar datos de extracción IA y propagar fechaFinalizacion", async () => {
        // First save with date
        await Subasta.create({
            id: "BOE-AG-5-TEST",
            estado_ia: "PENDIENTE",
            fechaPublicacion: "2026-06-01",
            titulo: "A",
            urlPdf: "/1",
            texto: "txt",
            rawXml: "<x/>",
            fechaFinalizacion: new Date("2026-06-25T00:00:00.000Z")
        });

        const updated = await subastasRepository.updateAIExtraction("BOE-AG-5-TEST", [{ numero_lote: 1, valor_tasacion: 5000, categoria: "VEHICULO" }], "PROCESADO");
        expect(updated.valor_tasacion).toBe(5000);
        expect(updated.estado_ia).toBe("PROCESADO");
        expect(updated.fechaFinalizacion.toISOString()).toBe("2026-06-25T00:00:00.000Z");
    });

    it("debe purgar las subastas cuya fecha de finalización ya ha pasado", async () => {
        await Subasta.create([
            {
                id: "BOE-EXPIRADA-1",
                estado_ia: "PROCESADO",
                fechaPublicacion: "2026-01-01",
                fechaFinalizacion: new Date("2026-05-01"),
                titulo: "Expirada 1",
                urlPdf: "/exp1.pdf",
                texto: "prueba",
                rawXml: "<x/>"
            },
            {
                id: "BOE-FUTURA-1",
                estado_ia: "PROCESADO",
                fechaPublicacion: "2026-06-01",
                fechaFinalizacion: new Date("2026-07-01"),
                titulo: "Futura 1",
                urlPdf: "/fut1.pdf",
                texto: "prueba",
                rawXml: "<x/>"
            }
        ]);

        const cutOffDate = new Date("2026-06-15");
        const count = await subastasRepository.purgePastSubastas(cutOffDate);
        expect(count).toBe(1);

        const exp = await Subasta.findOne({ id: "BOE-EXPIRADA-1" });
        expect(exp).toBeNull();

        const fut = await Subasta.findOne({ id: "BOE-FUTURA-1" });
        expect(fut).not.toBeNull();
    });

    it("debe agrupar estadísticas por categoría", async () => {
        const stats = await subastasRepository.aggregateByCategoria();
        expect(stats.length).toBe(2);
        const inmuebles = stats.find(s => s.categoria === "INMUEBLE");
        expect(inmuebles.total).toBe(2);
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