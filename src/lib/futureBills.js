// Calcula a previsão de gastos de cada um dos próximos 6 meses.
// README.md, seção "Fatura futura":
//   total(mês k) = assinaturas no cartão + média de mercado
//                  + Σ parcelas ativas em k + simulação(k)
//   parcela ativa em k quando done + 1 + k <= count.
// Além disso somamos as contas fixas (Aluguel, Água, Luz...): elas se
// repetem todo mês, então valem também para os meses futuros, não só
// para o mês atual.
export function buildFutureMonths(state, simulacao) {
  const mediaMercado = state.cats.find((c) => c.id === 'mercado')?.budget || 0;
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
      mediaMercado,
      parcelasAtivas,
      contasFixas,
      totalContasFixas,
      totalSimulacao,
      total: mediaMercado + totalContasFixas + totalParcelas + totalSimulacao,
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
