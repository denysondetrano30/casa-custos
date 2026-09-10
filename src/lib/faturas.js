// Fatura atual x próxima fatura.
//
// O problema: uma compra no cartão não sai do bolso no dia em que é feita.
// Ela cai na fatura que fecha depois — e se você comprou DEPOIS do
// fechamento, ela só vai ser paga no mês seguinte. Sem isso, o app
// empurrava toda compra pro mês corrente e misturava três calendários:
// a luz de agosto paga em setembro, a fatura de agosto paga em setembro,
// e o mercado de setembro que só vai ser pago em outubro.
//
// A regra que o app segue é caixa: o mês do app é o mês em que o dinheiro
// SAI DA CONTA. Então:
//   - compra antes do fechamento -> cai na fatura deste mês (pesa agora);
//   - compra depois do fechamento -> cai na próxima fatura (pesa no mês
//     que vem, e aqui aparece só como "você já comprou").
//
// Uma compra marcada como `proximaFatura` fica de fora do gasto do mês, da
// divisão e da sobra — mas continua ocupando limite do cartão, porque o
// limite já foi consumido de verdade. No fechamento do mês ela deixa de
// ser "próxima" e passa a ser a fatura atual (ver monthClose.js).

// Em qual fatura cai uma compra feita no dia `dia`, num cartão que fecha
// no dia `closingDay`. Sem dia de fechamento cadastrado, o app não tem
// como saber — assume a fatura atual, que é o comportamento antigo.
export function faturaDaCompra(closingDay, dia) {
  const fechamento = Number(closingDay);
  if (!Number.isInteger(fechamento) || fechamento < 1 || fechamento > 31) return 'atual';
  const diaDaCompra = Number(dia);
  if (!Number.isInteger(diaDaCompra) || diaDaCompra < 1) return 'atual';
  // Fechamento no dia 31 num mês de 30: o banco rola pro último dia, então
  // a comparação usa o menor entre o fechamento e o último dia do mês.
  const ultimoDia = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const corte = Math.min(fechamento, ultimoDia);
  return diaDaCompra > corte ? 'proxima' : 'atual';
}

// Mesma coisa, mas já procurando o cartão na lista.
//
// O dia usado aqui é o do CALENDÁRIO de verdade, não o "dia do mês do
// app": o fechamento do cartão é um evento real, e o mês do app pode
// estar atrasado (ninguém apertou "fechar mês" ainda). Usar o dia do app
// fazia toda compra nova cair na próxima fatura enquanto o fechamento
// estivesse atrasado.
export function faturaDaCompraNoCartao(cards, cardId, agora = new Date()) {
  const cartao = (cards || []).find((c) => c.id === cardId);
  const dia = agora instanceof Date ? agora.getDate() : Number(agora);
  return faturaDaCompra(cartao?.closingDay, dia);
}

// As compras que pesam NESTE mês: tudo menos o que já foi empurrado pra
// próxima fatura. É esse filtro que precisa valer em todo lugar que soma
// dinheiro do mês — senão a compra de outubro entra no gasto de setembro.
export function comprasDesteMes(sharedPurchases) {
  return (sharedPurchases || []).filter((p) => p.proximaFatura !== true);
}

// As que já foram feitas mas só saem do bolso no mês que vem.
export function comprasDaProximaFatura(sharedPurchases) {
  return (sharedPurchases || []).filter((p) => p.proximaFatura === true);
}

// No fechamento do mês, a próxima fatura vira a atual.
export function promoverProximaFatura(sharedPurchases) {
  return comprasDaProximaFatura(sharedPurchases).map((p) => ({ ...p, proximaFatura: false }));
}
