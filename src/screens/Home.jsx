import { CaretLeft, CaretRight, DownloadSimple, PencilSimple, Trash } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';

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

function HeroCard({ month, gastoTotal, rendaCasal }) {
  const restante = rendaCasal - gastoTotal;
  const pctGasto = rendaCasal > 0 ? Math.min(100, (gastoTotal / rendaCasal) * 100) : 0;
  const pctHoje = (month.today / month.daysInMonth) * 100;
  const porDia = Math.max(0, restante) / Math.max(1, month.daysInMonth - month.today);

  return (
    <div
      style={{
        borderRadius: radius.card,
        padding: 20,
        background: `linear-gradient(155deg, ${color.surfaceElevated}, ${color.surface})`,
        boxShadow: `0 0 0 1px ${color.border}, 0 10px 30px rgba(0,0,0,.45)`,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: 99,
          border: `1px solid ${color.chart[2]}`,
          fontSize: 11,
          color: color.accentLight,
          marginBottom: 14,
        }}
      >
        {month.status}
      </div>

      <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 4 }}>Sobra do mês</div>
      <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>
        {brl(restante)}
      </div>

      <div style={{ position: 'relative', marginTop: 18, marginBottom: 8 }}>
        <div
          style={{
            height: 8,
            borderRadius: 99,
            background: color.borderSubtle,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pctGasto}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${color.chart[2]}, ${color.accent})`,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: `${pctHoje}%`,
            width: 1,
            height: 16,
            background: '#b2b6ca',
          }}
        />
        <div
          style={{
            fontSize: 10,
            color: color.textWeak,
            marginTop: 6,
            position: 'relative',
            left: `${pctHoje}%`,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          hoje, dia {month.today}
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: color.textMedium, marginTop: 6 }}>
        Gasto {brl(gastoTotal)} de {brl(rendaCasal)} de renda
      </div>
      <div style={{ fontSize: 12.5, color: color.textMedium }}>
        Pode gastar por dia {brl(porDia)}
      </div>
      <div style={{ fontSize: 10.5, color: color.textWeak, marginTop: 8 }}>
        Renda do casal (fixa + extras) menos contas fixas menos gasto nas categorias abaixo. Renda e contas se editam
        no Perfil e nas Contas.
      </div>
    </div>
  );
}

function AvisoContasVencendo({ bills, hoje }) {
  const vencidas = bills.filter((b) => !b.paid && (b.due || 1) <= hoje);
  if (vencidas.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: radius.card,
        padding: 14,
        background: 'rgba(201,138,138,.12)',
        border: `1px solid ${color.alertBar}`,
        marginBottom: 20,
      }}
    >
      <div style={{ fontSize: 12.5, color: color.alertText, fontWeight: 500, marginBottom: 6 }}>
        {vencidas.length === 1 ? 'Uma conta está vencendo ou já venceu' : `${vencidas.length} contas estão vencendo ou já venceram`}
      </div>
      {vencidas.map((b) => (
        <div key={b.id} style={{ fontSize: 12, color: color.alertText, lineHeight: 1.6 }}>
          {b.name} · dia {b.due} · {brl(b.value)} — ainda não foi marcada como paga em Contas
        </div>
      ))}
    </div>
  );
}

function CategoriesSection({ cats, bills = [], sharedPurchases = [], onEditBudget }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel>Onde foi</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {cats.map((cat) => {
          const contasFixasCat = bills
            .filter((b) => b.category === cat.id)
            .reduce((sum, b) => sum + (b.value || 0), 0);
          const comprasConjuntasCat = sharedPurchases
            .filter((p) => p.category === cat.id)
            .reduce((sum, p) => sum + (p.value || 0), 0);
          const totalCat = cat.spent + contasFixasCat + comprasConjuntasCat;
          const pct = cat.budget > 0 ? Math.min(100, (totalCat / cat.budget) * 100) : 0;
          const estourou = totalCat > cat.budget;
          return (
            <div
              key={cat.id}
              style={{
                background: color.surface,
                borderRadius: radius.row,
                padding: '11px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{cat.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, minWidth: 86, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {brl(totalCat)}{' '}
                    <span style={{ color: color.textWeak, fontSize: 11.5 }}>de {brl(cat.budget, false)}</span>
                  </span>
                  <button
                    onClick={() => onEditBudget(cat)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 2,
                    }}
                    aria-label={`Editar orçamento de ${cat.name}`}
                  >
                    <PencilSimple size={13} color={color.textWeak} />
                  </button>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: color.borderSubtle, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: estourou ? color.alertBar : cat.color,
                  }}
                />
              </div>
              {(contasFixasCat > 0 || comprasConjuntasCat > 0) && (
                <div style={{ fontSize: 10.5, color: color.textWeak, marginTop: 6 }}>
                  {[
                    contasFixasCat > 0 ? `${brl(contasFixasCat)} de contas fixas` : null,
                    comprasConjuntasCat > 0 ? `${brl(comprasConjuntasCat)} de compras no cartão` : null,
                  ]
                    .filter(Boolean)
                    .join(' + ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImportCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: color.surfaceInset,
        border: `1px dashed ${color.chart[2]}`,
        borderRadius: radius.card,
        padding: 16,
        color: color.text,
        cursor: 'pointer',
        marginBottom: 20,
        textAlign: 'left',
      }}
    >
      <DownloadSimple size={20} color={color.accentIcon} />
      <span style={{ fontSize: 13.5 }}>Importar extrato do banco</span>
    </button>
  );
}

function RecentTransactions({ txs, onDeleteTx }) {
  return (
    <div>
      <SectionLabel>Últimos lançamentos</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {txs.length === 0 && (
          <div style={{ fontSize: 13, color: color.textWeak, padding: '4px 2px' }}>
            Nenhum lançamento ainda.
          </div>
        )}
        {txs.slice(0, 4).map((tx) => (
          <div
            key={tx.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: color.surface,
              borderRadius: radius.row,
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: color.surfaceElevated,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 99, background: color.accentIcon }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5 }}>{tx.desc}</div>
              <div style={{ fontSize: 11, color: color.textWeak }}>{tx.meta}</div>
            </div>
            <div style={{ fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>{brl(tx.value)}</div>
            {onDeleteTx && (
              <button
                onClick={() => {
                  if (window.confirm(`Apagar "${tx.desc}"? Isso também tira o valor da categoria.`)) onDeleteTx(tx.id);
                }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                aria-label={`Apagar ${tx.desc}`}
              >
                <Trash size={14} color={color.textWeak} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home({ month, cats, txs, onEditCategoryBudget, rendaCasal, billsTotal, bills = [], sharedPurchases = [], onImport, onDeleteTx }) {
  const spent = cats.reduce((sum, c) => sum + c.spent, 0);
  const gastoTotal = spent + billsTotal;

  function handleEditBudget(cat) {
    const resposta = window.prompt(`Novo orçamento mensal para "${cat.name}" (só números, ex. 1500):`, cat.budget);
    if (resposta === null) return;
    const valor = Number(resposta.replace(',', '.'));
    if (Number.isNaN(valor) || valor < 0) {
      window.alert('Isso não parece um número válido. Tente de novo.');
      return;
    }
    onEditCategoryBudget(cat.id, valor);
  }

  return (
    <div
      style={{
        padding: '64px 20px 168px',
        background: `linear-gradient(180deg, ${color.bgGradientTop} 0%, ${color.bg} 42%)`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CaretLeft size={16} color={color.textWeak} />
          <span style={{ fontSize: 15, fontWeight: 500 }}>{month.label}</span>
          <CaretRight size={16} color={color.textWeak} />
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: 28, height: 28, borderRadius: 99, background: color.chart[0], border: `1.5px solid ${color.bg}` }} />
          <div style={{ width: 28, height: 28, borderRadius: 99, background: color.chart[1], border: `1.5px solid ${color.bg}`, marginLeft: -8 }} />
        </div>
      </div>

      <HeroCard month={month} gastoTotal={gastoTotal} rendaCasal={rendaCasal} />
      <AvisoContasVencendo bills={bills} hoje={month.today} />
      <CategoriesSection cats={cats} bills={bills} sharedPurchases={sharedPurchases} onEditBudget={handleEditBudget} />
      <ImportCard onClick={onImport} />
      <RecentTransactions txs={txs} onDeleteTx={onDeleteTx} />
    </div>
  );
}
