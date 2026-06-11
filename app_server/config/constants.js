/**
 * @fileoverview Constantes de configuración global de la aplicación.
 * Define los parámetros de conexión al BOE, límites de ingesta y estados de la IA.
 */

module.exports = {
    BOE: {
        API_SUMARIO_URL: 'https://www.boe.es/datosabiertos/api/boe/sumario',
        BASE_DOMAIN: 'https://www.boe.es',
        TIMEOUT_MS: 15000,
        SUBASTAS_URL: 'HTTPS://SUBASTAS.BOE.ES',
        ENLACE_MAX_LENGTH: 600
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
    },
    SUBASTA: {
        NIVEL_OPORTUNIDAD_PRIORIDAD: Object.freeze(["ALTO", "MEDIO", "BAJO"]),
        CATEGORIAS_PERMITIDAS: Object.freeze(["INMUEBLE", "VEHICULO", "MAQUINARIA", "OTROS"]),
        OPORTUNIDAD: {
            RATIO_ALTO: 0.5,
            RATIO_MEDIO: 0.75
        }
    },
    CATASTRO: {
        API_URL: 'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC',
        COORD_URL: 'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC',
        WFS_URL: 'http://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx',
        TIMEOUT_MS: 8000,
        MAP_WIDTH: 600,
        MAP_HEIGHT: 450,
        BBOX_DELTA_LAT: 0.0008,
        BBOX_DELTA_LON: 0.0012,
        IMAGE: {
            DOWNLOAD_TIMEOUT_MS: 5000,
            FACADE_MIN_SIZE_BYTES: 5000,
            SATELLITE_MIN_SIZE_BYTES: 1000,
            FALLBACK_URL: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=300'
        }
    },
    GEO_CODING: {
        NOMINATIM_URL: 'https://nominatim.openstreetmap.org/search',
        DELAY_MS: 1000,
        DEFAULT_COUNTRY: 'España'
    }
};