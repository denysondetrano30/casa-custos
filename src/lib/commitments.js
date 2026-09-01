// Monta a lista de "compromissos do mês" que alimenta o algoritmo de
// divisão (src/lib/split.js): só dinheiro real, comprometido de verdade —
// contas fixas e compras conjuntas importadas do cartão. O orçamento de
// categoria (ex. "Mercado: R$ 1.000") é uma meta pra acompanhar o gasto,
// não é um valor já gasto ou já comprometido, então não entra na divisão.

// Dado uma compra conjunta, decide em qual "compromisso" da divisão ela
// entra. Toda compra que veio do cartão (importada por CSV ou lançada na
// mão) junta numa fatura só, mesmo que seja categorizada como Mercado —
// é assim que sai do bolso de vocês de verdade, numa cobrança só do
// cartão no fim do mês, não uma dívida separada por compra. A categoria
// "Mercado" aqui é só pra saber "onde foi" o dinheiro, não muda como ela
// entra na divisão. (O mercado do dia a dia, registrado pela aba Feira,
// é outra coisa completamente — nem passa por aqui, ver nota acima.)
// Quando a compra já tiver um cartão identificado (ver cadastro de
// cartões), agrupa por cartão; enquanto isso não existe pra ela, cai numa
// fatura geral única.
export function commitmentIdForSharedPurchase(p) {
  return `cartao-${p.cardId || '_geral'}`;
}

export function buildCommitments(state) {
  const commitments = state.bills.map((b) => ({
    id: `bill-${b.id}`,
    name: b.name,
    value: b.value,
    owner: b.owner,
  }));

  // Uma compra já marcada como paga (ver Contas → Este mês, ou Perfil) já
  // foi resolvida entre vocês de outro jeito — não faz sentido continuar
  // dividindo um valor que já está quitado, então ela sai da conta daqui
  // pra frente. (Diferente de conta fixa, que continua contando mesmo
  // marcada como paga — ver nota no Perfil.)
  const compras = (state.sharedPurchases || []).filter((p) => !p.paid);

  const porCartao = {};
  compras.forEach((p) => {
    const chave = p.cardId || '_geral';
    (porCartao[chave] = porCartao[chave] || []).push(p);
  });
  Object.entries(porCartao).forEach(([chave, itens]) => {
    const total = itens.reduce((s, p) => s + p.value, 0);
    const cartao = (state.cards || []).find((c) => c.id === chave);
    commitments.push({
      id: `cartao-${chave}`,
      name: cartao ? `Fatura ${cartao.name}` : 'Fatura do cartão',
      value: total,
    });
  });

  return commitments;
}
