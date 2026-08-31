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

  const items = [];
  for (const r of dataRows) {
    if (r.length < 2) continue;
    const value = parseMoney(r[valueIdx]);
    if (value === null || value <= 0) continue; // pagamentos/estornos ficam de fora
    const desc = (r[descIdx] || '').trim() || 'Compra';
    const dateRaw = (r[dateIdx] || '').trim();
    const parcela = desc.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
    items.push({
      id: `${dateRaw}-${desc}-${value}-${Math.random().toString(36).slice(2, 8)}`,
      date: dateRaw,
      desc,
      value,
      parcelaAtual: parcela ? Number(parcela[1]) : null,
      parcelaTotal: parcela ? Number(parcela[2]) : null,
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
