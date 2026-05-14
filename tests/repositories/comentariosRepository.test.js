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
            password: "password",
        });
    });

    describe("save", () => {
        it("debe guardar un comentario y devolverlo con el usuario populado", async () => {
            const comentarioData = {
                subasta_id: "BOE-TEST-123",
                usuario_id: mockUser._id,
                texto: "Un comentario muy útil",
            };

            const result = await comentariosRepository.save(comentarioData);

            expect(result._id).toBeDefined();
            expect(result.subasta_id).toBe("BOE-TEST-123");
            expect(result.texto).toBe("Un comentario muy útil");
            expect(result.usuario_id.nombre).toBe("Usuario Test");
        });
    });

    describe("findBySubastaId", () => {
        it("debe buscar comentarios por ID de subasta y ordenarlos por fecha", async () => {
            await Comentario.create([
                {
                    subasta_id: "BOE-TEST-123",
                    usuario_id: mockUser._id,
                    texto: "Comentario viejo",
                    createdAt: new Date("2026-01-01"),
                },
                {
                    subasta_id: "BOE-OTRA-999",
                    usuario_id: mockUser._id,
                    texto: "Otro",
                    createdAt: new Date("2026-01-02"),
                },
                {
                    subasta_id: "BOE-TEST-123",
                    usuario_id: mockUser._id,
                    texto: "Comentario nuevo",
                    createdAt: new Date("2026-01-03"),
                },
            ]);

            const results =
                await comentariosRepository.findBySubastaId("BOE-TEST-123");

            expect(results.length).toBe(2);
            expect(results[0].texto).toBe("Comentario nuevo");
            expect(results[1].texto).toBe("Comentario viejo");
            expect(results[0].usuario_id.nombre).toBe("Usuario Test");
        });
    });

    describe("findAll", () => {
        it("debe buscar todos los comentarios de forma paginada y devolver el total", async () => {
            await Comentario.create([
                {
                    subasta_id: "B1",
                    usuario_id: mockUser._id,
                    texto: "1",
                    createdAt: new Date("2026-01-01"),
                },
                {
                    subasta_id: "B2",
                    usuario_id: mockUser._id,
                    texto: "2",
                    createdAt: new Date("2026-01-02"),
                },
                {
                    subasta_id: "B3",
                    usuario_id: mockUser._id,
                    texto: "3",
                    createdAt: new Date("2026-01-03"),
                },
                {
                    subasta_id: "B4",
                    usuario_id: mockUser._id,
                    texto: "4",
                    createdAt: new Date("2026-01-04"),
                },
            ]);

            const result = await comentariosRepository.findAll(1, 2);

            expect(result.total).toBe(4);
            expect(result.comentarios.length).toBe(2);
            expect(result.comentarios[0].texto).toBe("3");
            expect(result.comentarios[1].texto).toBe("2");
            expect(result.comentarios[0].usuario_id.nombre).toBe(
                "Usuario Test",
            );
        });
    });

    describe("Búsqueda (search)", () => {
        let usuario2;

        beforeEach(async () => {
            usuario2 = await Usuario.create({
                nombre: "Otro Usuario",
                email: "otro@test.com",
                password: "password",
            });

            await Comentario.create([
                {
                    subasta_id: "S1",
                    usuario_id: mockUser._id,
                    texto: "Esto es urgente",
                    createdAt: new Date("2026-01-01"),
                },
                {
                    subasta_id: "S2",
                    usuario_id: mockUser._id,
                    texto: "No tan urgente",
                    createdAt: new Date("2026-01-02"),
                },
                {
                    subasta_id: "S3",
                    usuario_id: usuario2._id,
                    texto: "Comentario de otro",
                    createdAt: new Date("2026-01-03"),
                },
            ]);
        });

        it("debe filtrar comentarios por texto del comentario", async () => {
            const result = await comentariosRepository.findAll(
                0,
                10,
                "urgente",
            );
            expect(result.total).toBe(2);
            expect(result.comentarios[1].texto).toBe("Esto es urgente");
            expect(result.comentarios[0].texto).toBe("No tan urgente");
        });

        it("debe filtrar comentarios por nombre de usuario", async () => {
            const result = await comentariosRepository.findAll(
                0,
                10,
                "Otro Usuario",
            );
            expect(result.total).toBe(1);
            expect(result.comentarios[0].texto).toBe("Comentario de otro");
        });

        it("debe combinar paginación con búsqueda", async () => {
            for (let i = 0; i < 5; i++) {
                await Comentario.create({
                    subasta_id: "S",
                    usuario_id: mockUser._id,
                    texto: `texto ${i}`,
                    createdAt: new Date(),
                });
            }
            const result = await comentariosRepository.findAll(0, 3, "texto");
            // Ajusta el total según los que contengan "texto" en el setup inicial
            expect(result.comentarios.length).toBe(3);
        });

        it("debe devolver todos los comentarios si search es vacío o undefined", async () => {
            const result1 = await comentariosRepository.findAll(0, 10, "");
            const result2 = await comentariosRepository.findAll(
                0,
                10,
                undefined,
            );
            expect(result1.total).toBe(3);
            expect(result2.total).toBe(3);
        });
    });

    describe("findById y deleteById", () => {
        let comentarioId;

        beforeEach(async () => {
            const comentario = await Comentario.create({
                subasta_id: "BOE-TEST",
                usuario_id: mockUser._id,
                texto: "Para buscar",
            });
            comentarioId = comentario._id;
        });

        it("debe encontrar un comentario por su ID", async () => {
            const encontrado =
                await comentariosRepository.findById(comentarioId);
            expect(encontrado).not.toBeNull();
            expect(encontrado.texto).toBe("Para buscar");
        });

        it("debe devolver null si el ID no existe", async () => {
            const noExiste = await comentariosRepository.findById(
                new mongoose.Types.ObjectId(),
            );
            expect(noExiste).toBeNull();
        });

        it("debe eliminar un comentario por su ID", async () => {
            const eliminado =
                await comentariosRepository.deleteById(comentarioId);
            expect(eliminado._id.toString()).toBe(comentarioId.toString());
            const existe = await Comentario.findById(comentarioId);
            expect(existe).toBeNull();
        });
    });
});
