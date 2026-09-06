// Fechamento de mês: monta uma "foto" (snapshot) do mês que está terminando
// e devolve o estado zerado, pronto pro mês novo.
// README continua valendo pro resto do app — isso aqui só decide o que é
// "deste mês" (zera) e o que é permanente/recorrente (continua igual):
// zera: cats.spent, txs, sharedPurchases, gastos pessoais variáveis, extras.
// continua igual: bills (contas fixas), personal.fixed; installments
// (parcelas) continuam, mas andam uma parcela a cada fechamento
// (contas pessoais fixas), goals, splitPct, names, personalCategories.

import { commitmentIdForSharedPurchase } from './commitments';

const MESES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function proximoMes(label) {
  const [nomeMes, anoStr] = label.split(' ');
  const idx = MESES_FULL.findIndex((m) => m.toLowerCase() === (nomeMes || '').toLowerCase());
  const idxAtual = idx === -1 ? 0 : idx;
  let ano = Number(anoStr) || new Date().getFullYear();
  let novoIdx = idxAtual + 1;
  if (novoIdx > 11) {
    novoIdx = 0;
    ano += 1;
  }
  const daysInMonth = new Date(ano, novoIdx + 1, 0).getDate();
  return { label: `${MESES_FULL[novoIdx]} ${ano}`, daysInMonth };
}

// Acha, dentro do resultado da divisão (splitBills), quem ficou responsável
// por um compromisso específico (uma conta fixa ou uma compra conjunta) —
// usado pra registrar, no fechamento do mês, quem ainda devia o quê.
function responsavelDoCompromisso(commitmentId, splitResult) {
  if (!splitResult) return [];
  const responsaveis = [];
  for (const pessoa of Object.keys(splitResult)) {
    const item = splitResult[pessoa].find((i) => i.id === commitmentId);
    if (item) responsaveis.push({ pessoa, part: item.part });
  }
  return responsaveis;
}

// Monta o resumo do mês que está sendo fechado — isso é o que fica
// guardado no histórico, pra consultar depois. `splitResult` (opcional) é
// o resultado de splitBills daquele mês, usado só pra registrar quem ficou
// de pagar cada pendência — não influencia nenhum valor somado aqui.
export function buildSnapshot(state, splitResult) {
  const catsSpentRaw = state.cats.reduce((s, c) => s + c.spent, 0);
  const billsAll = state.bills.reduce((s, b) => s + b.value, 0);
  const sharedAll = (state.sharedPurchases || []).reduce((s, p) => s + p.value, 0);
  const gastoTotalCasal = catsSpentRaw + billsAll + sharedAll;

  const cats = state.cats.map((c) => {
    const contasFixasCat = state.bills.filter((b) => b.category === c.id).reduce((s, b) => s + b.value, 0);
    const comprasCat = (state.sharedPurchases || []).filter((p) => p.category === c.id).reduce((s, p) => s + p.value, 0);
    return { id: c.id, name: c.name, budget: c.budget, spent: c.spent + contasFixasCat + comprasCat };
  });

  const extrasTotal = ['Rui', 'Ana'].reduce((s, p) => s + (state.extras[p] || []).reduce((ss, e) => ss + e.v, 0), 0);
  const rendaCasal = (state.income.Rui || 0) + (state.income.Ana || 0) + extrasTotal;

  const personalVariableTotal = ['Rui', 'Ana'].reduce(
    (s, p) => s + (state.personal[p]?.variable || []).reduce((ss, i) => ss + i.value, 0),
    0
  );

  // Tudo que, na hora de fechar o mês, ainda não tinha sido marcado como
  // pago — fica registrado no histórico com quem era o responsável, pra
  // não perder o rastro de uma pendência que atravessou o fechamento.
  const pendencias = [
    ...state.bills
      .filter((b) => !b.paid)
      .map((b) => ({ tipo: 'conta', name: b.name, value: b.value, responsaveis: responsavelDoCompromisso(`bill-${b.id}`, splitResult) })),
    ...(state.sharedPurchases || [])
      .filter((p) => !p.paid)
      .map((p) => ({
        tipo: 'compra',
        name: p.name,
        value: p.value,
        responsaveis: responsavelDoCompromisso(commitmentIdForSharedPurchase(p), splitResult),
      })),
  ];

  return {
    id: Date.now(),
    label: state.month.label,
    fechadoEm: new Date().toISOString(),
    cats,
    billsTotal: billsAll,
    sharedPurchasesTotal: sharedAll,
    gastoTotalCasal,
    rendaCasal,
    personalVariableTotal,
    pendencias,
  };
}

// Devolve o novo estado: histórico com o mês fechado guardado, e tudo que
// é "deste mês" zerado pro mês que está começando.
export function resetForNextMonth(state, snapshot) {
  const { label, daysInMonth } = proximoMes(state.month.label);
  return {
    ...state,
    // Sem `today` aqui de propósito: o dia é calculado na hora, em
    // src/lib/hoje.js — gravado, ele congelava e nunca mais avançava.
    month: { label, daysInMonth, status: 'no ritmo' },
    cats: state.cats.map((c) => ({ ...c, spent: 0 })),
    txs: [],
    // O "pago" é sempre relativo ao mês em curso — no mês novo, a conta
    // fixa (que continua existindo, pois é recorrente) volta a ficar
    // pendente até ser paga de novo.
    bills: state.bills.map((b) => ({ ...b, paid: false })),
    sharedPurchases: [],
    // Passou um mês: cada parcelamento em aberto andou uma parcela. Os que
    // chegaram na última somem da lista — estão quitados. Antes disso, o
    // contador nunca avançava e "parcela 1 de 12" ficava para sempre,
    // projetando 12 meses à frente todo mês.
    installments: (state.installments || [])
      .map((i) => {
        // Sem um número de parcelas válido não dá pra saber se acabou —
        // deixa o registro quieto em vez de apagar por engano.
        if (!Number.isFinite(i.count) || i.count <= 0) return i;
        return { ...i, done: Math.min((i.done || 0) + 1, i.count) };
      })
      .filter((i) => !Number.isFinite(i.count) || i.count <= 0 || i.done < i.count),
    // Contas pessoais fixas continuam existindo (são recorrentes) e o
    // "pago" delas volta a ficar pendente, igual as contas de casa. Os
    // gastos pessoais variáveis são pontuais desse mês, então somem
    // inteiros — nem precisam resetar o "pago".
    personal: {
      Rui: { ...state.personal.Rui, fixed: state.personal.Rui.fixed.map((i) => ({ ...i, paid: false })), variable: [] },
      Ana: { ...state.personal.Ana, fixed: state.personal.Ana.fixed.map((i) => ({ ...i, paid: false })), variable: [] },
    },
    extras: { Rui: [], Ana: [] },
    historico: [snapshot, ...(state.historico || [])],
  };
}
