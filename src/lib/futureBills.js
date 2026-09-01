// Calcula a previsão de gastos de cada um dos próximos 6 meses, usando só
// compromissos reais: contas fixas (Aluguel, Água, Luz...) + parcelas em
// aberto + a simulação de compra (se houver). O orçamento de categoria
// (ex. "Mercado: R$ 1.000") é só uma meta pra acompanhar o gasto do mês
// atual — não é um gasto que já vai acontecer, então não entra aqui.
export function buildFutureMonths(state, simulacao) {
  const contasFixas = state.bills || [];
  const totalContasFixas = contasFixas.reduce((s, b) => s + b.value, 0);
  const months = [];

  for (let k = 0; k < 6; k++) {
    const parcelasAtivas = state.installments
      .filter((p) => p.done + 1 + k <= p.count)
      .map((p) => ({
        id: p.id,
        name: p.name,
        parcelaAtual: p.done + 1 + k,
        count: p.count,
        value: p.per,
      }));

    const totalParcelas = parcelasAtivas.reduce((s, p) => s + p.value, 0);
    const totalSimulacao = simulacao && simulacao.parcelas > k ? simulacao.per : 0;

    months.push({
      k,
      parcelasAtivas,
      contasFixas,
      totalContasFixas,
      totalSimulacao,
      total: totalContasFixas + totalParcelas + totalSimulacao,
    });
  }

  return months;
}

export function monthLabel(baseLabel, k) {
  // baseLabel tipo "Agosto 2026" -> gera os próximos meses.
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const [nomeMes, ano] = baseLabel.split(' ');
  const idx = meses.findIndex((m) => nomeMes.toLowerCase().startsWith(m));
  const totalIdx = idx + k;
  const novoMes = meses[totalIdx % 12];
  const novoAno = Number(ano) + Math.floor(totalIdx / 12) - (totalIdx < 0 ? 1 : 0);
  return `${novoMes}/${String(novoAno).slice(-2)}`;
}
