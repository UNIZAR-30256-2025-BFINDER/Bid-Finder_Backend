const subastas = [
    {
      id: 1,
      titulo: 'Subasta de vivienda en Madrid',
      precio: 150000,
      descripcion: 'Vivienda procedente de embargo ubicada en Madrid.',
      urlOriginal: 'https://subastas.boe.es/'
    },
    {
      id: 2,
      titulo: 'Subasta de vehículo en Sevilla',
      precio: 8000,
      descripcion: 'Vehículo embargado disponible en subasta pública.',
      urlOriginal: 'https://subastas.boe.es/'
    },
    {
      id: 3,
      titulo: 'Subasta de local comercial en Valencia',
      precio: null,
      descripcion: 'Local comercial anunciado en el portal de subastas del BOE.',
      urlOriginal: 'https://subastas.boe.es/'
    }
  ];
  
  function findById(id) {
    return subastas.find((subasta) => subasta.id === id) || null;
  }
  
  module.exports = {
    findById
  };