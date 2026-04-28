// tests/models/usuario.test.js
// Este test verifica que el campo favoritos en el modelo Usuario se pueda poblar correctamente con los datos de las subastas referenciadas.
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Usuario = require("../../app_server/models/usuario");
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

beforeEach(async () => {
    await Usuario.deleteMany({});
    await Subasta.deleteMany({});
});

describe("Usuario Model - populate favoritos", () => {
    it("debe devolver las subastas completas al hacer populate", async () => {
        // Crear una subasta de prueba con TODOS los campos obligatorios
        const subasta = await Subasta.create({
            id: "TEST-1",
            titulo: "Coche",
            precio_salida: 1000,
            location: { type: "Point", coordinates: [-3.7, 40.4] },
            rawXml: "<anuncio>...</anuncio>",
            texto: "Texto completo de la subasta",
            urlPdf: "https://example.com/boe.pdf",
            fechaPublicacion: "20260428",
            // Opcionales pero recomendables
            resumen: "Resumen de prueba",
            direccion: "Calle Falsa 123",
        });

        const usuario = await Usuario.create({
            email: "populate@test.com",
            nombre: "Populate Test",
            password: "hashedpassword",
            favoritos: [subasta._id],
        });

        const usuarioConPopulate = await Usuario.findById(usuario._id).populate(
            "favoritos",
        );
        expect(usuarioConPopulate.favoritos).toHaveLength(1);
        expect(usuarioConPopulate.favoritos[0].toObject()).toMatchObject({
            id: "TEST-1",
            titulo: "Coche",
            precio_salida: 1000,
        });
    });
});
