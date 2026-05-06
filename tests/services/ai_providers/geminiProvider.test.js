const createGeminiProvider = require('../../../app_server/services/ai_providers/geminiProvider');
const { GoogleGenerativeAI } = require("@google/generative-ai");

jest.mock("@google/generative-ai");

describe('Gemini Provider', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe inicializar el modelo y generar contenido JSON', async () => {
        const mockText = jest.fn().mockReturnValue('{"status":"success"}');
        const mockGenerateContent = jest.fn().mockResolvedValue({
            response: { text: mockText }
        });
        const mockGetGenerativeModel = jest.fn().mockReturnValue({
            generateContent: mockGenerateContent
        });
        
        GoogleGenerativeAI.mockImplementation(() => ({
            getGenerativeModel: mockGetGenerativeModel
        }));

        const provider = createGeminiProvider('fake_api_key');
        const result = await provider.generate('Dame los datos en JSON');

        expect(GoogleGenerativeAI).toHaveBeenCalledWith('fake_api_key');
        expect(mockGetGenerativeModel).toHaveBeenCalledWith({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1, 
            }
        });
        expect(mockGenerateContent).toHaveBeenCalledWith('Dame los datos en JSON');
        expect(result).toBe('{"status":"success"}');
    });
});