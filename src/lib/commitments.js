// Monta a lista de "compromissos do mês" que alimenta o algoritmo de
// divisão (src/lib/split.js): só dinheiro real, comprometido de verdade —
// contas fixas e compras conjuntas importadas do cartão. O orçamento de
// categoria (ex. "Mercado: R$ 1.000") é uma meta pra acompanhar o gasto,
// não é um valor já gasto ou já comprometido, então não entra na divisão.
export function buildCommitments(state) {
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

  return commitments;
}
