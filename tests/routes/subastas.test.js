const request = require("supertest");
const app = require("../../app");

describe("GET /subastas/:id", () => {
    test("debe devolver 200 y la subasta si el id existe", async () => {
        const response = await request(app).get("/subastas/BOE-B-2026-112");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBe("BOE-B-2026-112");
        expect(response.body.data.titulo).toBeDefined();
        expect(response.body.data.fechaPublicacion).toBeDefined();
        expect(response.body.data.urlPdf).toBeDefined();
        expect(response.body.data.texto).toBeDefined();
    });

    test("debe devolver 404 si la subasta no existe", async () => {
        const response = await request(app).get("/subastas/BOE-B-0000-000");

        expect(response.status).toBe(404);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toBe("Subasta no encontrada");
        expect(response.body.error.status).toBe(404);
    });

    test("debe devolver 400 si el id es inválido", async () => {
        const response = await request(app).get("/subastas/abc");

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toBe(
            "ID debe ser un identificador que comience con 'BOE'",
        );
        expect(response.body.error.status).toBe(400);
    });
});
