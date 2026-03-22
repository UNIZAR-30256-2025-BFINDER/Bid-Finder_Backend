// tests/jobs/boeIngestionJob.test.js
const { main } = require("../../app_server/jobs/boeIngestionJob");

// Mock de logger
jest.mock("../../app_server/utils/logger", () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

// Variable para el mock de runDailyIngestion
var mockRunDailyIngestion;

// Mock del controlador
jest.mock("../../app_server/controllers/ingestionController", () => {
    mockRunDailyIngestion = jest.fn();
    return () => ({
        runDailyIngestion: mockRunDailyIngestion,
    });
});

describe("Cron job root - main function", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (mockRunDailyIngestion) mockRunDailyIngestion.mockClear();
    });

    test("Día normal: debe llamar a runDailyIngestion y retornar 0", async () => {
        mockRunDailyIngestion.mockResolvedValue();
        const normalDate = new Date("2026-03-16"); // lunes
        const result = await main(normalDate);

        expect(mockRunDailyIngestion).toHaveBeenCalledWith(normalDate);
        expect(result).toBe(0);
    });

    test("Domingo: no debe llamar a runDailyIngestion y retornar 0", async () => {
        const sundayDate = new Date("2026-03-22"); // domingo
        const result = await main(sundayDate);

        expect(mockRunDailyIngestion).not.toHaveBeenCalled();
        expect(result).toBe(0);
    });
});
