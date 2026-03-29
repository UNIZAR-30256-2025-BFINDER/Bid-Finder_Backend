/**
 * @fileoverview Tests del pipeline diario completo.
 */

jest.mock("../../app_server/utils/logger", () => ({
    info:  jest.fn(),
    error: jest.fn(),
    warn:  jest.fn(),
}));

jest.mock("../../app_server/config/database", () => jest.fn().mockResolvedValue());

const mockRunIngestion = jest.fn().mockResolvedValue(0);
const mockRunWorker    = jest.fn().mockResolvedValue(0);

jest.mock("../../app_server/jobs/boeIngestionJob", () => ({
    runIngestion:         mockRunIngestion,
    isNoPublicationError: jest.requireActual("../../app_server/jobs/boeIngestionJob").isNoPublicationError,
    isNonPublicationDay:  jest.requireActual("../../app_server/jobs/boeIngestionJob").isNonPublicationDay,
}));

jest.mock("../../app_server/jobs/aiWorkerJob", () => ({
    runWorker: mockRunWorker,
}));

jest.mock("../../app_server/config/container", () => () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const { runDailyPipeline } = require("../../app_server/jobs/dailyPipelineJob");

describe("dailyPipelineJob — orquestación del pipeline diario", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("día normal: debe llamar a runIngestion, luego a runWorker y retornar 0", async () => {
        const normalDate = new Date("2026-03-16"); 
        const result = await runDailyPipeline(normalDate);

        expect(mockRunIngestion).toHaveBeenCalledTimes(1);
        expect(mockRunWorker).toHaveBeenCalledTimes(1);
        const ingestionOrder = mockRunIngestion.mock.invocationCallOrder[0];
        const workerOrder    = mockRunWorker.mock.invocationCallOrder[0];
        expect(ingestionOrder).toBeLessThan(workerOrder);
        expect(result).toBe(0);
    });

    test("si la ingesta lanza error de 'no publicación', retorna 0 sin llamar al worker", async () => {
        mockRunIngestion.mockRejectedValueOnce(
            Object.assign(new Error("No se encontró publicación"), { response: { status: 404 } })
        );

        const result = await runDailyPipeline(new Date("2026-03-16"));

        expect(mockRunWorker).not.toHaveBeenCalled();
        expect(result).toBe(0);
    });

    test("si la ingesta lanza un error crítico, retorna 1 sin llamar al worker", async () => {
        mockRunIngestion.mockRejectedValueOnce(new Error("Fallo de red inesperado"));

        const result = await runDailyPipeline(new Date("2026-03-16"));

        expect(mockRunWorker).not.toHaveBeenCalled();
        expect(result).toBe(1);
    });
});