// tests/models/comentario.test.js
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Comentario = require("../../app_server/models/comentario");
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
    await Comentario.deleteMany({});
    await Usuario.deleteMany({});
});

describe("Comentario Model", () => {
    let usuarioId;

    beforeEach(async () => {
        // Crear un usuario válido para poder referenciarlo
        const usuario = await Usuario.create({
            nombre: "Test User",
            email: "test@test.com",
            password: "password123",
        });
        usuarioId = usuario._id;
    });

    it("debe crear un comentario correctamente con los campos obligatorios", async () => {
        const comentarioData = {
            subasta_id: "BOE-TEST-123",
            usuario_id: usuarioId,
            texto: "Este es un comentario de prueba",
        };
        const comentario = new Comentario(comentarioData);
        const saved = await comentario.save();

        expect(saved._id).toBeDefined();
        expect(saved.subasta_id).toBe(comentarioData.subasta_id);
        expect(saved.usuario_id.toString()).toBe(usuarioId.toString());
        expect(saved.texto).toBe(comentarioData.texto);
        expect(saved.createdAt).toBeDefined();
        expect(saved.updatedAt).toBeDefined();
    });

    it("debe fallar si falta un campo obligatorio (subasta_id)", async () => {
        const comentario = new Comentario({
            usuario_id: usuarioId,
            texto: "Falta subasta_id",
        });
        await expect(comentario.save()).rejects.toThrow(
            /El ID de la subasta es obligatorio/,
        );
    });

    it("debe fallar si el texto excede los 1000 caracteres", async () => {
        const textoLargo = "a".repeat(1001);
        const comentario = new Comentario({
            subasta_id: "BOE-TEST-123",
            usuario_id: usuarioId,
            texto: textoLargo,
        });
        await expect(comentario.save()).rejects.toThrow(
            /El comentario no puede exceder los 1000 caracteres/,
        );
    });

    it("debe aplicar trim al texto", async () => {
        const comentario = new Comentario({
            subasta_id: "BOE-TEST-123",
            usuario_id: usuarioId,
            texto: "  texto con espacios  ",
        });
        const saved = await comentario.save();
        expect(saved.texto).toBe("texto con espacios");
    });
});
