// Palette neutre du "chrome" Cockpit — identique quel que soit le SaaS affiché.
// Valeurs reprises telles quelles de project/KMI Cockpit.dc.html (design de référence).
export const theme = {
  bg: 'oklch(98% 0.003 250)',
  surface: 'oklch(100% 0 0)',
  surfaceHover: 'oklch(95% 0.004 250)',
  border: 'oklch(89% 0.005 250)',
  text: 'oklch(20% 0.005 250)',
  textMuted: 'oklch(46% 0.01 250)',
  chipBg: 'oklch(94% 0.005 250)',
} as const;

// Couleurs sémantiques de statut — jamais des accents de marque, utilisées uniquement
// pour les flèches de delta et les barres de résiliation.
export const positiveColor = 'oklch(55% 0.15 145)';
export const negativeColor = 'oklch(58% 0.19 25)';
export const churnColor = 'oklch(58% 0 0)';
