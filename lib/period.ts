import type { Period } from './types';

const VALID_PERIODS: Period[] = ['7j', '30j', '12m'];

export function parsePeriod(value: string | undefined): Period {
  return VALID_PERIODS.includes(value as Period) ? (value as Period) : '12m';
}
