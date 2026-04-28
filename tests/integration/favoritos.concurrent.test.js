// ¡NO mockeamos authMiddleware! Usaremos autenticación real
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const Usuario = require("../../app_server/models/usuario");
const Subasta = require("../../app_server/models/subasta");

// Configurar la clave secreta para el entorno de prueba
process.env.JWT_SECRET = "testsecret";

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

    // Crear subasta de prueba con todos los campos requeridos
    const subastaData = {
        _id: new mongoose.Types.ObjectId(),
        id: "BOE-TEST-1",
        titulo: "Subasta concurrencia",
        precio_salida: 500,
        location: { type: "Point", coordinates: [-3.7, 40.4] },
        rawXml: "<anuncio>contenido xml</anuncio>",
        texto: "Texto completo de la subasta...",
        urlPdf: "https://www.boe.es/boe/dias/2026/04/22/pdfs/BOE-B-2026-12595.pdf",
        fechaPublicacion: "20260422",
        resumen: "Resumen de la subasta",
        direccion: "Dirección de prueba",
    };
    await Subasta.create(subastaData);
});

describe("Favoritos - Concurrencia y persistencia", () => {
    let token; // Token JWT
    let userId;
    let subastaId;

    beforeEach(async () => {
        // 1. Crear un usuario real en la BD
        const user = await Usuario.create({
            email: "test@test.com",
            password: "hashedpassword", // Si tu modelo espera bcrypt, pon un hash real o mockea el proceso
            nombre: "Test User",
        });
        userId = user._id.toString();

        // 2. Generar un token JWT válido con la misma clave que usa tu backend
        token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        // 3. Obtener el ID público de la subasta
        const subasta = await Subasta.findOne();
        subastaId = subasta.id;
    });

    it("Concurrencia: múltiples añadidos simultáneos no deben duplicar el favorito", async () => {
        const peticiones = Array(10)
            .fill()
            .map(() =>
                request(app)
                    .post(`/favoritos/${subastaId}`) // Ajusta el prefijo según tu app
                    .set("Authorization", `Bearer ${token}`),
            );

        const respuestas = await Promise.all(peticiones);
        const exitosas = respuestas.filter((r) => r.status === 200);
        expect(exitosas.length).toBe(10);

        const usuarioActualizado =
            await Usuario.findById(userId).populate("favoritos");
        expect(usuarioActualizado.favoritos.length).toBe(1);
    });

    it("Concurrencia: añadir y eliminar rápidamente no debe dejar estado inconsistente", async () => {
        // Añadir
        await request(app)
            .post(`/favoritos/${subastaId}`)
            .set("Authorization", `Bearer ${token}`);

        // Lanzar 5 eliminaciones simultáneas
        const deletes = Array(5)
            .fill()
            .map(() =>
                request(app)
                    .delete(`/favoritos/${subastaId}`)
                    .set("Authorization", `Bearer ${token}`),
            );
        await Promise.all(deletes);

        const usuario = await Usuario.findById(userId).populate("favoritos");
        expect(usuario.favoritos.length).toBe(0);
    });

    it("Persistencia tras reiniciar sesión: login → añadir → logout → login → lista contiene favorito", async () => {
        // Añadir favorito
        await request(app)
            .post(`/favoritos/${subastaId}`)
            .set("Authorization", `Bearer ${token}`);

        // Generar un nuevo token (simula nuevo login del mismo usuario)
        const nuevoToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        // Obtener favoritos con el nuevo token
        const response = await request(app)
            .get("/favoritos")
            .set("Authorization", `Bearer ${nuevoToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.favoritos.length).toBe(1);
        expect(response.body.data.favoritos[0].id).toBe(subastaId);
    });
});
