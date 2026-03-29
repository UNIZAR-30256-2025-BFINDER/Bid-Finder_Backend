jest.mock("../../app_server/utils/logger", () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));

jest.mock("../../app_server/config/database", () => jest.fn().mockResolvedValue());

jest.mock("../../app_server/repositories/subastasRepository", () => {
    return jest.fn().mockImplementation(() => ({
        saveSubastas: jest.fn(),
        findPendingAI: jest.fn(),
        updateAIExtraction: jest.fn()
    }));
});

jest.mock("../../app_server/jobs/aiWorkerJob", () => ({
    runWorker: jest.fn().mockResolvedValue(0)
}));

let mockRunDailyIngestion = jest.fn();

jest.mock("../../app_server/controllers/ingestionController", () => {
    return () => ({
        runDailyIngestion: mockRunDailyIngestion,
    });
});

const { main } = require("../../app_server/jobs/boeIngestionJob");
const { runWorker } = require("../../app_server/jobs/aiWorkerJob"); 

describe("Cron job root - main function", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRunDailyIngestion.mockClear();
    });

    test("Día normal: debe llamar a runDailyIngestion, luego a runWorker y retornar 0", async () => {
        mockRunDailyIngestion.mockResolvedValue(true);
        const normalDate = new Date("2026-03-16"); 
        const result = await main(normalDate);

        expect(mockRunDailyIngestion).toHaveBeenCalled();
        expect(runWorker).toHaveBeenCalled(); 
        expect(result).toBe(0);
    });

    test("Domingo: no debe llamar a runDailyIngestion y retornar 0", async () => {
        const sundayDate = new Date("2026-03-22"); 
        const result = await main(sundayDate);

        expect(mockRunDailyIngestion).not.toHaveBeenCalled();
        expect(runWorker).not.toHaveBeenCalled(); 
        expect(result).toBe(0);
    });
});