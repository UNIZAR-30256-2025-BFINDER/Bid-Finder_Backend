const request = require("supertest");

jest.mock("../../app_server/services/subastasService", () => {
    return () => ({
        getAllSubastas: jest.fn().mockResolvedValue([
            { id: "BOE-B-2026-112", titulo: "Subasta Test" }
        ]),
        getSubastaById: jest.fn((id) => {
            if (id === "BOE-B-2026-112") {
                return Promise.resolve({
                    id: "BOE-B-2026-112",
                    titulo: "U.R. SUBASTAS ANDALUCIA 41",
                    fechaPublicacion: "20260103",
                    urlPdf: "/test.pdf",
                    texto: "Texto de prueba"
                });
            }
            return Promise.resolve(null);
        }),
        purgePastSubastas: jest.fn().mockResolvedValue(10)
    });
});

const app = require("../../app");

describe("GET /api/v1/subastas/:id", () => {
    test("debe devolver 200 y la subasta si el id existe", async () => {
        const response = await request(app).get("/api/v1/subastas/BOE-B-2026-112");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.id).toBe("BOE-B-2026-112");
    });

    test("debe devolver 404 si la subasta no existe", async () => {
        const response = await request(app).get("/api/v1/subastas/BOE-B-0000-000");
        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe("Subasta no encontrada");
    });

    test("debe devolver 400 si el id es inválido", async () => {
        const response = await request(app).get("/api/v1/subastas/abc");
        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("identificador que comience con 'BOE'");
    });
});

describe("DELETE /api/v1/subastas/purge-past", () => {
    test("debe devolver 200 y el conteo de subastas purgadas", async () => {
        const response = await request(app).delete("/api/v1/subastas/purge-past");
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.purgadas).toBe(10);
    });
});