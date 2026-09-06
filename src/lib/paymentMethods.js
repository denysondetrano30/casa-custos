// "Onde foi pago" — a forma de pagamento de um gasto. Serve pra duas
// coisas ao mesmo tempo:
//   1. descrever no app de onde o dinheiro saiu ("no cartão Nubank");
//   2. saber se o dinheiro JÁ saiu da conta (débito, pix, dinheiro) ou se
//      ainda está pendurado na fatura de um cartão, pra pagar depois.
// Um gasto no cartão nasce pendente; um gasto no débito/pix/dinheiro
// nasce já pago, porque saiu na hora.

export const METODOS_A_VISTA = [
  { id: 'debito', label: 'Débito', texto: 'pago no débito' },
  { id: 'pix', label: 'Pix', texto: 'pago no pix' },
  { id: 'dinheiro', label: 'Dinheiro', texto: 'pago em dinheiro' },
];

// Monta a lista de opções da tela de lançamento: primeiro os cartões que
// você cadastrou em Contas → Cartões, depois as formas à vista.
export function opcoesPagamento(cards = []) {
  return [
    ...cards.map((c) => ({ id: `cartao:${c.id}`, label: c.name, cardId: c.id, ehCartao: true })),
    ...METODOS_A_VISTA.map((m) => ({ id: m.id, label: m.label, cardId: null, ehCartao: false })),
  ];
}

// A partir da opção escolhida na tela, devolve o que fica salvo no gasto.
export function pagamentoFromOpcao(opcaoId) {
  if (typeof opcaoId === 'string' && opcaoId.startsWith('cartao:')) {
    // Vai cair na fatura desse cartão — ainda não saiu do bolso.
    return { metodo: 'cartao', cardId: opcaoId.slice('cartao:'.length), paid: false };
  }
  const aVista = METODOS_A_VISTA.find((m) => m.id === opcaoId);
  if (aVista) return { metodo: aVista.id, cardId: null, paid: true };
  return { metodo: null, cardId: null, paid: false };
}

// Texto curto pra aparecer embaixo do gasto nas listas.
export function textoPagamento(item, cards = []) {
  if (!item || !item.metodo) return null;
  if (item.metodo === 'cartao') {
    const cartao = (cards || []).find((c) => c.id === item.cardId);
    return cartao ? `no cartão ${cartao.name}` : 'no cartão';
  }
  return METODOS_A_VISTA.find((m) => m.id === item.metodo)?.texto || null;
}
