const {
  calcularDiferenciaPorcentual,
  calcularNivelOportunidad,
} = require('../../app_server/utils/oportunidadCalculator');

describe('calcularDiferenciaPorcentual', () => {
  test('calcula correctamente una diferencia negativa', () => {
    const result = calcularDiferenciaPorcentual(100000, 150000);
    expect(result).toBe(-33.33);
  });

  test('calcula correctamente una diferencia positiva', () => {
    const result = calcularDiferenciaPorcentual(200000, 150000);
    expect(result).toBe(33.33);
  });

  test('devuelve 0 cuando precio_salida y valor_tasacion son iguales', () => {
    const result = calcularDiferenciaPorcentual(150000, 150000);
    expect(result).toBe(0);
  });

  test('devuelve -50 cuando el precio es exactamente el 50% de la tasación', () => {
    const result = calcularDiferenciaPorcentual(50000, 100000);
    expect(result).toBe(-50);
  });

  test('devuelve -25 cuando el precio es exactamente el 75% de la tasación', () => {
    const result = calcularDiferenciaPorcentual(75000, 100000);
    expect(result).toBe(-25);
  });

  test('devuelve null si valor_tasacion es 0', () => {
    const result = calcularDiferenciaPorcentual(100000, 0);
    expect(result).toBeNull();
  });

  test('devuelve null si faltan datos', () => {
    expect(calcularDiferenciaPorcentual(null, 150000)).toBeNull();
    expect(calcularDiferenciaPorcentual(100000, null)).toBeNull();
    expect(calcularDiferenciaPorcentual(undefined, 150000)).toBeNull();
    expect(calcularDiferenciaPorcentual(100000, undefined)).toBeNull();
  });

  test('devuelve null si los valores son NaN', () => {
    expect(calcularDiferenciaPorcentual(NaN, 100000)).toBeNull();
    expect(calcularDiferenciaPorcentual(100000, NaN)).toBeNull();
  });

  test('devuelve null si ambos valores son null', () => {
    expect(calcularDiferenciaPorcentual(null, null)).toBeNull();
  });
});

describe('calcularNivelOportunidad', () => {
  test('devuelve ALTO si el precio está por debajo del 50% de la tasación', () => {
    expect(calcularNivelOportunidad(40000, 100000)).toBe('ALTO');
    expect(calcularNivelOportunidad(49999, 100000)).toBe('ALTO');
  });

  test('devuelve MEDIO si el precio está entre el 50% y el 75% de la tasación', () => {
    expect(calcularNivelOportunidad(50000, 100000)).toBe('MEDIO');
    expect(calcularNivelOportunidad(60000, 100000)).toBe('MEDIO');
    expect(calcularNivelOportunidad(75000, 100000)).toBe('MEDIO');
  });

  test('devuelve BAJO si el precio está por encima del 75% de la tasación', () => {
    expect(calcularNivelOportunidad(75001, 100000)).toBe('BAJO');
    expect(calcularNivelOportunidad(76000, 100000)).toBe('BAJO');
    expect(calcularNivelOportunidad(100000, 100000)).toBe('BAJO');
  });

  test('maneja correctamente los casos frontera del 50% y 75%', () => {
    expect(calcularNivelOportunidad(50000, 100000)).toBe('MEDIO');
    expect(calcularNivelOportunidad(75000, 100000)).toBe('MEDIO');
  });

  test('devuelve null si faltan datos o la tasación es 0', () => {
    expect(calcularNivelOportunidad(null, 100000)).toBeNull();
    expect(calcularNivelOportunidad(50000, null)).toBeNull();
    expect(calcularNivelOportunidad(50000, 0)).toBeNull();
  });

  test('devuelve null si los valores son NaN', () => {
    expect(calcularNivelOportunidad(NaN, 100000)).toBeNull();
    expect(calcularNivelOportunidad(100000, NaN)).toBeNull();
  });

  test('devuelve null si ambos valores son null', () => {
    expect(calcularNivelOportunidad(null, null)).toBeNull();
  });
});