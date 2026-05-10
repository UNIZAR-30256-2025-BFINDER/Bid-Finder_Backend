const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const createUsuariosRepository = require("../../app_server/repositories/usuariosRepository");
const Usuario = require("../../app_server/models/usuario");
const Subasta = require("../../app_server/models/subasta");

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
    await Subasta.deleteMany({});
});

describe("Usuarios Repository", () => {
    let mockUser;
    let mockSubasta;

    beforeEach(async () => {
        // Usamos insertMany para la subasta para evitar posibles validaciones estrictas extras 
        // (como hicimos antes en el otro repositorio), pero para el usuario usamos create 
        // asegurándonos de cumplir todas las reglas del Schema.
        
        const subastas = await Subasta.collection.insertMany([{
            id: "BOE-TEST-1",
            titulo: "Subasta Test",
            precio_salida: 100,
            rawXml: "<x/>",
            texto: "texto",
            fechaPublicacion: "20260101",
            urlPdf: "/x"
        }]);
        
        mockSubasta = { _id: subastas.insertedIds["0"] };

        mockUser = await Usuario.create({
            nombre: "Test",
            email: "test@test.com",
            password: "password123", 
            favoritos: []
        });
    });

    it("debe añadir un favorito y devolver el usuario poblado", async () => {
        const result = await repository.addFavorito(mockUser._id, mockSubasta._id);
        
        expect(result.favoritos).toHaveLength(1);
        expect(result.favoritos[0].id).toBe("BOE-TEST-1"); 
    });

    it("no debe añadir duplicados ($addToSet)", async () => {
        await repository.addFavorito(mockUser._id, mockSubasta._id);
        const result = await repository.addFavorito(mockUser._id, mockSubasta._id);
        
        expect(result.favoritos).toHaveLength(1);
    });

    it("debe eliminar un favorito ($pull)", async () => {
        await repository.addFavorito(mockUser._id, mockSubasta._id);
        const result = await repository.removeFavorito(mockUser._id, mockSubasta._id);
        
        expect(result.favoritos).toHaveLength(0);
    });

    it("debe obtener los favoritos poblados", async () => {
        await repository.addFavorito(mockUser._id, mockSubasta._id);
        
        const result = await repository.getFavoritos(mockUser._id);
        
        expect(result.favoritos).toHaveLength(1);
        expect(result.favoritos[0].titulo).toBe("Subasta Test");
    });
});