import { X, Plus } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: radius.row,
              border: `1px solid ${active ? color.accent : color.border}`,
              background: active ? color.surfaceElevated : 'transparent',
              color: active ? color.accentChipText : 'rgba(233,233,237,.6)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
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

function StepperButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 99,
        border: `1px solid ${color.border}`,
        background: 'transparent',
        color: color.text,
        fontSize: 15,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function ListaValores({ titulo, itens, vazio }) {
  const total = itens.reduce((s, i) => s + (i.part ?? i.value), 0);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: color.textMedium }}>{titulo}</span>
        <span style={{ fontSize: 12.5, color: color.textMedium }}>{brl(total)}</span>
      </div>
      {itens.length === 0 ? (
        <div style={{ fontSize: 13, color: color.textWeak }}>{vazio}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {itens.map((item, idx) => (
            <div
              key={item.id ?? idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: color.surface,
                borderRadius: radius.row,
                padding: '10px 12px',
                fontSize: 13.5,
              }}
            >
              <span>{item.name}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(item.part ?? item.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile({
  person,
  onChangePerson,
  income,
  extras,
  personal,
  contasCasa,
  outraPessoa,
  outroGastoReal,
  onUpdateIncome,
  onRemoveExtra,
  onRegistrarExtra,
}) {
  const rendaFixa = income[person] || 0;
  const rendaExtras = extras[person] || [];
  const totalExtras = rendaExtras.reduce((s, e) => s + e.v, 0);
  const rendaTotal = rendaFixa + totalExtras;

  const fixas = personal[person]?.fixed || [];
  const variaveis = personal[person]?.variable || [];
  const partesCasa = contasCasa || [];

  const gastoCasaTotal = partesCasa.reduce((s, i) => s + i.part, 0);
  const gastoFixasTotal = fixas.reduce((s, i) => s + i.value, 0);
  const gastoVariaveisTotal = variaveis.reduce((s, i) => s + i.value, 0);
  const gastoReal = gastoCasaTotal + gastoFixasTotal + gastoVariaveisTotal;

  const sobra = rendaTotal - gastoReal;
  const pctComprometida = rendaTotal > 0 ? Math.min(100, (gastoReal / rendaTotal) * 100) : 0;

  const pctCasa = gastoReal > 0 ? (gastoCasaTotal / gastoReal) * 100 : 0;
  const pctFixas = gastoReal > 0 ? (gastoFixasTotal / gastoReal) * 100 : 0;
  const pctVariaveis = gastoReal > 0 ? (gastoVariaveisTotal / gastoReal) * 100 : 0;

  return (
    <div style={{ padding: '64px 20px 168px' }}>
      <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', marginBottom: 20 }}>Perfil</div>

      <Segmented value={person} onChange={onChangePerson} options={['Rui', 'Ana']} />

      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <SectionLabel>Entradas do mês</SectionLabel>
          <span style={{ fontSize: 13, color: color.accentLight }}>{brl(rendaTotal)}</span>
        </div>
        <div style={{ fontSize: 11.5, color: color.textWeak, marginBottom: 14 }}>
          entradas {brl(rendaTotal)} este mês
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: color.surface,
            borderRadius: radius.row,
            padding: '12px 14px',
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: color.textMedium }}>Renda fixa</div>
            <div style={{ fontSize: 18, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{brl(rendaFixa)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <StepperButton onClick={() => onUpdateIncome(person, Math.max(0, rendaFixa - 100))}>−</StepperButton>
            <StepperButton onClick={() => onUpdateIncome(person, rendaFixa + 100)}>+</StepperButton>
          </div>
        </div>

        {rendaExtras.length === 0 ? (
          <div style={{ fontSize: 13, color: color.textWeak, marginBottom: 10 }}>Nenhuma entrada extra este mês.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
            {rendaExtras.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: color.surface,
                  borderRadius: radius.row,
                  padding: '10px 12px',
                  fontSize: 13.5,
                }}
              >
                <span>{e.n}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(e.v)}</span>
                  <button
                    onClick={() => onRemoveExtra(person, e.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={14} color={color.textWeak} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onRegistrarExtra(person)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 0',
            borderRadius: radius.row,
            border: `1px solid ${color.border}`,
            background: 'transparent',
            color: color.textMedium,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Registrar entrada extra
        </button>
      </div>

      <div
        style={{
          borderRadius: radius.card,
          padding: 16,
          background: color.surfaceInset,
          marginBottom: 22,
        }}
      >
        <SectionLabel>Gasto real do mês</SectionLabel>
        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-.025em', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
          {brl(gastoReal)}
        </div>
        <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ width: `${pctCasa}%`, background: color.chart[0] }} />
          <div style={{ width: `${pctFixas}%`, background: color.chart[2] }} />
          <div style={{ width: `${pctVariaveis}%`, background: color.chart[4] }} />
        </div>
        <div style={{ fontSize: 12.5, color: sobra < 0 ? color.alertText : color.textMedium }}>
          {sobra >= 0 ? `Sobra ${brl(sobra)} da renda` : `Falta ${brl(Math.abs(sobra))} — passa da renda`}
        </div>
        <div style={{ fontSize: 12.5, color: color.textMedium }}>{pctComprometida.toFixed(0)}% da renda comprometida</div>
      </div>

      <ListaValores titulo="Parte das contas de casa" itens={partesCasa} vazio="Nenhuma conta ainda." />
      <ListaValores titulo="Contas pessoais fixas" itens={fixas} vazio="Nenhuma conta pessoal fixa." />
      <ListaValores titulo="Gastos pessoais variáveis" itens={variaveis} vazio="Nenhum gasto pessoal variável." />

      <div style={{ marginTop: 24, fontSize: 12, color: color.textWeak, lineHeight: 1.5, marginBottom: 24 }}>
        Gasto real de {outraPessoa}: {brl(outroGastoReal)}
        <br />
        As contas pessoais não entram no orçamento compartilhado — só aqui.
      </div>

      <div style={{ borderTop: `1px solid ${color.borderSubtle}`, paddingTop: 16 }}>
        <div style={{ fontSize: 11, color: color.textWeak, marginBottom: 10 }}>
          Isso apaga só os dados guardados NESTE aparelho e navegador — não afeta outros celulares ou computadores.
        </div>
        <button
          onClick={() => {
            if (window.confirm('Apagar todos os dados deste aparelho e recomeçar do zero?')) {
              localStorage.removeItem('casa:v1');
              window.location.reload();
            }
          }}
          style={{
            width: '100%',
            padding: '11px 0',
            borderRadius: radius.row,
            border: `1px solid ${color.alertBar}`,
            background: 'transparent',
            color: color.alertText,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Apagar dados e recomeçar
        </button>
      </div>
    </div>
  );
}
