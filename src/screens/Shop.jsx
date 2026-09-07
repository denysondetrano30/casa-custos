import { useState } from 'react';
import { X, PencilSimple } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl, parseValor } from '../lib/format';

function getMetodos(names) {
  return [
    { id: 'credito-rui', label: `Crédito · Cartão ${names.Rui}`, payer: 'Rui', credito: true },
    { id: 'credito-ana', label: `Crédito · Cartão ${names.Ana}`, payer: 'Ana', credito: true },
    { id: 'debito', label: 'Débito', payer: null, credito: false },
    { id: 'pix', label: 'Pix', payer: null, credito: false },
  ];
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: '.09em',
        textTransform: 'uppercase',
        color: 'rgba(233,233,237,.5)',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function CarrinhoCard({ items, mercado }) {
  const totalCarrinho = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalUnidades = items.reduce((s, i) => s + i.qty, 0);
  const gastoComCarrinho = mercado.spent + totalCarrinho;
  const pct = Math.min(100, (gastoComCarrinho / mercado.budget) * 100);
  const passou = gastoComCarrinho > mercado.budget;

  return (
    <div
      style={{
        borderRadius: radius.card,
        padding: 20,
        background: `linear-gradient(155deg, ${color.surfaceElevated}, ${color.surface})`,
        boxShadow: `0 0 0 1px ${color.border}`,
        marginBottom: 20,
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>
        {brl(totalCarrinho)}
      </div>
      <div style={{ fontSize: 12, color: color.textMedium, marginBottom: 14 }}>
        {items.length} produtos / {totalUnidades} unidades
      </div>
      <div style={{ height: 6, borderRadius: 99, background: color.borderSubtle, overflow: 'hidden', marginBottom: 6 }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: passou ? color.alertBar : `linear-gradient(90deg, ${color.chart[2]}, ${color.accent})`,
          }}
        />
      </div>
      <div style={{ fontSize: 11.5, color: passou ? color.alertText : color.textMedium }}>
        {passou
          ? `${brl(gastoComCarrinho - mercado.budget)} acima do envelope`
          : `Envelope Mercado: ${brl(gastoComCarrinho)} de ${brl(mercado.budget)}`}
      </div>
    </div>
  );
}

function AdicionarItem({ onAdd }) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [qty, setQty] = useState(1);

  const valorDigitado = parseValor(preco);
  const pronto = nome.trim() !== '' && valorDigitado !== null && valorDigitado > 0;

  function adicionar() {
    if (!pronto) return;
    onAdd({ id: Date.now(), name: nome, unitPrice: valorDigitado, qty });
    setNome('');
    setPreco('');
    setQty(1);
  }

  const inputStyle = {
    flex: 1,
    background: color.surface,
    border: `1px solid ${color.border}`,
    borderRadius: radius.row,
    padding: '10px 12px',
    color: color.text,
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input style={{ ...inputStyle, flex: 2 }} placeholder="Produto" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input style={inputStyle} placeholder="R$ unit." value={preco} onChange={(e) => setPreco(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            style={{ width: 30, height: 30, borderRadius: 99, border: `1px solid ${color.border}`, background: 'transparent', color: color.text, cursor: 'pointer' }}
          >
            −
          </button>
          <span style={{ fontSize: 14, minWidth: 18, textAlign: 'center' }}>{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            style={{ width: 30, height: 30, borderRadius: 99, border: `1px solid ${color.border}`, background: 'transparent', color: color.text, cursor: 'pointer' }}
          >
            +
          </button>
        </div>
        <button
          onClick={adicionar}
          disabled={!pronto}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: radius.row,
            border: `1px solid ${pronto ? color.accent : 'transparent'}`,
            background: pronto ? color.accentSoft : color.surface,
            color: pronto ? color.accentLight : 'rgba(233,233,237,.35)',
            fontSize: 13.5,
            fontWeight: 500,
            cursor: pronto ? 'pointer' : 'default',
          }}
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}

function ListaItens({ items, onChangeQty, onEditItem }) {
  if (items.length === 0) {
    return <div style={{ fontSize: 13, color: color.textWeak, marginBottom: 20 }}>Carrinho vazio.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: color.surface,
            borderRadius: radius.row,
            padding: '10px 12px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Toque no nome pra corrigir: antes, errar o preço unitário
                só se resolvia zerando a quantidade e recadastrando. */}
            <button
              onClick={() => {
                if (!onEditItem) return;
                const novoNome = window.prompt('Nome do item:', item.name);
                if (novoNome === null) return;
                const novoPreco = window.prompt('Preço de cada unidade:', item.unitPrice);
                if (novoPreco === null) return;
                const preco = parseValor(novoPreco);
                if (preco === null || preco <= 0) {
                  window.alert('Esse preço não parece válido. Ex.: 12,90 ou 8.');
                  return;
                }
                onEditItem(item.id, { name: novoNome.trim() || item.name, unitPrice: preco });
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                color: color.text,
                fontSize: 13.5,
                cursor: onEditItem ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              aria-label={`Editar ${item.name}`}
            >
              {item.name}
              {onEditItem && <PencilSimple size={11} color={color.textWeak} />}
            </button>
            <div style={{ fontSize: 11, color: color.textWeak }}>
              {item.qty}× {brl(item.unitPrice)}
            </div>
          </div>
          <button
            onClick={() => {
              // Chegar a zero tira o item do carrinho — a única ação que
              // apagava algo sem confirmar em todo o app.
              if (item.qty <= 1) {
                if (!window.confirm(`Tirar "${item.name}" do carrinho?`)) return;
              }
              onChangeQty(item.id, item.qty - 1);
            }}
            style={{ width: 26, height: 26, borderRadius: 99, border: `1px solid ${color.border}`, background: 'transparent', color: color.text, cursor: 'pointer' }}
          >
            −
          </button>
          <button
            onClick={() => onChangeQty(item.id, item.qty + 1)}
            style={{ width: 26, height: 26, borderRadius: 99, border: `1px solid ${color.border}`, background: 'transparent', color: color.text, cursor: 'pointer' }}
          >
            +
          </button>
          <span style={{ fontSize: 13.5, minWidth: 70, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {brl(item.qty * item.unitPrice)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ComoVaiPagar({ method, onChangeMethod, debitPart, onChangeDebitPart, total, names }) {
  const METODOS = getMetodos(names);
  const metodoAtual = METODOS.find((m) => m.id === method);
  const debito = Math.min(debitPart, total);
  const credito = total - debito;

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel>Como vai pagar</SectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {METODOS.map((m) => (
          <button
            key={m.id}
            onClick={() => onChangeMethod(m.id)}
            style={{
              padding: '8px 14px',
              borderRadius: radius.chip,
              border: `1px solid ${method === m.id ? color.accent : color.border}`,
              background: method === m.id ? color.surfaceElevated : 'transparent',
              color: method === m.id ? color.accentChipText : 'rgba(233,233,237,.6)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {metodoAtual?.credito ? (
        <div style={{ background: color.surfaceInset, borderRadius: radius.row, padding: 14 }}>
          <div style={{ fontSize: 11.5, color: color.textMedium, marginBottom: 10 }}>Pagamento misto — parte no débito</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <button
              onClick={() => onChangeDebitPart(Math.max(0, debitPart - 50))}
              style={{ width: 28, height: 28, borderRadius: 99, border: `1px solid ${color.border}`, background: 'transparent', color: color.text, cursor: 'pointer' }}
            >
              −
            </button>
            <span style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{brl(debito)}</span>
            <button
              onClick={() => onChangeDebitPart(Math.min(total, debitPart + 50))}
              style={{ width: 28, height: 28, borderRadius: 99, border: `1px solid ${color.border}`, background: 'transparent', color: color.text, cursor: 'pointer' }}
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ width: `${total > 0 ? (credito / total) * 100 : 0}%`, background: color.accent }} />
            <div style={{ width: `${total > 0 ? (debito / total) * 100 : 0}%`, background: color.chart[3] }} />
          </div>
          <div style={{ fontSize: 11.5, color: color.textMedium }}>
            registra {debito > 0 ? '2 lançamentos' : '1 lançamento'}: {brl(credito)} no {metodoAtual.label.replace('Crédito · ', '')}
            {debito > 0 ? ` e ${brl(debito)} no débito` : ''}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: color.textWeak }}>
          Pagamento único em {metodoAtual?.label} — sai da conta na hora, sem fatura.
        </div>
      )}
    </div>
  );
}

// Compras antigas guardavam a palavra "hoje" como texto; as novas guardam
// a data de verdade. Isso entende as duas e mostra "hoje" só quando é hoje.
function dataDaCompra(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  const agora = new Date();
  const mesmoDia =
    d.getDate() === agora.getDate() &&
    d.getMonth() === agora.getMonth() &&
    d.getFullYear() === agora.getFullYear();
  return mesmoDia ? 'hoje' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Shop({
  shop,
  mercado,
  onAddItem,
  onChangeQty,
  onEditItem,
  onChangeMethod,
  onChangeDebitPart,
  onFinalizar,
  purchases,
  onDeletePurchase,
  names = { Rui: 'Rui', Ana: 'Ana' },
}) {
  const total = shop.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const podeFinalizar = shop.items.length > 0 && total > 0;

  return (
    <div style={{ padding: '64px 20px 100px' }}>
      <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', marginBottom: 20 }}>Feira</div>

      <CarrinhoCard items={shop.items} mercado={mercado} />

      <SectionLabel>Adicionar item</SectionLabel>
      <AdicionarItem onAdd={onAddItem} />

      <SectionLabel>Itens</SectionLabel>
      <ListaItens items={shop.items} onChangeQty={onChangeQty} onEditItem={onEditItem} />

      <ComoVaiPagar
        method={shop.method}
        onChangeMethod={onChangeMethod}
        debitPart={shop.debitPart}
        onChangeDebitPart={onChangeDebitPart}
        total={total}
        names={names}
      />

      <button
        onClick={onFinalizar}
        disabled={!podeFinalizar}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: radius.row,
          border: `1px solid ${podeFinalizar ? color.accent : 'transparent'}`,
          background: podeFinalizar ? color.accentSoft : 'transparent',
          color: podeFinalizar ? color.accentLight : 'rgba(233,233,237,.35)',
          fontSize: 15,
          fontWeight: 500,
          cursor: podeFinalizar ? 'pointer' : 'default',
          marginBottom: 24,
        }}
      >
        Finalizar e registrar
      </button>

      {purchases.length > 0 && (
        <>
          <SectionLabel>Compras registradas</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {purchases.slice(0, 5).map((p) => (
              <div
                key={p.id}
                style={{
                  background: color.surface,
                  borderRadius: radius.row,
                  padding: '10px 12px',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span>{dataDaCompra(p.date)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(p.total)}</span>
                    {onDeletePurchase && (
                      <button
                        onClick={() => {
                          if (window.confirm('Apagar esta compra? Isso também tira o valor do gasto de Mercado.')) {
                            onDeletePurchase(p.id);
                          }
                        }}
                        title="Apagar compra"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 99,
                          border: `1px solid ${color.border}`,
                          background: 'transparent',
                          color: color.textWeak,
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {p.debit > 0 && p.credit > 0 && (
                  <div style={{ fontSize: 11, color: color.textWeak, marginTop: 2 }}>
                    {brl(p.credit)} crédito · {brl(p.debit)} débito
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
