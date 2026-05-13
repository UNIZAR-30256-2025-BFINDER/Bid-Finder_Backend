const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const createComentariosRepository = require("../../app_server/repositories/comentariosRepository");
const Comentario = require("../../app_server/models/comentario");
const Usuario = require("../../app_server/models/usuario");

let mongoServer;
let comentariosRepository;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    comentariosRepository = createComentariosRepository();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Comentario.deleteMany({});
    await Usuario.deleteMany({});
});

describe("Comentarios Repository", () => {
    let mockUser;

    beforeEach(async () => {
        mockUser = await Usuario.create({
            nombre: "Usuario Test",
            email: "test@test.com",
            password: "password"
        });
    });

    it("debe guardar un comentario y devolverlo con el usuario populado", async () => {
        const comentarioData = {
            subasta_id: "BOE-TEST-123",
            usuario_id: mockUser._id,
            texto: "Un comentario muy útil"
        };

        const result = await comentariosRepository.save(comentarioData);

        expect(result._id).toBeDefined();
        expect(result.subasta_id).toBe("BOE-TEST-123");
        expect(result.texto).toBe("Un comentario muy útil");
        expect(result.usuario_id.nombre).toBe("Usuario Test");
    });

    it("debe buscar comentarios por ID de subasta y ordenarlos por fecha", async () => {
        await Comentario.create([
            { subasta_id: "BOE-TEST-123", usuario_id: mockUser._id, texto: "Comentario viejo", createdAt: new Date('2026-01-01') },
            { subasta_id: "BOE-OTRA-999", usuario_id: mockUser._id, texto: "Otro", createdAt: new Date('2026-01-02') },
            { subasta_id: "BOE-TEST-123", usuario_id: mockUser._id, texto: "Comentario nuevo", createdAt: new Date('2026-01-03') }
        ]);

        const results = await comentariosRepository.findBySubastaId("BOE-TEST-123");

        expect(results.length).toBe(2);
        expect(results[0].texto).toBe("Comentario nuevo");
        expect(results[1].texto).toBe("Comentario viejo");
        expect(results[0].usuario_id.nombre).toBe("Usuario Test");
    });

    it("debe buscar todos los comentarios de forma paginada y devolver el total", async () => {
        await Comentario.create([
            { subasta_id: "B1", usuario_id: mockUser._id, texto: "1", createdAt: new Date('2026-01-01') },
            { subasta_id: "B2", usuario_id: mockUser._id, texto: "2", createdAt: new Date('2026-01-02') },
            { subasta_id: "B3", usuario_id: mockUser._id, texto: "3", createdAt: new Date('2026-01-03') },
            { subasta_id: "B4", usuario_id: mockUser._id, texto: "4", createdAt: new Date('2026-01-04') }
        ]);

        const result = await comentariosRepository.findAll(1, 2);

        expect(result.total).toBe(4);
        expect(result.comentarios.length).toBe(2);
        expect(result.comentarios[0].texto).toBe("3");
        expect(result.comentarios[1].texto).toBe("2");
        expect(result.comentarios[0].usuario_id.nombre).toBe("Usuario Test");
    });
});