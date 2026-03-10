const axios = require('axios');
const fs = require('fs');
const path = require('path');

// URL base de la API del BOE extraída de la propuesta
const BOE_API_URL = 'https://www.boe.es/datosabiertos/api/boe/sumario';
const XML_TEMP_DIR = path.join(__dirname, '../../temp_xmls');

/**
 * Formatea un objeto Date de JavaScript al formato YYYYMMDD que pide el BOE
 */
function formatDateForBOE(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Llama a la API del BOE y obtiene el sumario de un día concreto
 */
async function fetchSumario(date) {
    const dateStr = formatDateForBOE(date);
    const url = `${BOE_API_URL}/${dateStr}`;
    
    try {
        console.log(`[BOE Service] Solicitando sumario del BOE para la fecha: ${dateStr}...`);
        const response = await axios.get(url, {
            headers: { 'Accept': 'application/json' }
        });
        
        return response.data;
    } catch (error) {
        console.error(`[BOE Service] Error al obtener el sumario del ${dateStr}:`, error.message);
        throw error;
    }
}

/**
 * Descarga un archivo XML dada su URL y lo guarda en la carpeta temporal
 */
async function downloadXML(xmlUrl, filename) {
    const filePath = path.join(XML_TEMP_DIR, filename);
    
    try {
        const response = await axios({
            method: 'GET',
            url: xmlUrl,
            responseType: 'stream' 
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            
            writer.on('close', () => {
                if (!error) resolve(filePath);
            });
        });
    } catch (error) {
        console.error(`[BOE Service] Error al descargar XML de ${xmlUrl}:`, error.message);
        throw error;
    }
}

/**
 * Función principal que orquesta la descarga diaria
 */
async function processDailySubastas(date = new Date()) {
    try {
        const sumario = await fetchSumario(date);

        console.log(`[BOE Service] Sumario obtenido correctamente. Procesando...`);
        
        // Imprimimos un fragmento del JSON formateado para verificar los datos
        console.log("\n--- FRAGMENTO DEL SUMARIO DEL BOE ---");
        const jsonString = JSON.stringify(sumario, null, 2);
        console.log(jsonString.substring(0, 1000));
        console.log("\n... [CONTENIDO TRUNCADO POR LONGITUD] ...");
        console.log("-------------------------------------\n");
        
        // TODO PBI 2

        return true;

    } catch (error) {
        console.error(`[BOE Service] Fallo en el proceso diario:`, error.message);
        return false;
    }
}

module.exports = {
    fetchSumario,
    downloadXML,
    processDailySubastas
};

if (require.main === module) {
    processDailySubastas(new Date());
}