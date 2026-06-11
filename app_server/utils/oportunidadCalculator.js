/**
 * @fileoverview Utilidad matemática para clasificar subastas según su rentabilidad teórica.
 */

/**
 * Valida si un valor numérico es apto para cálculos.
 * @param {any} num - Valor a evaluar.
 * @returns {boolean} True si es un número real válido.
 */
const { SUBASTA } = require('../config/constants');

/**
 * Valida si un valor numérico es apto para cálculos.
 * @param {any} num - Valor a evaluar.
 * @returns {boolean} True si es un número real válido.
 */
function esValorValido(num) {
    return num !== null && num !== undefined && !Number.isNaN(num);
}
  
/**
 * Calcula el descuento porcentual entre el precio de salida y el valor tasado.
 * @param {number} precioSalida - Precio base de la subasta.
 * @param {number} valorTasacion - Valor de mercado estimado.
 * @returns {number|null} Porcentaje de diferencia redondeado a dos decimales, o null si los datos son inválidos.
 */
function calcularDiferenciaPorcentual(precioSalida, valorTasacion) {
    if (!esValorValido(precioSalida) || !esValorValido(valorTasacion) || valorTasacion === 0) {
        return null;
    }

    const diferencia = ((precioSalida - valorTasacion) / valorTasacion) * 100;
    return Number(diferencia.toFixed(2));
}

/**
 * Asigna una categoría cualitativa al nivel de oportunidad de inversión basándose en el ratio de precios.
 * @param {number} precioSalida - Precio base de la subasta.
 * @param {number} valorTasacion - Valor de mercado estimado.
 * @returns {string|null} 'ALTO' (<50%), 'MEDIO' (50-75%) o 'BAJO' (>75%).
 */
function calcularNivelOportunidad(precioSalida, valorTasacion) {
    if (!esValorValido(precioSalida) || !esValorValido(valorTasacion) || valorTasacion === 0) {
        return null;
    }

    const ratio = precioSalida / valorTasacion;

    if (ratio < SUBASTA.OPORTUNIDAD.RATIO_ALTO) {
        return 'ALTO';
    }

    if (ratio <= SUBASTA.OPORTUNIDAD.RATIO_MEDIO) {
        return 'MEDIO';
    }

    return 'BAJO';
}

function calcularViabilidad(nivelOportunidad, riesgoLegal) {
    // Si el riesgo legal es ALTO, la viabilidad siempre es BAJA
    if (riesgoLegal === 'ALTO') {
        return 'BAJA';
    }

    // Si el nivel de oportunidad es ALTO
    if (nivelOportunidad === 'ALTO') {
        return 'ALTA';
    }

    // Si el nivel de oportunidad es MEDIO
    if (nivelOportunidad === 'MEDIO') {
        return 'ALTA'; // Oportunidad media -> Viabilidad alta si el riesgo no es alto
    }

    // Si el nivel de oportunidad es BAJO
    if (nivelOportunidad === 'BAJO') {
        // Si el riesgo es bajo, se considera media
        if (riesgoLegal === 'BAJO') return 'MEDIA';
        return 'BAJA';
    }

    // Fallback si no hay oportunidad (ej. sin tasación)
    if (riesgoLegal === 'BAJO') return 'ALTA';
    if (riesgoLegal === 'MEDIO') return 'MEDIA';

    // Si no hay datos ni de riesgo ni de oportunidad, viabilidad MEDIA en lugar de BAJA
    return 'MEDIA';
}

module.exports = {
    calcularDiferenciaPorcentual,
    calcularNivelOportunidad,
    calcularViabilidad,
};