import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function getTodayInPeru(): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [year, month, day] = formatter.format(new Date()).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function normalizeToDay(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startDateNotInPast(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const selected = normalizeToDay(control.value as Date | string);
    if (!selected) return null;
    return selected < getTodayInPeru() ? { startDatePast: true } : null;
  };
}

export function endDateAfterStart(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const endDay = normalizeToDay(control.value as Date | string);
    if (!endDay) return null;

    const startDay = normalizeToDay(
      control.parent?.get('startDate')?.value as Date | string
    );
    if (!startDay) return null;

    return endDay <= startDay ? { endDateBeforeStart: true } : null;
  };
}

export function noWhitespace(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    return value !== value.trim() ? { whitespace: true } : null;
  };
}

export function positiveNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return Number(value) <= 0 ? { notPositive: true } : null;
  };
}
