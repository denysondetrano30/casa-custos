// O acerto do mês: uma transferência só, no valor da diferença.
//
// O problema que isso resolve: o algoritmo de divisão (split.js) distribui
// as contas inteiras pra fechar a porcentagem, mas ele não sabe QUEM paga
// cada conta na vida real. Então ele sugeria coisas como "Rui paga a
// fatura do cartão de Ana" e "Ana paga parte da fatura do cartão de Rui"
// — e o casal acabava transferindo dinheiro pros dois lados pra pagar o
// cartão do outro, sem necessidade.
//
// Agora cada conta pode ter um dono (`owner`): quem manda o dinheiro pro
// banco. O split.js já respeita isso (prende a conta no dono). O que
// faltava era a conta final: comparar o que cada um DESEMBOLSA com o que
// cada um DEVERIA bancar pela porcentagem, e resolver a diferença numa
// transferência só.
//
// Exemplo (60% / 40%): cartão de Ana R$ 1.400, cartão de Rui R$ 600.
//   total 2.000 · parte de Rui 1.200 · parte de Ana 800
//   Rui desembolsa 600 (o próprio cartão), deveria bancar 1.200
//   -> Rui transfere 600 pra Ana. Uma transferência, e fecha.

export function buildSettlement(splitResult, pctA, pessoas = ['Rui', 'Ana']) {
  const [a, b] = pessoas;
  const desembolso = {
    [a]: (splitResult?.[a] || []).reduce((s, i) => s + (i.part || 0), 0),
    [b]: (splitResult?.[b] || []).reduce((s, i) => s + (i.part || 0), 0),
  };
  const total = desembolso[a] + desembolso[b];

  const deveBancar = {
    [a]: total * (pctA / 100),
    [b]: total - total * (pctA / 100),
  };

  // Positivo = pagou mais que a própria parte, então tem a receber.
  const saldo = {
    [a]: desembolso[a] - deveBancar[a],
    [b]: desembolso[b] - deveBancar[b],
  };

  // Centavo de arredondamento não vira transferência. O split.js arredonda
  // a conta rachada a centavo em cada lado, então a soma pode ficar meio
  // centavo fora do alvo — e isso virava um acerto fantasma de R$ 0,01.
  const bruto = Math.abs(saldo[a]);
  const quitado = bruto <= 0.011;
  const valor = quitado ? 0 : Math.round(bruto * 100) / 100;

  return {
    total,
    desembolso,
    deveBancar,
    saldo,
    quitado,
    valor: quitado ? 0 : valor,
    // Quem manda o dinheiro e quem recebe (null quando está quitado).
    de: quitado ? null : saldo[a] < 0 ? a : b,
    para: quitado ? null : saldo[a] < 0 ? b : a,
  };
}
