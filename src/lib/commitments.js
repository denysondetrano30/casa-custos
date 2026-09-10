// Monta a lista de "compromissos do mês" que alimenta o algoritmo de
// divisão (src/lib/split.js): só dinheiro real, comprometido de verdade —
// contas fixas e compras conjuntas importadas do cartão. O orçamento de
// categoria (ex. "Mercado: R$ 1.000") é uma meta pra acompanhar o gasto,
// não é um valor já gasto ou já comprometido, então não entra na divisão.

import { comprasDesteMes } from './faturas';

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
// O split.js faz `result[item.owner].push(...)` sem guarda: um `owner`
// que não seja exatamente 'Rui' ou 'Ana' derruba o app inteiro em tela
// branca (e o estado vem de um documento compartilhado na nuvem, então
// basta uma escrita de outra versão pra travar a casa). O split.js é
// congelado por contrato, então a validação vive aqui — é por onde todo
// `owner` passa antes de chegar lá.
function donoValido(owner) {
  return owner === 'Rui' || owner === 'Ana' ? owner : undefined;
}

export function commitmentIdForSharedPurchase(p) {
  return `cartao-${p.cardId || '_geral'}`;
}

export function buildCommitments(state) {
  const commitments = state.bills.map((b) => ({
    id: `bill-${b.id}`,
    name: b.name,
    value: b.value,
    owner: donoValido(b.owner),
  }));

  // IMPORTANTE: aqui entram TODAS as compras, pagas ou não. O algoritmo de
  // divisão (split.js) é guloso e ordena por valor — se a gente tirasse
  // daqui uma compra só porque foi marcada como paga, o valor total mudaria
  // e o split.js recalcularia do zero quem fica com o quê, "sequestrando"
  // outras contas de uma pessoa pra outra sem ninguém ter pedido isso. A
  // divisão em si (quem ficou responsável por cada fatura) tem que ficar
  // igual o mês inteiro, não importa o que já foi pago. "Pago" é só uma
  // marcação de acompanhamento — quem quiser saber quanto ainda falta pagar
  // vê isso no Perfil, que desconta o que já foi pago do total de CADA
  // pessoa, sem mexer na divisão em si.
  // Fora a próxima fatura: ela já foi comprada, mas só sai do bolso no
  // mês que vem, então não entra na divisão deste mês.
  const compras = comprasDesteMes(state.sharedPurchases);

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
      // Quem paga a fatura é o dono do cartão — o split.js prende a conta
      // nele em vez de sugerir que a outra pessoa pague o cartão alheio.
      // A diferença entre o que cada um desembolsa e o que cada um deveria
      // bancar sai numa transferência só (ver src/lib/settlement.js).
      owner: donoValido(cartao?.owner),
    });
  });

  return commitments;
}
