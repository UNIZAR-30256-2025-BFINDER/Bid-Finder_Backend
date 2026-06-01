const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Anuncio = require("../../app_server/models/anuncio");

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

describe("Anuncio Model", () => {
    it("debe crear un anuncio correctamente con los campos mínimos requeridos", async () => {
        const anuncioData = {
            id: "BOE-TEST-1",
            titulo: "Anuncio prueba",
            fechaPublicacion: "20260422",
            urlPdf: "https://example.com/test.pdf",
            texto: "Texto completo de la subasta",
            rawXml: "<anuncio>contenido</anuncio>",
        };
        const anuncio = new Anuncio(anuncioData);
        const saved = await anuncio.save();
        expect(saved._id).toBeDefined();
        expect(saved.id).toBe(anuncioData.id);
    });
});
