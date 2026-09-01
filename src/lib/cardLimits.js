// Quanto do limite de um cartão já está comprometido — puramente
// informativo, não entra em nenhum cálculo de orçamento, divisão ou 42%
// da renda. É só pra você ver, sem abrir o app do banco, quanto ainda
// sobra de limite considerando o que já foi lançado e as parcelas que
// ainda vão cair nesse cartão nos próximos meses.
import { buildFutureMonths } from './futureBills';

export function buildCardUsage(state, cardId) {
  const comprasDoCartao = (state.sharedPurchases || []).filter((p) => (p.cardId || null) === cardId);
  const faturaDesteMes = comprasDoCartao.reduce((s, p) => s + p.value, 0);

  // A parcela deste mês de cada parcelamento já está contada acima (ela
  // vira uma compra conjunta no mês em que é lançada) — pra não contar
  // duas vezes, as parcelas futuras aqui começam do mês que vem (k=1).
  const meses = buildFutureMonths(state, null);
  const instalmentosDoCartao = new Set(
    (state.installments || []).filter((i) => (i.cardId || null) === cardId).map((i) => i.id)
  );
  const futuroComprometido = meses.slice(1).reduce((total, mes) => {
    const doCartao = mes.parcelasAtivas.filter((p) => instalmentosDoCartao.has(p.id));
    return total + doCartao.reduce((s, p) => s + p.value, 0);
  }, 0);

  return {
    faturaDesteMes,
    futuroComprometido,
    comprometido: faturaDesteMes + futuroComprometido,
  };
}
