function esValorValido(num) {
    return num !== null && num !== undefined && !Number.isNaN(num);
  }
  
  function calcularDiferenciaPorcentual(precioSalida, valorTasacion) {
    if (!esValorValido(precioSalida) || !esValorValido(valorTasacion) || valorTasacion === 0) {
      return null;
    }
  
    const diferencia = ((precioSalida - valorTasacion) / valorTasacion) * 100;
    return Number(diferencia.toFixed(2));
  }
  
  function calcularNivelOportunidad(precioSalida, valorTasacion) {
    if (!esValorValido(precioSalida) || !esValorValido(valorTasacion) || valorTasacion === 0) {
      return null;
    }
  
    const ratio = precioSalida / valorTasacion;
  
    if (ratio < 0.5) {
      return 'ALTO';
    }
  
    if (ratio <= 0.75) {
      return 'MEDIO';
    }
  
    return 'BAJO';
  }
  
  module.exports = {
    calcularDiferenciaPorcentual,
    calcularNivelOportunidad,
  };