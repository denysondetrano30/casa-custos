// Estado inicial do app — usado só na primeira vez que alguém abre o app
// nesse navegador, ou depois de "Apagar dados e recomeçar" no Perfil.
// Começa zerado de propósito: os orçamentos por categoria abaixo são um
// ponto de partida razoável, mas ainda não há uma tela para editá-los —
// se quiser valores diferentes, me diga e eu ajusto aqui.

export const initialState = {
  month: {
    label: 'Agosto 2026',
    today: 30,
    daysInMonth: 31,
    budget: 8000,
    status: 'no ritmo',
  },

  cats: [
    { id: 'mercado', name: 'Mercado', icon: 'ph-basket', spent: 0, budget: 2000, color: '#9184d9' },
    { id: 'casa', name: 'Casa', icon: 'ph-house-line', spent: 0, budget: 2200, color: '#796cbf' },
    { id: 'transporte', name: 'Transporte', icon: 'ph-car', spent: 0, budget: 700, color: '#5d5294' },
    { id: 'lazer', name: 'Lazer', icon: 'ph-fork-knife', spent: 0, budget: 800, color: '#c98a8a' },
    { id: 'saude', name: 'Saúde', icon: 'ph-heartbeat', spent: 0, budget: 900, color: '#423a6a' },
  ],

  txs: [],

  bills: [],

  installments: [],

  goals: [],

  splitPct: { Rui: 80, Ana: 20 },

  income: { Rui: 0, Ana: 0 },
  extras: { Rui: [], Ana: [] },

  personal: {
    Rui: { fixed: [], variable: [] },
    Ana: { fixed: [], variable: [] },
  },

  shop: {
    items: [],
    method: 'debito',
    debitPart: 0,
  },

  purchases: [],
};
