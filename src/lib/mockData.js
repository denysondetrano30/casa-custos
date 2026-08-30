// Dados de exemplo só para vermos a tela Início funcionando.
// Isso será substituído por estado real (localStorage) no próximo passo.

export const mockMonth = {
  label: 'Agosto 2026',
  today: 22,
  daysInMonth: 31,
  budget: 8500,
  spent: 6120,
  status: 'no ritmo',
};

export const mockCategories = [
  { id: 'mercado', name: 'Mercado', icon: 'ph-basket', spent: 1840, budget: 2000, color: '#9184d9' },
  { id: 'casa', name: 'Casa', icon: 'ph-house-line', spent: 2200, budget: 2200, color: '#796cbf' },
  { id: 'transporte', name: 'Transporte', icon: 'ph-car', spent: 640, budget: 700, color: '#5d5294' },
  { id: 'lazer', name: 'Lazer', icon: 'ph-fork-knife', spent: 980, budget: 800, color: '#c98a8a' },
  { id: 'saude', name: 'Saúde', icon: 'ph-heartbeat', spent: 460, budget: 900, color: '#423a6a' },
];

export const mockTransactions = [
  { id: 1, desc: 'Mercado Extra', icon: 'ph-basket', meta: 'Ana · hoje, 10:24', value: 214.5 },
  { id: 2, desc: 'Conta de luz', icon: 'ph-house-line', meta: 'Rui · ontem, 08:10', value: 189.9 },
  { id: 3, desc: 'Uber', icon: 'ph-car', meta: 'extrato · 17 ago · Transporte', value: 32.4 },
  { id: 4, desc: 'Farmácia', icon: 'ph-heartbeat', meta: 'Ana · 16 ago, 19:02', value: 78.3 },
];
