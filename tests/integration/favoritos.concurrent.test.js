const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const Usuario = require("../../app_server/models/usuario");
const Subasta = require("../../app_server/models/subasta");

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
});

describe("Favoritos - Concurrencia y persistencia", () => {
    let token;
    let userId;
    let subastaId;

    beforeEach(async () => {
        subastaId = "BOE-TEST-1__L1";

        // 1. Crear la subasta ANTES de crear el usuario y el token
        await Subasta.create({
            id: subastaId,
            anuncio_id: "BOE-TEST-1",
            titulo: "Subasta concurrencia",
            rawXml: "<anuncio>contenido xml</anuncio>",
            texto: "Texto completo de la subasta...",
            urlPdf: "https://www.boe.es/boe/dias/2026/04/22/pdfs/BOE-B-2026-12595.pdf",
            fechaPublicacion: "20260422",
            estado_ia: "PROCESADO",
            numero_lote: 1,
            total_lotes: 1,
            all_lotes: [{ numero_lote: 1, titulo_resumido: "Lote 1", precio_salida: 500 }],
            titulo_resumido: "Lote 1",
            resumen: "Resumen de la subasta",
            direccion: "Dirección de prueba",
            precio_salida: 500,
            location: { type: "Point", coordinates: [-3.7, 40.4] },
        });

        // 2. Crear usuario y token
        const user = await Usuario.create({
            email: "test@test.com",
            password: "hashedpassword",
            nombre: "Test User",
        });
        userId = user._id.toString();

        token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
    });

    it("Concurrencia: múltiples añadidos simultáneos no deben duplicar el favorito", async () => {
        const peticiones = Array(10)
            .fill()
            .map(() =>
                request(app)
                    .post(`/api/v1/favoritos/${subastaId}`)
                    .set("Authorization", `Bearer ${token}`),
            );

        const respuestas = await Promise.all(peticiones);
        const exitosas = respuestas.filter((r) => r.status === 200);
        expect(exitosas.length).toBe(10);

        const usuarioActualizado = await Usuario.findById(userId);
        expect(usuarioActualizado.favoritos.length).toBe(1);
        expect(usuarioActualizado.favoritos[0]).toBe(subastaId);
    });

    it("Concurrencia: añadir y eliminar rápidamente no debe dejar estado inconsistente", async () => {
        await request(app)
            .post(`/api/v1/favoritos/${subastaId}`)
            .set("Authorization", `Bearer ${token}`);

        const deletes = Array(5)
            .fill()
            .map(() =>
                request(app)
                    .delete(`/api/v1/favoritos/${subastaId}`)
                    .set("Authorization", `Bearer ${token}`),
            );
        await Promise.all(deletes);

        const usuario = await Usuario.findById(userId);
        expect(usuario.favoritos.length).toBe(0);
    });

    it("Persistencia tras reiniciar sesión: login → añadir → logout → login → lista contiene favorito", async () => {
        await request(app)
            .post(`/api/v1/favoritos/${subastaId}`)
            .set("Authorization", `Bearer ${token}`);

        const nuevoToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        const response = await request(app)
            .get("/api/v1/favoritos")
            .set("Authorization", `Bearer ${nuevoToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.favoritos.length).toBe(1);
        // El endpoint devuelve objetos de subasta completos con campo "id" (string del BOE)
        expect(response.body.data.favoritos[0].id).toBe(subastaId);
    });
});