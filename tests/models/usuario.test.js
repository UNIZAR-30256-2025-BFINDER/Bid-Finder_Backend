// tests/models/usuario.test.js
// Este test verifica que el campo favoritos en el modelo Usuario guarde los identificadores de lote correctamente.
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Usuario = require("../../app_server/models/usuario");

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
});

describe("Usuario Model - favoritos (IDs de lote)", () => {
    it("debe guardar y recuperar los IDs de lote favoritos como strings", async () => {
        const usuario = await Usuario.create({
            email: "favoritos@test.com",
            nombre: "Favoritos Test",
            password: "hashedpassword",
            favoritos: ["BOE-B-2026-112__L1", "BOE-B-2026-112__L2"],
        });

        const usuarioRecuperado = await Usuario.findById(usuario._id);
        expect(usuarioRecuperado.favoritos).toHaveLength(2);
        expect(usuarioRecuperado.favoritos).toContain("BOE-B-2026-112__L1");
        expect(usuarioRecuperado.favoritos).toContain("BOE-B-2026-112__L2");
    });
});
