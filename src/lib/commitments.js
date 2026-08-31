// Monta a lista de "compromissos do mês" que alimenta o algoritmo de
// divisão (src/lib/split.js): contas fixas + o orçamento de mercado.
// README.md, seção "Divisão das contas — algoritmo".
export function buildCommitments(state) {
  const mercado = state.cats.find((c) => c.id === 'mercado');
  const commitments = state.bills.map((b) => ({
    id: `bill-${b.id}`,
    name: b.name,
    value: b.value,
    owner: b.owner,
  }));

  // Compras conjuntas importadas do extrato do cartão também entram na
  // divisão deste mês, do mesmo jeito que uma conta fixa.
  (state.sharedPurchases || []).forEach((p) => {
    commitments.push({ id: `shared-${p.id}`, name: p.name, value: p.value });
  });

  if (mercado) {
    commitments.push({ id: 'mercado', name: 'Mercado', value: mercado.budget });
  }

  return commitments;
}
