// As metas conversando com o resto do app.
//
// Antes a tela de Metas era uma ilha: ela prometia "aporte mensal de
// R$ 400" e esses R$ 400 não apareciam em lugar nenhum — nem como
// dinheiro reservado no Início, nem na previsão dos próximos meses — e
// fechar o mês não movia meta nenhuma. Dava pra ficar meses achando que
// estava guardando sem nunca ter guardado.
//
// Decisão importante: o aporte NÃO é um gasto e NÃO entra na divisão
// entre vocês. Guardar dinheiro não é uma conta que alguém paga; é uma
// reserva do que sobrou. Então ele não passa por commitments.js nem
// mexe no que cada um deve — só desconta do "livre pra gastar".

// Uma meta ainda está ativa enquanto não alcançou o alvo.
export function metaAtiva(goal) {
  return (goal?.saved || 0) < (goal?.target || 0);
}

// Uma meta já recebeu o aporte deste mês? Guardamos o rótulo do mês no
// próprio registro (`aportadoEm`) — é o que impede o dinheiro de ser
// contado duas vezes quando a pessoa registra o aporte na mão E depois
// fecha o mês.
export function jaAportouNoMes(goal, mesLabel) {
  return !!mesLabel && goal?.aportadoEm === mesLabel;
}

// Quanto ainda falta guardar neste mês. Uma meta que já recebeu o aporte
// (na mão ou no fechamento) não reserva mais nada — antes ela continuava
// reservando o valor cheio e o "livre pra gastar" ficava menor do que a
// realidade.
export function aporteMensalTotal(goals = [], mesLabel) {
  return (goals || []).filter(metaAtiva).reduce((soma, g) => {
    if (jaAportouNoMes(g, mesLabel)) return soma;
    const falta = Math.max(0, (g.target || 0) - (g.saved || 0));
    return soma + Math.max(0, Math.min(g.monthly || 0, falta));
  }, 0);
}

// No fechamento do mês, cada meta ativa recebe o aporte do mês. É o que
// faz a barra de progresso andar sozinha, sem depender de alguém lembrar
// de tocar em "Registrar aporte" todo mês. Devolve as metas atualizadas
// e o total efetivamente guardado, pro resumo do mês.
export function aplicarAportesDoMes(goals = [], mesLabel) {
  let guardado = 0;
  const novas = (goals || []).map((g) => {
    if (!metaAtiva(g) || !(g.monthly > 0)) return g;
    // Já registrou o aporte deste mês na mão? Então o fechamento não
    // soma de novo — era isso que fazia a meta afirmar um dinheiro
    // guardado que não existia.
    if (jaAportouNoMes(g, mesLabel)) return g;
    const falta = Math.max(0, (g.target || 0) - (g.saved || 0));
    const aporte = Math.min(g.monthly, falta);
    guardado += aporte;
    return { ...g, saved: (g.saved || 0) + aporte, aportadoEm: mesLabel || g.aportadoEm };
  });
  return { goals: novas, guardado };
}
