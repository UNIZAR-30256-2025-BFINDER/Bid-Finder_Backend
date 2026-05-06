const createSeedingController = require('../../app_server/controllers/seedingController');

describe('Seeding Controller', () => {
    let mockIngestionController;
    let mockLogger;

    beforeEach(() => {
        mockIngestionController = { runDailyIngestion: jest.fn() };
        mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    });

    it('debe iterar e intentar procesar todos los días solicitados', async () => {
        mockIngestionController.runDailyIngestion.mockResolvedValue(true);
        const controller = createSeedingController(mockIngestionController, mockLogger);
        
        await controller.runSeeding(2);
        
        expect(mockIngestionController.runDailyIngestion).toHaveBeenCalledTimes(2);
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Iniciando descarga histórica'));
    });

    it('debe saltar el día limpiamente si la ingesta lanza un 404', async () => {
        const error404 = new Error('Not found');
        error404.response = { status: 404 };
        mockIngestionController.runDailyIngestion.mockRejectedValue(error404);
        
        const controller = createSeedingController(mockIngestionController, mockLogger);
        
        await controller.runSeeding(1);
        
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Día sin publicación saltado'));
    });

    it('debe lanzar el error hacia arriba si es un fallo crítico distinto a 404', async () => {
        const errorCritico = new Error('Fallo de base de datos');
        errorCritico.response = { status: 500 };
        mockIngestionController.runDailyIngestion.mockRejectedValue(errorCritico);
        
        const controller = createSeedingController(mockIngestionController, mockLogger);
        
        await expect(controller.runSeeding(1)).rejects.toThrow('Fallo de base de datos');
    });
});