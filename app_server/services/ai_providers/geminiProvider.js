const { GoogleGenerativeAI } = require("@google/generative-ai");

function createGeminiProvider(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1, 
        }
    });

    async function generate(promptFinal) {
        const result = await model.generateContent(promptFinal);
        return result.response.text();
    }

    return {
        generate
    };
}

module.exports = createGeminiProvider;