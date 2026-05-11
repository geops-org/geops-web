import { calculateCtr } from './campaign-metrics.util';

describe('campaign-metrics.util - calculateCtr', () => {

  it('debe retornar 0 cuando no hay impresiones', () => {
    const result = calculateCtr(10, 0);
    expect(result).toBe(0);
  });

  it('debe retornar 0 cuando clicks e impresiones son 0', () => {
    const result = calculateCtr(0, 0);
    expect(result).toBe(0);
  });

  it('debe calcular correctamente el CTR: (40 / 3000) * 100 = 1.3', () => {
    const result = calculateCtr(40, 3000);
    expect(result).toBe(1.3);
  });

  it('debe retornar un decimal (single decimal place)', () => {
    const result = calculateCtr(1, 3);
    expect(result).toBe(33.3);
  });

  it('debe manejar null clicks como 0', () => {
    const result = calculateCtr(null, 100);
    expect(result).toBe(0);
  });

  it('debe manejar null impressions como 0', () => {
    const result = calculateCtr(10, null);
    expect(result).toBe(0);
  });

  it('debe manejar undefined clicks como 0', () => {
    const result = calculateCtr(undefined, 100);
    expect(result).toBe(0);
  });

  it('debe manejar undefined impressions como 0', () => {
    const result = calculateCtr(10, undefined);
    expect(result).toBe(0);
  });

  it('debe manejar ambos null', () => {
    const result = calculateCtr(null, null);
    expect(result).toBe(0);
  });

  it('debe manejar números negativos como 0', () => {
    const result = calculateCtr(-5, 100);
    expect(result).toBe(0);
  });

  it('debe manejar impresiones negativas como 0', () => {
    const result = calculateCtr(10, -100);
    expect(result).toBe(0);
  });

  it('debe retornar CTR alto cuando hay muchos clicks', () => {
    const result = calculateCtr(50, 100);
    expect(result).toBe(50);
  });

  it('debe retornar CTR bajo cuando hay pocos clicks', () => {
    const result = calculateCtr(1, 1000);
    expect(result).toBe(0.1);
  });

  it('debe retornar 100 cuando clicks = impresiones', () => {
    const result = calculateCtr(100, 100);
    expect(result).toBe(100);
  });

});
