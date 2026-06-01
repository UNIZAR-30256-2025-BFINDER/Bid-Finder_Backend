const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const createUsuariosRepository = require("../../app_server/repositories/usuariosRepository");
const Usuario = require("../../app_server/models/usuario");
const Comentario = require("../../app_server/models/comentario");

let mongoServer;
let repository;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = createUsuariosRepository();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Usuario.deleteMany({});
});

describe("Usuarios Repository - Favoritos", () => {
    let mockUser;
    let mockLoteId;

    beforeEach(async () => {
        mockLoteId = "BOE-TEST-1__L1";

        mockUser = await Usuario.create({
            nombre: "Test",
            email: "test@test.com",
            password: "password123",
            favoritos: [],
        });
    });

    it("debe añadir un favorito", async () => {
        const result = await repository.addFavorito(
            mockUser._id,
            mockLoteId,
        );

        expect(result.favoritos).toHaveLength(1);
        expect(result.favoritos[0]).toBe("BOE-TEST-1__L1");
    });

    it("no debe añadir duplicados ($addToSet)", async () => {
        await repository.addFavorito(mockUser._id, mockLoteId);
        const result = await repository.addFavorito(
            mockUser._id,
            mockLoteId,
        );

        expect(result.favoritos).toHaveLength(1);
    });

    it("debe eliminar un favorito ($pull)", async () => {
        await repository.addFavorito(mockUser._id, mockLoteId);
        const result = await repository.removeFavorito(
            mockUser._id,
            mockLoteId,
        );

        expect(result.favoritos).toHaveLength(0);
    });

    it("debe obtener los favoritos", async () => {
        await repository.addFavorito(mockUser._id, mockLoteId);

        const result = await repository.getFavoritos(mockUser._id);

        expect(result.favoritos).toHaveLength(1);
        expect(result.favoritos[0]).toBe("BOE-TEST-1__L1");
    });
});

describe("Usuarios Repository - findAll", () => {
    let usuario1, usuario2, usuario3, admin1;

    beforeEach(async () => {
        // Crear usuarios con diferentes datos
        usuario1 = await Usuario.create({
            nombre: "Ana López",
            email: "ana@test.com",
            password: "password",
            rol: "user",
        });
        usuario2 = await Usuario.create({
            nombre: "Carlos Ruiz",
            email: "carlos@test.com",
            password: "password",
            rol: "user",
        });
        usuario3 = await Usuario.create({
            nombre: "María Pérez",
            email: "maria@test.com",
            password: "password",
            rol: "user",
        });
        admin1 = await Usuario.create({
            nombre: "Admin User",
            email: "admin@test.com",
            password: "password",
            rol: "admin",
        });

        // Crear comentarios para probar numComentarios
        await Comentario.create([
            {
                subasta_id: "S1",
                usuario_id: usuario1._id,
                texto: "Comentario 1",
            },
            {
                subasta_id: "S2",
                usuario_id: usuario1._id,
                texto: "Comentario 2",
            },
            {
                subasta_id: "S3",
                usuario_id: usuario2._id,
                texto: "Comentario de Carlos",
            },
        ]);

        // Añadir favoritos a usuario1, usuario3 y admin1 como strings
        await Usuario.updateOne(
            { _id: usuario1._id },
            { $addToSet: { favoritos: "BOE-TEST-1__L1" } },
        );
        await Usuario.updateOne(
            { _id: usuario1._id },
            { $addToSet: { favoritos: "BOE-TEST-2__L1" } },
        );
        await Usuario.updateOne(
            { _id: usuario3._id },
            { $addToSet: { favoritos: "BOE-TEST-1__L1" } },
        );
        await Usuario.updateOne(
            { _id: admin1._id },
            { $addToSet: { favoritos: "BOE-TEST-1__L1" } },
        );
    });

    it("devuelve usuarios paginados correctamente sin búsqueda", async () => {
        const result1 = await repository.findAll(0, 2);
        expect(result1.usuarios).toHaveLength(2);
        expect(result1.total).toBe(4); // sin filtro, total de usuarios creados
        expect(result1.totalAdmins).toBe(1); // solo admin1
        expect(result1.globalTotal).toBe(4);
        expect(result1.globalAdmins).toBe(1);

        const result2 = await repository.findAll(2, 2);
        expect(result2.usuarios).toHaveLength(2);
        expect(result2.total).toBe(4);
    });

    it("ordena los usuarios por createdAt descendente", async () => {
        const usuarioNuevo = await Usuario.create({
            nombre: "Nuevo",
            email: "nuevo@test.com",
            password: "password",
            rol: "user",
        });
        const result = await repository.findAll(0, 10);
        expect(result.usuarios[0]._id.toString()).toBe(
            usuarioNuevo._id.toString(),
        );
    });

    it("filtra por búsqueda en nombre (case insensitive)", async () => {
        const result = await repository.findAll(0, 10, "ana");
        expect(result.usuarios).toHaveLength(1);
        expect(result.usuarios[0].nombre).toBe("Ana López");
        expect(result.total).toBe(1);
        expect(result.totalAdmins).toBe(0);
        expect(result.globalTotal).toBe(4);
    });

    it("filtra por búsqueda en email", async () => {
        const result = await repository.findAll(0, 10, "carlos@test.com");
        expect(result.usuarios).toHaveLength(1);
        expect(result.usuarios[0].nombre).toBe("Carlos Ruiz");
        expect(result.total).toBe(1);
    });

    it("filtra con búsqueda parcial", async () => {
        const result = await repository.findAll(0, 10, "mar");
        expect(result.usuarios).toHaveLength(1);
        expect(result.usuarios[0].nombre).toBe("María Pérez");
    });

    it("filtra con búsqueda y devuelve los contadores filtrados correctos", async () => {
        const result = await repository.findAll(0, 10, "admin");
        expect(result.usuarios).toHaveLength(1);
        expect(result.totalAdmins).toBe(1);
        expect(result.total).toBe(1);
        expect(result.globalAdmins).toBe(1);
    });

    it("incluye numFavoritos y numComentarios calculados", async () => {
        const result = await repository.findAll(0, 10);
        const usuario1Encontrado = result.usuarios.find(
            (u) => u.nombre === "Ana López",
        );
        expect(usuario1Encontrado.numFavoritos).toBe(2);
        expect(usuario1Encontrado.numComentarios).toBe(2);

        const usuario2Encontrado = result.usuarios.find(
            (u) => u.nombre === "Carlos Ruiz",
        );
        expect(usuario2Encontrado.numFavoritos).toBe(0);
        expect(usuario2Encontrado.numComentarios).toBe(1);

        const usuario3Encontrado = result.usuarios.find(
            (u) => u.nombre === "María Pérez",
        );
        expect(usuario3Encontrado.numFavoritos).toBe(1);
        expect(usuario3Encontrado.numComentarios).toBe(0);
    });

    it("no devuelve campos sensibles (password, refreshToken, __v, favoritos array)", async () => {
        const result = await repository.findAll(0, 10);
        const user = result.usuarios[0];
        expect(user).not.toHaveProperty("password");
        expect(user).not.toHaveProperty("refreshToken");
        expect(user).not.toHaveProperty("__v");
        expect(user).not.toHaveProperty("favoritos");
        expect(user).toHaveProperty("numFavoritos");
    });

    it("funciona con búsqueda vacía o undefined", async () => {
        const result1 = await repository.findAll(0, 10, "");
        const result2 = await repository.findAll(0, 10, undefined);
        expect(result1.usuarios.length).toBe(4);
        expect(result2.usuarios.length).toBe(4);
        expect(result1.total).toBe(4);
        expect(result2.total).toBe(4);
    });
});
