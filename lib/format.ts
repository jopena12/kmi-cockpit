const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };

function symbolFor(currency: string) {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export const fmtAmount = (n: number, currency = 'EUR') =>
  `${Math.round(n).toLocaleString('fr-FR')} ${symbolFor(currency)}`;

export const fmtCompact = (n: number, currency = 'EUR') =>
  n >= 1000
    ? `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')}k ${symbolFor(currency)}`
    : `${Math.round(n)} ${symbolFor(currency)}`;

export const fmtDayMonth = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

export const fmtShortMonth = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
};
