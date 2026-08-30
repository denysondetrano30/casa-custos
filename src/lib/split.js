// Algoritmo de divisão das contas — README.md, seção "Regras de negócio".
//
// Entrada:
//   commitments: [{ id, name, value, owner? }]   — compromissos do mês
//                (owner = pessoa dona de uma conta pessoal, ex. cartão de cada um)
//   pctA: número de 0 a 100                      — % da renda que cabe à pessoa A
//   names: [nomeA, nomeB]                        — ex. ['Rui', 'Ana']
//
// Saída: { [nomeA]: [...itens com part], [nomeB]: [...itens com part] }
// Cada item ganha `part` (quanto daquele item cabe àquela pessoa) e,
// quando um item foi dividido ao meio, `shared: true` nos dois lados.
//
// Regra de ouro do design: no máximo UMA conta dividida — o resto inteiro.
export function splitBills(commitments, pctA, names = ['A', 'B']) {
  const [A, B] = names;
  const total = commitments.reduce((sum, c) => sum + c.value, 0);

  const need = {
    [A]: total * (pctA / 100),
    [B]: 0,
  };
  need[B] = total - need[A];

  const result = { [A]: [], [B]: [] };

  // 1. Ordena por valor decrescente.
  const sorted = [...commitments].sort((a, b) => b.value - a.value);

  // 2. Itens com dono vão direto pro dono (pinned), tirando do need dele.
  const remaining = [];
  for (const item of sorted) {
    if (item.owner) {
      result[item.owner].push({ ...item, part: item.value });
      need[item.owner] -= item.value;
    } else {
      remaining.push(item);
    }
  }

  // 3. Para cada item restante, dá pra quem tem mais "need" sobrando.
  for (const item of remaining) {
    const p = need[A] >= need[B] ? A : B;
    const other = p === A ? B : A;

    if (item.value <= need[p] + 0.5) {
      // Cabe inteiro na pessoa p.
      result[p].push({ ...item, part: item.value });
      need[p] -= item.value;
    } else if (need[p] > 20) {
      // Divide: uma parte pra p (o que falta pra fechar o need dele),
      // o resto pra outra pessoa. É a única conta que pode ser dividida.
      const parte = Math.round(need[p] * 100) / 100;
      const resto = Math.round((item.value - parte) * 100) / 100;
      result[p].push({ ...item, part: parte, shared: true });
      result[other].push({ ...item, part: resto, shared: true });
      need[p] = 0;
    } else {
      // need[p] pequeno demais pra valer dividir — item inteiro pra outra pessoa.
      result[other].push({ ...item, part: item.value });
      need[other] -= item.value;
    }
  }

  return result;
}
