import { describe, it, expect } from 'vitest';
import { splitBills } from './split';

describe('splitBills', () => {
  it('divide 80/20 com no máximo uma conta partida ao meio', () => {
    const commitments = [
      { id: 1, name: 'Aluguel', value: 2000 },
      { id: 2, name: 'Mercado', value: 1200 },
      { id: 3, name: 'Internet', value: 150 },
      { id: 4, name: 'Streaming', value: 50 },
    ];

    const result = splitBills(commitments, 80, ['Rui', 'Ana']);

    const total = commitments.reduce((s, c) => s + c.value, 0);
    const somaRui = result.Rui.reduce((s, i) => s + i.part, 0);
    const somaAna = result.Ana.reduce((s, i) => s + i.part, 0);

    // A soma das partes tem que bater com o total, sem sobrar nem faltar.
    expect(Math.round((somaRui + somaAna) * 100) / 100).toBe(total);

    // No máximo uma conta dividida entre os dois.
    const itensDivididos = [...result.Rui, ...result.Ana].filter((i) => i.shared);
    expect(itensDivididos.length).toBeLessThanOrEqual(2); // 2 porque a conta dividida aparece nos dois lados
  });

  it('conta pessoal com dono vai inteira pro dono, mesmo sendo pequena', () => {
    const commitments = [
      { id: 1, name: 'Aluguel', value: 2000 },
      { id: 2, name: 'Cartão do Rui', value: 300, owner: 'Rui' },
    ];

    const result = splitBills(commitments, 80, ['Rui', 'Ana']);

    const cartaoRui = result.Rui.find((i) => i.id === 2);
    expect(cartaoRui.part).toBe(300);
    expect(result.Ana.find((i) => i.id === 2)).toBeUndefined();
  });

  it('50/50 com duas contas iguais não precisa dividir nenhuma', () => {
    const commitments = [
      { id: 1, name: 'Conta A', value: 500 },
      { id: 2, name: 'Conta B', value: 500 },
    ];

    const result = splitBills(commitments, 50, ['Rui', 'Ana']);

    const divididos = [...result.Rui, ...result.Ana].filter((i) => i.shared);
    expect(divididos.length).toBe(0);
    expect(result.Rui[0].part).toBe(500);
    expect(result.Ana[0].part).toBe(500);
  });
});
