/*
<documento fecha_actualizacion="20260103071516">
  <metadatos>
    <identificador>BOE-B-2026-112</identificador>
    <departamento codigo="5140">Ministerio de Hacienda</departamento>
    <titulo>U.R. SUBASTAS ANDALUCIA 41</titulo>
    <diario codigo="BOE">Boletín Oficial del Estado</diario>
    <fecha_publicacion>20260103</fecha_publicacion>
    <diario_numero>3</diario_numero>
    <seccion>5</seccion>
    <subseccion>B</subseccion>
    <numero_anuncio>A250060937</numero_anuncio>
    <pagina_inicial>221</pagina_inicial>
    <pagina_final>221</pagina_final>
    <suplemento_pagina_inicial/>
    <suplemento_pagina_final/>
    <url_pdf>/boe/dias/2026/01/03/pdfs/BOE-B-2026-112.pdf</url_pdf>
    <letra_imagen>B</letra_imagen>
    <suplemento_letra_imagen/>
  </metadatos>
  <analisis>
    <modalidad codigo=""/>
    <tipo codigo=""/>
    <procedimiento codigo=""/>
    <ambito_geografico/>
    <materias/>
    <materias_cpv/>
    <observaciones/>
  </analisis>
  <texto>
    <p class="parrafo">Anuncio de subasta administrativa de la Agencia Estatal de Administración Tributaria, con número de referencia S2025R4186001497.</p>
    <p class="parrafo">Dirección electrónica: https://subastas.boe.es/ds.php?id=SUB-AT-2025-25R4186001497</p>
    <p class="parrafo">Fecha de inicio de la subasta: La subasta se iniciará en la fecha indicada a través de la dirección electrónica anterior.</p>
    <p class="parrafo_2">Sevilla, 29 de diciembre de 2025.- Jefe del Equipo Regional de Recaudación.</p>
  </texto>
</documento>

{
  id: string,
  titulo: string,
  fechaPublicacion: string,       // ISO
  urlPdf: string,
  texto: string,
}
*/

// app_server/models/subastasModel.js
const subastas = [
    {
        id: "BOE-B-2026-112",
        titulo: "U.R. SUBASTAS ANDALUCIA 41",
        fechaPublicacion: 20260103,
        urlPdf: "/boe/dias/2026/01/03/pdfs/BOE-B-2026-112.pdf",
        texto: "Anuncio de subasta administrativa de la Agencia Estatal de Administración Tributaria, con número de referencia S2025R4186001497.\nDirección electrónica: https://subastas.boe.es/ds.php?id=SUB-AT-2025-25R4186001497\nFecha de inicio de la subasta: La subasta se iniciará en la fecha indicada a través de la dirección electrónica anterior.\nSevilla, 29 de diciembre de 2025.- Jefe del Equipo Regional de Recaudación",
    },
]; // <-- aquí se guardan las subastas en memoria

// Función para crear una nueva subasta a partir de los datos parseados
function create(data) {
    const id = subastas.length + 1;
    const nuevaSubasta = {
        id,
        ...data,
        fechaExtraccion: new Date().toISOString(),
    };
    subastas.push(nuevaSubasta);
    return nuevaSubasta;
}

function findAll() {
    return [...subastas]; // copia para evitar modificación externa
}

function findById(id) {
    return subastas.find((s) => s.id === id) || null;
}

function update(id, updates) {
    const index = subastas.findIndex((s) => s.id === id);
    if (index === -1) return null;
    subastas[index] = { ...subastas[index], ...updates };
    return subastas[index];
}

function deleteById(id) {
    const index = subastas.findIndex((s) => s.id === id);
    if (index === -1) return false;
    subastas.splice(index, 1);
    return true;
}

module.exports = {
    create,
    findAll,
    findById,
    update,
    deleteById,
};
