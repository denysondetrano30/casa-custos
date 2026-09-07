import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';
import { buildSettlement } from '../lib/settlement';

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

function RendaCasal({ income, onUpdateIncome, names }) {
  const total = income.Rui + income.Ana;
  return (
    <div style={{ marginBottom: 22 }}>
      <SectionLabel>Renda do casal</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {['Rui', 'Ana'].map((p) => {
          const pct = total > 0 ? (income[p] / total) * 100 : 0;
          return (
            <div
              key={p}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: color.surface,
                borderRadius: radius.row,
                padding: '11px 14px',
              }}
            >
              <div>
                <div style={{ fontSize: 14 }}>{names[p]}</div>
                <div style={{ fontSize: 11, color: color.textWeak }}>{pct.toFixed(0)}% da renda</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{brl(income[p])}</span>
                <StepperButton onClick={() => onUpdateIncome(p, Math.max(0, income[p] - 100))}>−</StepperButton>
                <StepperButton onClick={() => onUpdateIncome(p, income[p] + 100)}>+</StepperButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PRESETS = [
  { label: '80/20', rui: 80 },
  { label: '70/30', rui: 70 },
  { label: '50/50', rui: 50 },
];

function ProporcaoCard({ pctRui, onChangePctRui, income, total, names }) {
  const pctAna = 100 - pctRui;
  const alvoRui = (total * pctRui) / 100;
  const alvoAna = (total * pctAna) / 100;
  const rendaTotal = income.Rui + income.Ana;
  // Se ninguém ainda cadastrou renda fixa, essa conta (Rui / soma) daria uma
  // divisão por zero — em vez de deixar o botão gravar um valor inválido na
  // divisão do casal, ele fica desabilitado até existir renda cadastrada.
  const pelaRendaDisponivel = rendaTotal > 0;
  const pctPelaRenda = pelaRendaDisponivel ? Math.round((income.Rui / rendaTotal) * 100) : null;

  return (
    <div
      style={{
        borderRadius: radius.card,
        padding: 16,
        background: color.surfaceInset,
        marginBottom: 22,
      }}
    >
      <SectionLabel>Proporção</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
        <StepperButton onClick={() => onChangePctRui(Math.max(0, pctRui - 5))}>−</StepperButton>
        <div style={{ fontSize: 22, fontWeight: 500 }}>
          {pctRui}% / {pctAna}%
        </div>
        <StepperButton onClick={() => onChangePctRui(Math.min(100, pctRui + 5))}>+</StepperButton>
      </div>

      <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${pctRui}%`, background: color.accent }} />
        <div style={{ width: `${pctAna}%`, background: color.chart[3] }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: color.textMedium, marginBottom: 14 }}>
        <span>{names.Rui}: {brl(alvoRui)}</span>
        <span>{names.Ana}: {brl(alvoAna)}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onChangePctRui(p.rui)}
            style={{
              padding: '7px 12px',
              borderRadius: 99,
              border: `1px solid ${pctRui === p.rui ? color.accent : color.border}`,
              background: pctRui === p.rui ? color.surfaceElevated : 'transparent',
              color: pctRui === p.rui ? color.accentChipText : 'rgba(233,233,237,.6)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => pelaRendaDisponivel && onChangePctRui(pctPelaRenda)}
          disabled={!pelaRendaDisponivel}
          title={pelaRendaDisponivel ? undefined : 'Cadastre a renda fixa dos dois primeiro'}
          style={{
            padding: '7px 12px',
            borderRadius: 99,
            border: `1px solid ${pelaRendaDisponivel && pctRui === pctPelaRenda ? color.accent : color.border}`,
            background: pelaRendaDisponivel && pctRui === pctPelaRenda ? color.surfaceElevated : 'transparent',
            color: !pelaRendaDisponivel ? 'rgba(233,233,237,.3)' : pctRui === pctPelaRenda ? color.accentChipText : 'rgba(233,233,237,.6)',
            fontSize: 12.5,
            cursor: pelaRendaDisponivel ? 'pointer' : 'default',
          }}
        >
          {pelaRendaDisponivel ? `pela renda · ${pctPelaRenda}/${100 - pctPelaRenda}` : 'pela renda · sem renda cadastrada'}
        </button>
      </div>
    </div>
  );
}

function Coluna({ pessoa, nome, itens, income, avatarColor, names, gastoPessoal = 0, rendaDaPessoa, acerto }) {
  // `soma` é o que sai do bolso da pessoa nas contas. Mas quem paga uma
  // conta do outro (ou tem conta paga pelo outro) acerta a diferença numa
  // transferência — então a sobra tem que contar isso, senão ela erra
  // exatamente o valor da transferência, logo abaixo do card que anuncia
  // essa transferência.
  const soma = itens.reduce((s, i) => s + i.part, 0);
  const transferencia = acerto && !acerto.quitado
    ? acerto.de === pessoa
      ? acerto.valor // manda dinheiro: sai mais do bolso
      : -acerto.valor // recebe: volta pro bolso
    : 0;
  // Mesma conta do Perfil: renda cheia (fixa + extras) menos a parte das
  // contas de casa menos os gastos pessoais. Antes esta tela olhava só a
  // renda fixa e só as contas de casa, e podia anunciar folga pra quem
  // estava no vermelho no Perfil (ou o contrário).
  const renda = rendaDaPessoa !== undefined ? rendaDaPessoa : income[pessoa];
  const sobra = renda - soma - gastoPessoal - transferencia;

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: 99, background: avatarColor }} />
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{nome}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
        {itens.length === 0 && (
          <div style={{ fontSize: 12, color: color.textWeak }}>Nenhuma conta.</div>
        )}
        {itens.map((item) => (
          <div
            key={item.id}
            style={{
              background: color.surface,
              borderRadius: radius.row,
              padding: '9px 10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span>{item.name}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(item.part)}</span>
            </div>
            {item.shared && (
              <div
                style={{
                  fontSize: 10,
                  color: color.accentLight,
                  border: `1px solid ${color.chart[2]}`,
                  borderRadius: 99,
                  display: 'inline-block',
                  padding: '2px 7px',
                  marginTop: 5,
                }}
              >
                dividido · total {brl(item.value)}
              </div>
            )}
            {item.owner && !item.shared && (
              <div style={{ fontSize: 10, color: color.textWeak, marginTop: 4 }}>
                paga {names[item.owner] || item.owner} — a diferença entra no acerto acima
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: sobra < 0 ? color.alertText : color.textMedium }}>
        {sobra >= 0 ? `sobra ${brl(sobra)} da renda` : `falta ${brl(Math.abs(sobra))} — passa da renda`}
      </div>
    </div>
  );
}

export default function Split({
  income,
  onUpdateIncome,
  pctRui,
  onChangePctRui,
  splitResult,
  totalCommitments,
  names = { Rui: 'Rui', Ana: 'Ana' },
  gastoPessoal = { Rui: 0, Ana: 0 },
  rendaTotalPorPessoa,
  acerto: acertoProp,
}) {
  const acerto = acertoProp || buildSettlement(splitResult, pctRui, ['Rui', 'Ana']);
  // Sem nenhum dono definido, "quitado" não quer dizer que cada um paga o
  // que é seu — quer dizer que o algoritmo distribuiu tudo por conta
  // própria. O texto muda pra não prometer o que a casa ainda não
  // configurou.
  const temAlgumDono = ['Rui', 'Ana'].some((p) => (splitResult?.[p] || []).some((i) => i.owner));

  return (
    <div style={{ padding: '64px 20px 168px' }}>
      <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', marginBottom: 20 }}>Divisão</div>

      <RendaCasal income={income} onUpdateIncome={onUpdateIncome} names={names} />
      <ProporcaoCard pctRui={pctRui} onChangePctRui={onChangePctRui} income={income} total={totalCommitments} names={names} />

      <SectionLabel>Quem paga o quê — sugestão</SectionLabel>
      {/* O acerto do mês: uma transferência só. Cada um paga as contas que
          são dele (o cartão no nome dele, por exemplo) e a diferença entre
          o desembolso e a parte de cada um vira UMA transferência — em vez
          de dinheiro indo e voltando pros dois lados. */}
      <div
        style={{
          borderRadius: radius.card,
          padding: 16,
          background: acerto.quitado ? color.surfaceInset : color.surfaceElevated,
          border: `1px solid ${acerto.quitado ? color.border : color.accent}`,
          marginBottom: 22,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: color.textMedium, marginBottom: 8 }}>
          Acerto do mês
        </div>
        {acerto.quitado ? (
          <div style={{ fontSize: 15, color: color.text }}>
            {temAlgumDono
              ? 'Está quitado — cada um paga as próprias contas e ninguém precisa transferir nada.'
              : 'Nada a transferir. Dica: marque de quem é cada cartão (em Contas → Cartões) pra cada um pagar o próprio cartão e o app calcular a diferença numa transferência só.'}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
              {brl(acerto.valor)}
            </div>
            <div style={{ fontSize: 13.5, color: color.accentLight }}>
              {names[acerto.de] || acerto.de} transfere para {names[acerto.para] || acerto.para}
            </div>
          </>
        )}
        <div style={{ fontSize: 11, color: color.textWeak, marginTop: 10, lineHeight: 1.55 }}>
          Cada um paga no banco as contas que estão na coluna dele abaixo. Essa transferência fecha a diferença entre
          o que saiu do bolso de cada um e a parte de cada um no total ({brl(acerto.deveBancar.Rui)} para {names.Rui} e{' '}
          {brl(acerto.deveBancar.Ana)} para {names.Ana}).
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <Coluna pessoa="Rui" nome={names.Rui} itens={splitResult.Rui} income={income} avatarColor={color.chart[0]} names={names} gastoPessoal={gastoPessoal.Rui} rendaDaPessoa={rendaTotalPorPessoa?.Rui} acerto={acerto} />
        <Coluna pessoa="Ana" nome={names.Ana} itens={splitResult.Ana} income={income} avatarColor={color.chart[1]} names={names} gastoPessoal={gastoPessoal.Ana} rendaDaPessoa={rendaTotalPorPessoa?.Ana} acerto={acerto} />
      </div>
    </div>
  );
}
