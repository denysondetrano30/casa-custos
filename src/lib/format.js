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

// Lê um valor em dinheiro digitado por gente de verdade e devolve o
// número — ou null se não der pra entender.
//
// O problema que isso resolve: antes cada tela fazia
// `Number(texto.replace(',', '.'))`, e aí "1.500" (mil e quinhentos, do
// jeito que todo mundo escreve) virava 1.5, ou seja R$ 1,50 salvo em
// silêncio; e "1.234,56" virava NaN.
//
// As regras, na ordem:
//   - tem vírgula E ponto  -> ponto é milhar, vírgula é decimal: 1.234,56
//   - só vírgula           -> vírgula é decimal: 12,90
//   - só ponto, com exatamente 3 dígitos depois e nada de "0,xxx"
//                          -> é separador de milhar: 1.500 = mil e quinhentos
//   - resto                -> ponto decimal mesmo: 12.50
export function parseValor(texto) {
  if (texto === null || texto === undefined) return null;
  let s = String(texto).trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
  if (s === '') return null;

  const negativo = s.startsWith('-');
  if (negativo) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s)) return null;

  const temVirgula = s.includes(',');
  const temPonto = s.includes('.');

  if (temVirgula && temPonto) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (temVirgula) {
    s = s.replace(',', '.');
  } else if (temPonto) {
    const partes = s.split('.');
    const ultima = partes[partes.length - 1];
    const soUmPonto = partes.length === 2;
    const pareceDecimal = soUmPonto && (ultima.length !== 3 || partes[0] === '0' || partes[0] === '');
    if (!pareceDecimal) s = s.replace(/\./g, '');
  }

  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return negativo ? -n : n;
}
