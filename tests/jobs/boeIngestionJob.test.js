jest.mock("../../app_server/utils/logger", () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

jest.mock("../../app_server/config/database", () => jest.fn().mockResolvedValue());

jest.mock("../../app_server/services/subastasPersistenceService", () => ({
    saveSubastas: jest.fn()
}));

let mockRunDailyIngestion = jest.fn();

jest.mock("../../app_server/controllers/ingestionController", () => {
    return () => ({
        runDailyIngestion: mockRunDailyIngestion,
    });
});

const { main } = require("../../app_server/jobs/boeIngestionJob");

describe("Cron job root - main function", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRunDailyIngestion.mockClear();
    });

    test("Día normal: debe llamar a runDailyIngestion y retornar 0", async () => {
        mockRunDailyIngestion.mockResolvedValue(true);
        const normalDate = new Date("2026-03-16"); // lunes
        const result = await main(normalDate);

        expect(mockRunDailyIngestion).toHaveBeenCalled();
        expect(result).toBe(0);
    });

    test("Domingo: no debe llamar a runDailyIngestion y retornar 0", async () => {
        const sundayDate = new Date("2026-03-22"); // domingo
        const result = await main(sundayDate);

        expect(mockRunDailyIngestion).not.toHaveBeenCalled();
        expect(result).toBe(0);
    });
});