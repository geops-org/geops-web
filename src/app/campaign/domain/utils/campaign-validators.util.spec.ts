import { FormControl, FormGroup } from '@angular/forms';
import {
  startDateNotInPast,
  endDateAfterStart,
  noWhitespace,
  positiveNumber
} from './campaign-validators.util';

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function makeGroup(startDate: Date | null, endDate: Date | null): FormGroup {
  return new FormGroup({
    startDate: new FormControl(startDate),
    endDate: new FormControl(endDate)
  });
}

describe('startDateNotInPast()', () => {
  const validator = startDateNotInPast();

  it('debe retornar null cuando el valor es null', () => {
    expect(validator(new FormControl(null))).toBeNull();
  });

  it('debe retornar null cuando el valor está vacío', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('debe retornar null para hoy', () => {
    expect(validator(new FormControl(daysFromNow(0)))).toBeNull();
  });

  it('debe retornar null para una fecha futura', () => {
    expect(validator(new FormControl(daysFromNow(3)))).toBeNull();
  });

  it('debe retornar { startDatePast: true } para ayer', () => {
    expect(validator(new FormControl(daysFromNow(-1)))).toEqual({ startDatePast: true });
  });

  it('debe retornar { startDatePast: true } para una fecha pasada lejana', () => {
    expect(validator(new FormControl(new Date('2020-01-01')))).toEqual({ startDatePast: true });
  });

  it('debe aceptar una fecha ISO string futura', () => {
    const future = daysFromNow(5).toISOString().split('T')[0];
    expect(validator(new FormControl(future))).toBeNull();
  });
});

describe('endDateAfterStart()', () => {
  const validator = endDateAfterStart();

  it('debe retornar null cuando endDate es null', () => {
    const group = makeGroup(daysFromNow(1), null);
    expect(validator(group.get('endDate')!)).toBeNull();
  });

  it('debe retornar null cuando no hay control padre', () => {
    expect(validator(new FormControl(daysFromNow(2)))).toBeNull();
  });

  it('debe retornar null cuando startDate es null', () => {
    const group = makeGroup(null, daysFromNow(2));
    expect(validator(group.get('endDate')!)).toBeNull();
  });

  it('debe retornar null cuando endDate es un día después de startDate', () => {
    const group = makeGroup(daysFromNow(1), daysFromNow(2));
    expect(validator(group.get('endDate')!)).toBeNull();
  });

  it('debe retornar null cuando la diferencia es de varios días', () => {
    const group = makeGroup(daysFromNow(1), daysFromNow(10));
    expect(validator(group.get('endDate')!)).toBeNull();
  });

  it('debe retornar { endDateBeforeStart: true } cuando endDate === startDate', () => {
    const same = daysFromNow(5);
    const group = makeGroup(same, new Date(same));
    expect(validator(group.get('endDate')!)).toEqual({ endDateBeforeStart: true });
  });

  it('debe retornar { endDateBeforeStart: true } cuando endDate es anterior a startDate', () => {
    const group = makeGroup(daysFromNow(5), daysFromNow(2));
    expect(validator(group.get('endDate')!)).toEqual({ endDateBeforeStart: true });
  });
});

describe('noWhitespace()', () => {
  const validator = noWhitespace();

  it('debe retornar null para valor vacío', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('debe retornar null para null', () => {
    expect(validator(new FormControl(null))).toBeNull();
  });

  it('debe retornar null para un texto limpio', () => {
    expect(validator(new FormControl('Campaña de Verano'))).toBeNull();
  });

  it('debe retornar null para texto con espacios internos', () => {
    expect(validator(new FormControl('Mi Campaña'))).toBeNull();
  });

  it('debe retornar { whitespace: true } con espacio al inicio', () => {
    expect(validator(new FormControl(' Campaña'))).toEqual({ whitespace: true });
  });

  it('debe retornar { whitespace: true } con espacio al final', () => {
    expect(validator(new FormControl('Campaña '))).toEqual({ whitespace: true });
  });

  it('debe retornar { whitespace: true } para cadena solo de espacios', () => {
    expect(validator(new FormControl('   '))).toEqual({ whitespace: true });
  });

  it('debe retornar { whitespace: true } con espacios en ambos extremos', () => {
    expect(validator(new FormControl('  Campaña  '))).toEqual({ whitespace: true });
  });
});

describe('positiveNumber()', () => {
  const validator = positiveNumber();

  it('debe retornar null para null', () => {
    expect(validator(new FormControl(null))).toBeNull();
  });

  it('debe retornar null para undefined', () => {
    expect(validator(new FormControl(undefined))).toBeNull();
  });

  it('debe retornar null para cadena vacía', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('debe retornar null para un número positivo entero', () => {
    expect(validator(new FormControl(500))).toBeNull();
  });

  it('debe retornar null para 0.01 (mínimo positivo)', () => {
    expect(validator(new FormControl(0.01))).toBeNull();
  });

  it('debe retornar null para un número positivo grande', () => {
    expect(validator(new FormControl(999999))).toBeNull();
  });

  it('debe retornar { notPositive: true } para cero', () => {
    expect(validator(new FormControl(0))).toEqual({ notPositive: true });
  });

  it('debe retornar { notPositive: true } para número negativo', () => {
    expect(validator(new FormControl(-1))).toEqual({ notPositive: true });
  });

  it('debe retornar { notPositive: true } para número negativo decimal', () => {
    expect(validator(new FormControl(-0.5))).toEqual({ notPositive: true });
  });
});
