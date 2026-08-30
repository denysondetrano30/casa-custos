// Formatação de valores em reais, padrão pt-BR
// brl(1234.5) -> "R$ 1.234,50"
// brl(1234.5, false) -> "R$ 1.235" (sem centavos, usado em rótulos de orçamento e gráficos)

export function brl(v, cents = true) {
  const value = Number(v) || 0;
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}
