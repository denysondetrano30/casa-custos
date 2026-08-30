// Tokens de design do app Casa — tema "Nocturne"
// Fonte: README.md, seção "Tokens de design"

export const color = {
  bg: '#161826',
  bgGradientTop: '#1b1d2e',
  surface: '#232532',
  surfaceElevated: '#2b2741',
  surfaceInset: '#1e202c',
  border: '#3f424d',
  borderSubtle: '#292b31',

  text: '#e9e9ed',
  textMedium: 'rgba(233,233,237,.6)',
  textWeak: 'rgba(233,233,237,.4)',

  accent: '#9184d9',
  accentLight: '#d2cefd',
  accentIcon: '#b5abfc',
  accentChipText: '#e7e5fe',
  accentSoft: 'rgba(145,132,217,.14)',
  accentSofter: 'rgba(145,132,217,.06)',

  chart: ['#9184d9', '#796cbf', '#5d5294', '#423a6a', '#4a4d5c', '#3f424d'],

  alertText: '#e6b3b3',
  alertBar: '#c98a8a',
};

export const radius = {
  card: 14,
  row: 11,
  chip: 99,
  check: 8,
};

export const space = {
  screenPadding: '64px 20px 168px',
  sectionGap: 19,
  listItemGap: 8,
  cardPadding: 16,
  rowPadding: '11px 12px',
};

export const font = {
  family: "Inter, system-ui, sans-serif",
  hero: { fontSize: 40, fontWeight: 500, letterSpacing: '-.03em' },
  screenTitle: { fontSize: 26, fontWeight: 500, letterSpacing: '-.02em' },
  cardValue: { fontSize: 24, fontWeight: 500, letterSpacing: '-.025em' },
  listItem: { fontSize: 14, fontWeight: 400 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '.09em',
    textTransform: 'uppercase',
    color: 'rgba(233,233,237,.5)',
  },
  meta: { fontSize: 11, fontWeight: 400 },
  button: { fontSize: 14.5, fontWeight: 500 },
};
