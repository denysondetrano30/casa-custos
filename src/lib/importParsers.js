// Lê um extrato/fatura de cartão exportado em CSV (Nubank, Itaú, etc.)
// e transforma cada linha numa compra que a gente consegue classificar.
// Como cada banco exporta num formato levemente diferente, em vez de ter
// um leitor para cada banco, usamos um leitor "esperto" que tenta
// descobrir sozinho quais colunas são a data, a descrição e o valor.

function detectDelimiter(headerLine) {
  const commas = (headerLine.match(/,/g) || []).length;
  const semis = (headerLine.match(/;/g) || []).length;
  return semis > commas ? ';' : ',';
}

function splitCsvLine(line, delim) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function parseMoney(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (s === '') return null;
  s = s.replace(/r\$/i, '').trim();
  const negative = /^-/.test(s) || /^\(.*\)$/.test(s);
  s = s.replace(/[()]/g, '').replace(/^-/, '').trim();
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}


// Acha "3/8" na descrição, mas só quando é parcela de verdade.
//
// O padrão "número/número" também aparece em data ("UBER *TRIP 12/08"),
// e antes qualquer um deles virava parcelamento — nascia um parcelamento
// fantasma que passava a comprometer os meses futuros e o limite do
// cartão do nada. Agora, para valer como parcela: a atual não pode passar
// do total, o total tem que ser plausível (2 a 48) e, quando não vem a
// palavra "parcela" junto, o total não pode parecer mês (1 a 12 com a
// atual também parecendo dia).
function acharParcela(desc) {
  const texto = String(desc || '');
  const comPalavra = texto.match(/parcela\s*(\d{1,2})\s*\/\s*(\d{1,2})(?!\d)/i);
  // \b nas pontas pra não casar dentro de um número maior: sem isso,
  // "COMPRA 123/456" era lido como parcela 23 de 45.
  const m = comPalavra || texto.match(/(?<!\d)(\d{1,2})\s*\/\s*(\d{1,2})(?!\d)/);
  if (!m) return null;

  const atual = Number(m[1]);
  const total = Number(m[2]);
  if (!atual || !total) return null;
  if (atual > total) return null;      // "12/08" -> 12 de 8 não existe
  if (total < 2 || total > (comPalavra ? 72 : 48)) return null;

  // Sem a palavra "parcela", o que separa "3/8" (parcela) de "12/08"
  // (data) é o zero à esquerda: extrato escreve data com dois dígitos
  // (05/12, 12/08), parcela normalmente sem (3/8). Mas isso só derruba
  // quando o segundo número ainda poderia ser um mês — "03/24" não é
  // data nenhuma, então vale como parcela 3 de 24.
  if (!comPalavra) {
    const temZeroAEsquerda = /^0\d$/.test(m[1]) || /^0\d$/.test(m[2]);
    if (temZeroAEsquerda && total <= 12) return null;
  }
  return { atual, total };
}

// Recebe o texto bruto do CSV e devolve uma lista de compras:
// { id, date, desc, value, parcelaAtual, parcelaTotal }
// Ignora linhas negativas ou zeradas (pagamentos da fatura, estornos).
export function parseExtratoCSV(text) {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const delim = detectDelimiter(lines[0]);
  const rows = lines.map((l) => splitCsvLine(l, delim));

  const headerCols = rows[0].map((c) => normalize(c));
  const hasHeader = headerCols.some((c) =>
    /data|date|valor|amount|descri|lancamento|estabelecimento|title|historico/.test(c)
  );
  const dataRows = hasHeader ? rows.slice(1) : rows;

  let dateIdx = -1;
  let descIdx = -1;
  let valueIdx = -1;
  if (hasHeader) {
    headerCols.forEach((c, i) => {
      if (dateIdx === -1 && /data|date/.test(c)) dateIdx = i;
      if (descIdx === -1 && /descri|lancamento|title|estabelecimento|historico/.test(c)) descIdx = i;
      if (valueIdx === -1 && /valor|amount|value/.test(c)) valueIdx = i;
    });
  }
  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;
  if (valueIdx === -1) valueIdx = dataRows[0] ? dataRows[0].length - 1 : 2;

  // Cada banco escolhe um sinal para "despesa". Fatura de cartão vem
  // positiva (e o negativo é pagamento da fatura ou estorno); extrato de
  // conta corrente vem ao contrário: despesa negativa, entrada positiva.
  //
  // Contar sinal não basta: uma fatura de mês fraco pode ter mais
  // estornos que compras e seria lida ao contrário, importando o
  // pagamento da fatura como gasto. Então a gente olha o que as linhas
  // NEGATIVAS dizem: se elas são explicáveis numa fatura (pagamento,
  // estorno, crédito), é fatura e o positivo é a despesa. Se são nomes de
  // estabelecimento, é extrato de conta corrente e a despesa é o negativo.
  const linhasNegativas = dataRows
    .map((r) => ({ v: parseMoney(r[valueIdx]), desc: String(r[descIdx] || '') }))
    .filter((l) => l.v !== null && l.v < 0);
  const explicaveisNaFatura = linhasNegativas.filter((l) =>
    /pagamento|estorno|recebid|devolu|reembols|cr[eé]dito|cashback|anuidade|desconto/i.test(l.desc)
  ).length;
  const despesaEhNegativa =
    linhasNegativas.length > 0 && explicaveisNaFatura < linhasNegativas.length / 2;

  const items = [];
  for (const r of dataRows) {
    if (r.length < 2) continue;
    const bruto = parseMoney(r[valueIdx]);
    if (bruto === null || bruto === 0) continue;
    const value = despesaEhNegativa ? -bruto : bruto;
    if (value <= 0) continue; // do outro lado do sinal: pagamento/estorno/entrada
    const desc = (r[descIdx] || '').trim() || 'Compra';
    const dateRaw = (r[dateIdx] || '').trim();
    const parcela = acharParcela(desc);
    items.push({
      id: `${dateRaw}-${desc}-${value}-${Math.random().toString(36).slice(2, 8)}`,
      date: dateRaw,
      desc,
      value,
      parcelaAtual: parcela ? parcela.atual : null,
      parcelaTotal: parcela ? parcela.total : null,
    });
  }
  return items;
}

// Tenta adivinhar a categoria de uma compra pelo nome do estabelecimento.
// É só um ponto de partida — a pessoa sempre pode trocar antes de importar.
const KEYWORDS = {
  mercado: ['mercado', 'supermerc', 'hortifruti', 'sacolao', 'assai', 'carrefour', 'pao de acucar', 'atacadao', 'hiper'],
  transporte: ['uber', '99app', '99 ', 'posto ', 'ipiranga', 'shell', 'combustivel', 'estacionamento', 'pedagio', 'metro', 'onibus'],
  saude: ['farmacia', 'drogaria', 'drogasil', 'pague menos', 'laboratorio', 'clinica', 'hospital'],
  lazer: ['netflix', 'spotify', 'ifood', 'cinema', 'restaurante', 'lanchonete', 'disney', 'prime video', 'hbo', 'bar '],
};

export function guessCategory(desc, cats) {
  const d = normalize(desc);
  for (const [catId, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => d.includes(normalize(w)))) {
      const found = cats.find((c) => c.id === catId);
      if (found) return found.id;
    }
  }
  return null;
}
