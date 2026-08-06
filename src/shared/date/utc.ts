/**
 * Datas da aplicação em UTC.
 * O processo deve iniciar com TZ=UTC (ver server.ts / scripts).
 */

export function nowUtc(): Date {
  return new Date();
}

export function toUtcIsoString(date: Date = nowUtc()): string {
  return date.toISOString();
}

export function parseUtc(value: string | number | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${String(value)}`);
  }

  return parsed;
}
