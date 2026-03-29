module.exports = {
    BOE: {
        API_SUMARIO_URL: 'https://www.boe.es/datosabiertos/api/boe/sumario',
        BASE_DOMAIN: 'https://www.boe.es',
        TIMEOUT_MS: 15000
    },
    INGESTION: {
        CONCURRENCY_LIMIT: 5
    },
    IA: {
        ESTADOS: {
            PENDIENTE: 'PENDIENTE',
            PROCESADO: 'PROCESADO',
            ERROR: 'ERROR'
        }
    },
    AI_WORKER: {
        BATCH_SIZE: 10,
        DELAY_MS: 12_000,
    }
};