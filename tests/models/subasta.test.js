const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Subasta = require("../../app_server/models/subasta");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Subasta Model", () => {
    it("debe crear una subasta correctamente con los campos mínimos requeridos", async () => {
        const subastaData = {
            id: "BOE-TEST-1__L1",
            anuncio_id: "BOE-TEST-1",
            titulo: "Anuncio prueba",
            fechaPublicacion: "20260422",
            urlPdf: "https://example.com/test.pdf",
            texto: "Texto completo de la subasta",
            rawXml: "<anuncio>contenido</anuncio>",
        };
        const subasta = new Subasta(subastaData);
        const saved = await subasta.save();
        expect(saved._id).toBeDefined();
        expect(saved.id).toBe(subastaData.id);
    });
});
