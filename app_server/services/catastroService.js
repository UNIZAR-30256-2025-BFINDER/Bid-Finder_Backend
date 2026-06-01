/**
 * @fileoverview Servicio refactorizado para la Sede Electrónica del Catastro 
 */

const axios = require('axios');
const CatastroData = require('../models/catastroData');

const CATASTRO_API_URL =
    'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC';

const CATASTRO_COORD_URL =
    'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC';

const CATASTRO_WFS_URL =
    'http://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx';

/**
 * Value Object que encapsula y valida una Referencia Catastral española.
 */
class CatastralRef {
    constructor(rawValue) {
        if (typeof rawValue !== 'string') {
            throw new TypeError('La referencia catastral debe ser un string');
        }
        this.value = rawValue.trim().replace(/\s+/g, '').toUpperCase();
        if (this.value.length !== 20) {
            throw new Error(`Referencia catastral inválida: ${this.value.length} caracteres`);
        }
    }

    getFull() {
        return this.value;
    }

    getParcela() {
        return this.value.substring(0, 14);
    }

    isRustico() {
        // Rústico: 5 dígitos seguidos de una letra (ej: 16256A...)
        return /^[0-9]{5}[A-Z]/.test(this.value);
    }

    getUrbRusCode() {
        return this.isRustico() ? 'R' : 'U';
    }
}

/**
 * Mapeador que encapsula la correspondencia de provincias/municipios con Gerencias Territoriales especiales.
 */
class DelegacionMapper {
    static #SPECIAL_GERENCIAS = {
        // Asturias (33) -> Gijón (52)
        33: {
            destGerencia: '52',
            municipios: [24, 14, 25, 76, 19, 13, 56, 36, 55, 46, 47, 9, 43, 12, 3, 52, 45, 48],
        },
        // Cádiz (11) -> Jerez (51)
        11: {
            destGerencia: '51',
            municipios: [20, 32, 31, 16, 37, 6, 10, 17, 41, 5, 18, 24, 36, 34, 2, 26, 11, 38, 9, 40, 19, 42, 3, 902],
        },
        // Murcia (30) -> Cartagena (53)
        30: {
            destGerencia: '53',
            municipios: [16, 37, 35, 36, 902, 41, 21, 26, 3],
        },
        // Pontevedra (36) -> Vigo (54)
        36: {
            destGerencia: '54',
            municipios: [57, 3, 21, 35, 45, 53, 39, 19, 42, 30, 31, 50, 34, 49, 55, 54, 48, 23, 1, 14, 9, 13],
        },
    };

    /**
     * Resuelve el código de delegación (del) apropiado.
     */
    static resolve(cp, cmc) {
        const cpNum = parseInt(cp, 10);
        const cmcNum = parseInt(cmc, 10);

        if (isNaN(cpNum) || isNaN(cmcNum)) {
            return cp;
        }

        const special = this.#SPECIAL_GERENCIAS[cpNum];
        if (special && special.municipios.includes(cmcNum)) {
            return special.destGerencia;
        }

        return cp;
    }
}

/**
 * Cliente HTTP para la API del Catastro.
 */
class CatastroApiClient {
    async fetchLocationData(rc) {
        const response = await axios.get(CATASTRO_API_URL, {
            params: { Provincia: '', Municipio: '', RC: rc },
            timeout: 8000,
            responseType: 'text',
        });
        return response.data;
    }

    async fetchCoordinates(rc14) {
        const response = await axios.get(CATASTRO_COORD_URL, {
            params: { Provincia: '', Municipio: '', SRS: 'EPSG:4326', RC: rc14 },
            timeout: 8000,
            responseType: 'text',
        });
        return response.data;
    }

    async fetchWfsParcel(rc14) {
        const response = await axios.get(CATASTRO_WFS_URL, {
            params: {
                service: 'wfs',
                version: '2.0.0',
                request: 'getfeature',
                STOREDQUERY_ID: 'GetParcel',
                refcat: rc14,
            },
            timeout: 8000,
            responseType: 'text',
        });
        return response.data;
    }
}

/**
 * Servicio principal que coordina la lógica de negocio catastral.
 */
class CatastroService {
    constructor(client = new CatastroApiClient()) {
        this.client = client;
    }

    /**
     * Resuelve provincia, municipio y delegación catastral.
     */
    async resolverDelMun(refCatastral) {
        try {
            const ref = new CatastralRef(refCatastral);
            const xml = await this.client.fetchLocationData(ref.getParcela());

            const cpMatch = xml.match(/<cp>\s*(\d+)\s*<\/cp>/);
            const cmcMatch = xml.match(/<cmc>\s*(\d+)\s*<\/cmc>/);

            if (!cpMatch || !cmcMatch) {
                return null;
            }

            const cp = cpMatch[1];
            const mun = cmcMatch[1];
            const del = DelegacionMapper.resolve(cp, mun);

            return {
                del,
                mun,
                urbRus: ref.getUrbRusCode(),
            };
        } catch (error) {
            console.error(`[CatastroService] Error resolving del/mun for ${refCatastral}:`, error.message);
            return null;
        }
    }

    /**
     * Genera la URL de la Ficha Catastral.
     */
    async buildFichaUrl(refCatastral) {
        const ref = new CatastralRef(refCatastral);
        const info = await this.resolverDelMun(ref.getFull());
        if (!info) {
            return null;
        }

        const params = new URLSearchParams({
            UrbRus: info.urbRus,
            RefC: ref.getFull(),
            esBice: '',
            RCBice1: '',
            RCBice2: '',
            DenoBice: '',
            from: 'OVCBusqueda',
            pest: 'rc',
            RCCompleta: ref.getFull(),
            final: '',
            del: info.del,
            mun: info.mun,
        });

        return `https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?${params.toString()}`;
    }

    /**
     * Obtiene información extendida del bien inmueble.
     */
    async getExtendedInfo(refCatastral) {
        try {
            const ref = new CatastralRef(refCatastral);
            const fullRef = ref.getFull();
            const parcelaRef = ref.getParcela();

            // 1. Intentar obtener de la caché (MongoDB)
            const cached = await CatastroData.findOne({ referenciaCatastral: fullRef });
            if (cached) {
                return cached;
            }

            // 2. Si no está en caché, consultar datos descriptivos básicos
            const basicXml = await this.client.fetchLocationData(fullRef);
            
            const claseMatch = basicXml.match(/<cn>\s*([^<]+)\s*<\/cn>/);
            const lusoMatch = basicXml.match(/<luso>\s*([^<]+)\s*<\/luso>/);
            const sfcMatch = basicXml.match(/<sfc>\s*(\d+)\s*<\/sfc>/);
            const antMatch = basicXml.match(/<ant>\s*(\d+)\s*<\/ant>/);
            const ldtMatch = basicXml.match(/<ldt>\s*([^<]+)\s*<\/ldt>/);
            const cptMatch = basicXml.match(/<cpt>\s*([^<]+)\s*<\/cpt>/);

            const claseCode = claseMatch ? claseMatch[1].trim() : ref.getUrbRusCode();
            const clase = claseCode === 'UR' ? 'Urbano' : (claseCode === 'RU' ? 'Rústico' : claseCode);

            // Obtener coordenadas
            let coordenadas = null;
            try {
                const coordXml = await this.client.fetchCoordinates(parcelaRef);
                const xcenMatch = coordXml.match(/<xcen>\s*([^<]+)\s*<\/xcen>/);
                const ycenMatch = coordXml.match(/<ycen>\s*([^<]+)\s*<\/ycen>/);
                if (xcenMatch && ycenMatch) {
                    coordenadas = {
                        lat: parseFloat(ycenMatch[1]),
                        lng: parseFloat(xcenMatch[1]),
                    };
                }
            } catch (coordErr) {
                console.warn('[CatastroService] Error fetching coordinates:', coordErr.message);
            }

            // Obtener superficie gráfica de la parcela usando WFS
            let superficieGrafica = null;
            try {
                const wfsXml = await this.client.fetchWfsParcel(parcelaRef);
                const areaMatch = wfsXml.match(/<cp:areaValue[^>]*>\s*(\d+)\s*<\/cp:areaValue>/);
                if (areaMatch) {
                    superficieGrafica = parseInt(areaMatch[1], 10);
                }
            } catch (wfsErr) {
                console.warn('[CatastroService] Error fetching WFS parcel area:', wfsErr.message);
            }

            // Fallback para rústica si WFS falló
            if (superficieGrafica === null && ref.isRustico()) {
                const subparcelas = [...basicXml.matchAll(/<ssp>\s*(\d+)\s*<\/ssp>/g)];
                if (subparcelas.length > 0) {
                    superficieGrafica = subparcelas.reduce((acc, curr) => acc + parseInt(curr[1], 10), 0);
                }
            }

            const dataToSave = {
                referenciaCatastral: fullRef,
                clase,
                usoPrincipal: lusoMatch ? lusoMatch[1].trim() : 'Desconocido',
                superficieConstruida: sfcMatch ? parseInt(sfcMatch[1], 10) : null,
                superficieGrafica,
                anoConstruccion: antMatch ? parseInt(antMatch[1], 10) : null,
                direccion: ldtMatch ? ldtMatch[1].trim() : 'Desconocida',
                coordenadas,
                participacion: cptMatch ? cptMatch[1].trim() : null,
            };

            // Guardar en la caché (MongoDB) asíncronamente
            CatastroData.create(dataToSave).catch(saveErr => {
                console.error('[CatastroService] Error saving to MongoDB cache:', saveErr.message);
            });

            return dataToSave;
        } catch (error) {
            console.error(`[CatastroService] Error fetching extended info for ${refCatastral}:`, error.message);
            return null;
        }
    }

    /**
     * Construye la URL de la imagen del mapa catastral de la parcela usando WMS.
     */
    async buildMapImageUrl(refCatastral) {
        try {
            const ref = new CatastralRef(refCatastral);
            const info = await this.getExtendedInfo(ref.getFull());
            if (!info || !info.coordenadas) {
                return null;
            }

            const { lat, lng } = info.coordenadas;
            // Calcular una caja delimitadora de ~150m alrededor del centro
            const deltaLat = 0.0008;
            const deltaLon = 0.0012;
            const latMin = lat - deltaLat;
            const latMax = lat + deltaLat;
            const lonMin = lng - deltaLon;
            const lonMax = lng + deltaLon;

            return `http://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=CP.CadastralParcel&FORMAT=image/png&CRS=EPSG:4326&BBOX=${latMin},${lonMin},${latMax},${lonMax}&WIDTH=600&HEIGHT=450&STYLES=`;
        } catch (error) {
            console.error(`[CatastroService] Error building map image URL for ${refCatastral}:`, error.message);
            return null;
        }
    }

    /**
     * Construye la URL de la imagen satélite (ortofoto) de la parcela usando el WMS del PNOA (IGN).
     */
    async buildSatelliteImageUrl(refCatastral) {
        try {
            const ref = new CatastralRef(refCatastral);
            const info = await this.getExtendedInfo(ref.getFull());
            if (!info || !info.coordenadas) {
                return null;
            }

            const { lat, lng } = info.coordenadas;
            // Calcular una caja delimitadora de ~150m alrededor del centro
            const deltaLat = 0.0008;
            const deltaLon = 0.0012;
            const latMin = lat - deltaLat;
            const latMax = lat + deltaLat;
            const lonMin = lng - deltaLon;
            const lonMax = lng + deltaLon;

            return `https://www.ign.es/wms-inspire/pnoa-ma?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=OI.OrthoimageCoverage&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX=${latMin},${lonMin},${latMax},${lonMax}&WIDTH=600&HEIGHT=450&STYLES=`;
        } catch (error) {
            console.error(`[CatastroService] Error building satellite image URL for ${refCatastral}:`, error.message);
            return null;
        }
    }

    /**
     * Construye la URL de la imagen de la fachada de la parcela catastral.
     */
    async buildFacadeImageUrl(refCatastral) {
        try {
            const ref = new CatastralRef(refCatastral);
            return `http://ovc.catastro.meh.es/OVCServWeb/OVCWcfLibres/OVCFotoFachada.svc/RecuperarFotoFachadaGet?ReferenciaCatastral=${ref.getFull()}`;
        } catch (error) {
            console.error(`[CatastroService] Error building facade image URL for ${refCatastral}:`, error.message);
            return null;
        }
    }
}

const serviceInstance = new CatastroService();

module.exports = {
    resolverDelMun: (ref) => serviceInstance.resolverDelMun(ref),
    buildFichaUrl: (ref) => serviceInstance.buildFichaUrl(ref),
    getExtendedInfo: (ref) => serviceInstance.getExtendedInfo(ref),
    buildMapImageUrl: (ref) => serviceInstance.buildMapImageUrl(ref),
    buildSatelliteImageUrl: (ref) => serviceInstance.buildSatelliteImageUrl(ref),
    buildFacadeImageUrl: (ref) => serviceInstance.buildFacadeImageUrl(ref),
    CatastralRef,
    DelegacionMapper,
    CatastroService,
};
