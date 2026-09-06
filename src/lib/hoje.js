// Que dia do mês o app deve considerar como "hoje".
//
// Isso não é tão óbvio quanto parece: o "mês" do app (month.label) só
// avança quando alguém aperta "Fechar mês", então ele pode estar
// atrasado em relação ao calendário de verdade. As três situações:
//
//   - mês do app = mês real  -> o dia de hoje mesmo (é o caso normal);
//   - mês do app já passou   -> o mês acabou e ninguém fechou ainda, então
//                               vale o último dia: tudo daquele mês venceu;
//   - mês do app no futuro   -> ainda não começou, vale o dia 1.
//
// Antes disso existir, o dia ficava congelado no que estivesse gravado no
// estado (30 no começo, 1 depois do primeiro fechamento) e nunca mudava —
// era o que fazia o aviso de conta vencida disparar para tudo ou para nada.

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function diaDeHoje(month, agora = new Date()) {
  const diasNoMes = month?.daysInMonth || 30;
  const [nomeMes, anoStr] = String(month?.label || '').split(' ');
  const idxMes = MESES.findIndex((m) => m.toLowerCase() === (nomeMes || '').toLowerCase());
  const ano = Number(anoStr);

  // Sem label reconhecível, o melhor palpite é o dia real mesmo.
  if (idxMes === -1 || !ano) return Math.min(agora.getDate(), diasNoMes);

  const anoReal = agora.getFullYear();
  const mesReal = agora.getMonth();

  if (ano === anoReal && idxMes === mesReal) {
    return Math.min(agora.getDate(), diasNoMes);
  }

  const mesDoAppEstaNoFuturo = ano > anoReal || (ano === anoReal && idxMes > mesReal);
  return mesDoAppEstaNoFuturo ? 1 : diasNoMes;
}
