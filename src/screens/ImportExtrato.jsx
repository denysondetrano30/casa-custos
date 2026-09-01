import { useState } from 'react';
import { X, UploadSimple } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';
import { parseExtratoCSV, guessCategory } from '../lib/importParsers';

const inputStyle = {
  width: '100%',
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.row,
  padding: '10px 12px',
  color: color.text,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

// Formulário de lançamento manual — precisa viver FORA do componente
// ImportExtrato. Se ele fosse definido dentro (como função interna), toda
// vez que alguém digitasse uma letra o React entenderia que é um
// componente "novo" (referência de função diferente a cada render) e
// recriava o campo do zero, derrubando o foco — por isso a "janela
// fechava" ao digitar a primeira letra.
function ManualForm({ manual, onChangeManual, onAdicionar, compact }) {
  const podeAdicionar = manual.desc.trim() && manual.value.trim();
  return (
    <div
      style={{
        background: color.surfaceInset,
        borderRadius: radius.card,
        padding: 14,
        marginBottom: compact ? 20 : 18,
      }}
    >
      <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 10 }}>
        {compact ? '+ Lançar outra compra manualmente' : 'Ou lance as compras manualmente'}
      </div>
      {!compact && (
        <div style={{ fontSize: 11, color: color.textWeak, marginBottom: 10, lineHeight: 1.5 }}>
          Pra quando o banco (ex. Itaú) só exporta o PDF da fatura, não o CSV — digite cada compra olhando pro
          extrato.
        </div>
      )}
      <input
        value={manual.desc}
        onChange={(e) => onChangeManual({ ...manual, desc: e.target.value })}
        placeholder="Nome da compra (ex. Farmácia São João)"
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={manual.value}
          onChange={(e) => onChangeManual({ ...manual, value: e.target.value })}
          placeholder="Valor (ex. 45,90)"
          inputMode="decimal"
          style={{ ...inputStyle, flex: 1 }}
        />
        <input
          value={manual.parcelaAtual}
          onChange={(e) => onChangeManual({ ...manual, parcelaAtual: e.target.value })}
          placeholder="Parcela nº"
          inputMode="numeric"
          style={{ ...inputStyle, width: 90 }}
        />
        <input
          value={manual.parcelaTotal}
          onChange={(e) => onChangeManual({ ...manual, parcelaTotal: e.target.value })}
          placeholder="de quantas"
          inputMode="numeric"
          style={{ ...inputStyle, width: 90 }}
        />
      </div>
      <div style={{ fontSize: 10.5, color: color.textWeak, marginTop: 6, marginBottom: 10 }}>
        Só preenche "Parcela nº" e "de quantas" se for uma compra parcelada (ex. 3 e 5, pra parcela 3 de 5).
      </div>
      <button
        onClick={onAdicionar}
        disabled={!podeAdicionar}
        style={{
          width: '100%',
          padding: '11px 0',
          borderRadius: radius.row,
          border: `1px solid ${podeAdicionar ? color.accent : 'transparent'}`,
          background: podeAdicionar ? color.accentSoft : 'transparent',
          color: podeAdicionar ? color.accentLight : 'rgba(233,233,237,.35)',
          fontSize: 13.5,
          fontWeight: 500,
          cursor: podeAdicionar ? 'pointer' : 'default',
        }}
      >
        + Adicionar compra
      </button>
    </div>
  );
}

function Chip({ active, children, onClick, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? '5px 10px' : '8px 14px',
        borderRadius: radius.chip,
        border: `1px solid ${active ? color.accent : color.border}`,
        background: active ? color.surfaceElevated : 'transparent',
        color: active ? color.accentChipText : 'rgba(233,233,237,.6)',
        fontSize: small ? 11.5 : 13,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// Tela de "Importar extrato": a pessoa cola ou sobe o CSV baixado do banco,
// a gente lê e sugere uma categoria pra cada compra, e ela só confirma ou
// corrige antes de lançar tudo de uma vez.
export default function ImportExtrato({ cats, cards = [], names, onClose, onConfirm }) {
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState(null); // null = ainda não leu/lançou nada
  const [erro, setErro] = useState('');
  const [cardId, setCardId] = useState(cards[0]?.id || null);
  const [manual, setManual] = useState({ desc: '', value: '', parcelaAtual: '', parcelaTotal: '' });
  const [mostrarManual, setMostrarManual] = useState(false);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => lerTexto(String(reader.result || ''));
    reader.readAsText(file, 'utf-8');
  }

  function lerTexto(texto) {
    setErro('');
    const parsed = parseExtratoCSV(texto);
    if (parsed.length === 0) {
      setErro('Não consegui achar nenhuma compra nesse arquivo. Confira se é o CSV certo (não o PDF da fatura).');
      return;
    }
    setItems((prev) => [
      ...(prev || []),
      ...parsed.map((it) => ({
        ...it,
        classificacao: 'casa',
        // Quando o app não reconhece o estabelecimento, deixa sem categoria
        // (não chuta "Mercado" só porque é a primeira da lista) — senão
        // toda compra não reconhecida (Uber, farmácia, loja qualquer) cai
        // errado dentro de Mercado, tanto no "Onde foi" quanto na Divisão.
        category: guessCategory(it.desc, cats) || '',
      })),
    ]);
  }

  // Pro banco que só exporta PDF da fatura (ex. Itaú), a pessoa digita cada
  // compra na mão — mesmo formato de item que o CSV gera, então entra no
  // mesmo fluxo de revisão e confirmação daqui pra baixo.
  function adicionarManual() {
    const desc = manual.desc.trim();
    const value = Number(manual.value.replace(',', '.'));
    if (!desc) {
      window.alert('Digita o nome da compra.');
      return;
    }
    if (Number.isNaN(value) || value <= 0) {
      window.alert('Digita um valor válido pra compra.');
      return;
    }
    const parcelaAtual = manual.parcelaAtual ? Number(manual.parcelaAtual) : null;
    const parcelaTotal = manual.parcelaTotal ? Number(manual.parcelaTotal) : null;
    const novoItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: '',
      desc,
      value,
      parcelaAtual: parcelaAtual || null,
      parcelaTotal: parcelaTotal || null,
      classificacao: 'casa',
      category: guessCategory(desc, cats) || '',
    };
    setItems((prev) => [...(prev || []), novoItem]);
    setManual({ desc: '', value: '', parcelaAtual: '', parcelaTotal: '' });
  }

  function atualizarItem(id, dados) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...dados } : it)));
  }

  function removerItem(id) {
    setItems((prev) => {
      const restante = prev.filter((it) => it.id !== id);
      return restante.length > 0 ? restante : null;
    });
  }

  const totalSelecionado = items ? items.filter((it) => it.classificacao !== 'ignorar').length : 0;

  return (
    <div style={{ padding: '64px 20px 40px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 17, fontWeight: 500 }}>Importar extrato</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={20} color={color.textMedium} />
        </button>
      </div>

      {items === null && (
        <>
          <div style={{ fontSize: 12.5, color: color.textMedium, marginBottom: 20, lineHeight: 1.5 }}>
            Suba o arquivo CSV da fatura do cartão (Nubank, Itaú ou outro banco — não é o PDF, é o arquivo que o app do
            banco chama de "exportar CSV" ou "extrato em planilha"). Depois você escolhe, compra por compra, se foi
            gasto de casa ou gasto pessoal, antes de lançar.
          </div>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              padding: 28,
              border: `1px dashed ${color.chart[2]}`,
              borderRadius: radius.card,
              background: color.surfaceInset,
              cursor: 'pointer',
              marginBottom: 18,
            }}
          >
            <UploadSimple size={22} color={color.accentIcon} />
            <span style={{ fontSize: 13, color: color.text }}>Escolher arquivo CSV</span>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: 'none' }} />
          </label>

          <div style={{ fontSize: 11, color: color.textWeak, marginBottom: 8 }}>
            Ou cole aqui o conteúdo do arquivo:
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="data,descrição,valor..."
            rows={5}
            style={{
              width: '100%',
              background: color.surface,
              border: `1px solid ${color.border}`,
              borderRadius: radius.row,
              padding: '11px 12px',
              color: color.text,
              fontSize: 12.5,
              outline: 'none',
              marginBottom: 12,
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
          {erro && <div style={{ fontSize: 12, color: color.alertBar, marginBottom: 12 }}>{erro}</div>}
          <button
            onClick={() => lerTexto(rawText)}
            disabled={!rawText.trim()}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: radius.row,
              border: `1px solid ${rawText.trim() ? color.accent : 'transparent'}`,
              background: rawText.trim() ? color.accentSoft : 'transparent',
              color: rawText.trim() ? color.accentLight : 'rgba(233,233,237,.35)',
              fontSize: 14.5,
              fontWeight: 500,
              cursor: rawText.trim() ? 'pointer' : 'default',
            }}
          >
            Ler extrato colado
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: color.border }} />
            <span style={{ fontSize: 11, color: color.textWeak }}>ou</span>
            <div style={{ flex: 1, height: 1, background: color.border }} />
          </div>

          <ManualForm manual={manual} onChangeManual={setManual} onAdicionar={adicionarManual} />
        </>
      )}

      {items !== null && (
        <>
          <div style={{ fontSize: 12, color: color.textMedium, marginBottom: 16 }}>
            Achei {items.length} {items.length === 1 ? 'compra' : 'compras'}. Confira a classificação de cada uma antes
            de importar — o app só chuta a categoria, quem sabe é você.
          </div>

          {cards.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 8 }}>
                De qual cartão é esse extrato?
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Chip active={cardId === null} onClick={() => setCardId(null)}>
                  Nenhum / não sei
                </Chip>
                {cards.map((c) => (
                  <Chip key={c.id} active={cardId === c.id} onClick={() => setCardId(c.id)}>
                    {c.name}
                  </Chip>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: color.textWeak, marginTop: 6 }}>
                Isso é só pra acompanhar o limite do cartão em Contas → Cartões — não muda a divisão de ninguém.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {items.map((it) => (
              <div
                key={it.id}
                style={{
                  background: color.surface,
                  borderRadius: radius.row,
                  padding: '11px 14px',
                  opacity: it.classificacao === 'ignorar' ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.desc}
                    </div>
                    <div style={{ fontSize: 10.5, color: color.textWeak }}>
                      {it.date || 'lançada na mão'}
                      {it.parcelaTotal ? ` · parcela ${it.parcelaAtual}/${it.parcelaTotal}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 13.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {brl(it.value)}
                  </span>
                  <button
                    onClick={() => removerItem(it.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                    aria-label={`Remover ${it.desc}`}
                  >
                    <X size={14} color={color.textWeak} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: it.classificacao === 'casa' ? 8 : 0 }}>
                  <Chip small active={it.classificacao === 'casa'} onClick={() => atualizarItem(it.id, { classificacao: 'casa' })}>
                    Casa
                  </Chip>
                  <Chip small active={it.classificacao === 'Rui'} onClick={() => atualizarItem(it.id, { classificacao: 'Rui' })}>
                    Pessoal · {names.Rui}
                  </Chip>
                  <Chip small active={it.classificacao === 'Ana'} onClick={() => atualizarItem(it.id, { classificacao: 'Ana' })}>
                    Pessoal · {names.Ana}
                  </Chip>
                  <Chip small active={it.classificacao === 'ignorar'} onClick={() => atualizarItem(it.id, { classificacao: 'ignorar' })}>
                    Ignorar
                  </Chip>
                </div>

                {it.classificacao === 'casa' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {cats.map((c) => (
                      <Chip small key={c.id} active={it.category === c.id} onClick={() => atualizarItem(it.id, { category: c.id })}>
                        {c.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {mostrarManual ? (
            <ManualForm manual={manual} onChangeManual={setManual} onAdicionar={adicionarManual} compact />
          ) : (
            <button
              onClick={() => setMostrarManual(true)}
              style={{
                width: '100%',
                padding: '11px 0',
                marginBottom: 18,
                borderRadius: radius.row,
                border: `1px dashed ${color.border}`,
                background: 'transparent',
                color: color.textMedium,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + Lançar outra compra manualmente
            </button>
          )}

          <button
            onClick={() =>
              onConfirm(items.map((it) => (it.classificacao === 'casa' ? { ...it, cardId } : it)))
            }
            disabled={totalSelecionado === 0}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: radius.row,
              border: `1px solid ${totalSelecionado > 0 ? color.accent : 'transparent'}`,
              background: totalSelecionado > 0 ? color.accentSoft : 'transparent',
              color: totalSelecionado > 0 ? color.accentLight : 'rgba(233,233,237,.35)',
              fontSize: 15,
              fontWeight: 500,
              cursor: totalSelecionado > 0 ? 'pointer' : 'default',
            }}
          >
            Importar {totalSelecionado} {totalSelecionado === 1 ? 'item' : 'itens'}
          </button>
        </>
      )}

      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '12px 0',
          marginTop: 10,
          background: 'transparent',
          border: 'none',
          color: color.textMedium,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Cancelar
      </button>
    </div>
  );
}
