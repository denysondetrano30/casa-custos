// Estado inicial do app — usado só na primeira vez que alguém abre o app
// nesse navegador, ou depois de "Apagar dados e recomeçar" no Perfil.
// Começa zerado de propósito: os orçamentos por categoria abaixo são um
// ponto de partida razoável, mas ainda não há uma tela para editá-los —
// se quiser valores diferentes, me diga e eu ajusto aqui.

export const initialState = {
  // Nomes de exibição das duas pessoas da casa. "Rui" e "Ana" continuam
  // existindo como identificadores internos (é o que o resto do código usa
  // para separar renda, contas, etc. de cada um) — o que aparece na tela é
  // sempre isto aqui, editável no Perfil.
  names: { Rui: 'Pessoa 1', Ana: 'Pessoa 2' },

  month: {
    label: 'Agosto 2026',
    today: 30,
    daysInMonth: 31,
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

  // Compras feitas no cartão que são gasto conjunto (de casa), vindas da
  // importação de extrato — diferente de "bills", que são contas fixas que
  // se repetem todo mês. Isso aqui é pontual: entra na divisão deste mês,
  // mas não é somado nos meses futuros.
  sharedPurchases: [],

  installments: [],

  goals: [],

  splitPct: { Rui: 80, Ana: 20 },

  income: { Rui: 0, Ana: 0 },
  extras: { Rui: [], Ana: [] },

  personal: {
    Rui: { fixed: [], variable: [] },
    Ana: { fixed: [], variable: [] },
  },

  // Lista de categorias de gasto pessoal (Streaming, Academia, etc.),
  // compartilhada pelas duas pessoas da casa. Começa com algumas sugestões,
  // mas dá pra adicionar outras direto na tela de Adicionar → Pessoal.
  personalCategories: ['Streaming', 'Academia', 'Assinaturas', 'Cabeleireiro', 'Cursos'],

  shop: {
    items: [],
    method: 'debito',
    debitPart: 0,
  },

  purchases: [],
};
