import { useState } from 'react';
import { Plus, Minus, X } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';

const METODOS = [
  { id: 'credito-rui', label: 'Crédito · Cartão Rui', payer: 'Rui', credito: true },
  { id: 'credito-ana', label: 'Crédito · Cartão Ana', payer: 'Ana', credito: true },
  { id: 'debito', label: 'Débito', payer: null, credito: false },
  { id: 'pix', label: 'Pix', payer: null, credito: false },
];

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

  const pronto = nome.trim() !== '' && Number(preco) > 0;

  function adicionar() {
    if (!pronto) return;
    onAdd({ id: Date.now(), name: nome, unitPrice: Number(preco.replace(',', '.')), qty });
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

function ListaItens({ items, onChangeQty }) {
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
            <div style={{ fontSize: 13.5 }}>{item.name}</div>
            <div style={{ fontSize: 11, color: color.textWeak }}>
              {item.qty}× {brl(item.unitPrice)}
            </div>
          </div>
          <button
            onClick={() => onChangeQty(item.id, item.qty - 1)}
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

function ComoVaiPagar({ method, onChangeMethod, debitPart, onChangeDebitPart, total }) {
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

export default function Shop({ shop, mercado, onAddItem, onChangeQty, onChangeMethod, onChangeDebitPart, onFinalizar, purchases }) {
  const total = shop.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const podeFinalizar = shop.items.length > 0 && total > 0;

  return (
    <div style={{ padding: '64px 20px 100px' }}>
      <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', marginBottom: 20 }}>Feira</div>

      <CarrinhoCard items={shop.items} mercado={mercado} />

      <SectionLabel>Adicionar item</SectionLabel>
      <AdicionarItem onAdd={onAddItem} />

      <SectionLabel>Itens</SectionLabel>
      <ListaItens items={shop.items} onChangeQty={onChangeQty} />

      <ComoVaiPagar
        method={shop.method}
        onChangeMethod={onChangeMethod}
        debitPart={shop.debitPart}
        onChangeDebitPart={onChangeDebitPart}
        total={total}
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
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.date}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(p.total)}</span>
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
