import { useState } from 'react';
import { CheckCircle, Circle, PencilSimple, Trash } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';
import { buildFutureMonths, monthLabel } from '../lib/futureBills';
import Historico from './Historico';

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: radius.row,
              border: `1px solid ${active ? color.accent : color.border}`,
              background: active ? color.surfaceElevated : 'transparent',
              color: active ? color.accentChipText : 'rgba(233,233,237,.6)',
              fontSize: 13.5,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function EstesMes({ bills, sharedPurchases = [], onTogglePaid, onEditBill, onDeleteBill, onDeleteSharedPurchase, rendaCasal, mesAtualLabel, onFecharMes }) {
  const totalContas = bills.reduce((s, b) => s + b.value, 0);
  const totalCompras = sharedPurchases.reduce((s, p) => s + p.value, 0);
  const saldo = rendaCasal - totalContas - totalCompras;

  const porSemana = {};
  bills.forEach((b) => {
    const semana = Math.min(4, Math.ceil((b.due || 1) / 7));
    porSemana[semana] = porSemana[semana] || [];
    porSemana[semana].push(b);
  });

  return (
    <>
      <div
        style={{
          borderRadius: radius.card,
          padding: 16,
          background: color.surfaceInset,
          marginBottom: 22,
        }}
      >
        <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 6 }}>
          {saldo < 0 ? 'Faltam para fechar o mês' : 'Saldo previsto dia 31'}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-.025em',
            fontVariantNumeric: 'tabular-nums',
            color: saldo < 0 ? color.alertText : color.text,
          }}
        >
          {brl(saldo)}
        </div>
      </div>

      {sharedPurchases.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 8 }}>
            Compras de cartão em conjunto ({brl(totalCompras)})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sharedPurchases.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: color.surface,
                  borderRadius: radius.row,
                  padding: '11px 12px',
                }}
              >
                <span style={{ flex: 1, fontSize: 14, color: color.text }}>{p.name}</span>
                <span style={{ fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>{brl(p.value)}</span>
                <button
                  onClick={() => {
                    if (window.confirm(`Apagar "${p.name}" das compras conjuntas?`)) onDeleteSharedPurchase(p.id);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                  aria-label={`Apagar ${p.name}`}
                >
                  <Trash size={14} color={color.textWeak} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: color.textWeak, marginTop: 6 }}>
            Essas compras vêm do extrato importado, entram na divisão de quem paga o quê e já contam no saldo acima.
          </div>
        </div>
      )}

      {bills.length === 0 && sharedPurchases.length === 0 && (
        <div style={{ fontSize: 13, color: color.textWeak, marginBottom: 16 }}>
          Nenhuma conta fixa cadastrada ainda. Use o botão + (tipo "Conta fixa") para adicionar.
        </div>
      )}

      {Object.keys(porSemana)
        .sort((a, b) => a - b)
        .map((semana) => (
          <div key={semana} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 8 }}>Semana {semana}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {porSemana[semana].map((b) => (
                <div
                  key={b.id}
                  onClick={() => onTogglePaid(b.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: color.surface,
                    borderRadius: radius.row,
                    padding: '11px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {b.paid ? (
                    <CheckCircle size={18} weight="fill" color={color.accentIcon} />
                  ) : (
                    <Circle size={18} color={color.textWeak} />
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: b.paid ? color.textWeak : color.text,
                      textDecoration: b.paid ? 'line-through' : 'none',
                    }}
                  >
                    {b.name} · dia {b.due}
                  </span>
                  <span style={{ fontSize: 13.5, fontVariantNumeric: 'tabular-nums', color: b.paid ? color.textWeak : color.text }}>
                    {brl(b.value)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const novoNome = window.prompt('Nome da conta:', b.name);
                      if (novoNome === null) return;
                      const novoDia = window.prompt('Dia de vencimento (1 a 31):', b.due);
                      if (novoDia === null) return;
                      const novoValorStr = window.prompt('Valor (só números, ex. 855):', b.value);
                      if (novoValorStr === null) return;
                      const novoValor = Number(String(novoValorStr).replace(',', '.'));
                      if (!novoNome.trim() || Number.isNaN(novoValor) || novoValor < 0) {
                        window.alert('Alguma dessas respostas não é válida. Tente de novo.');
                        return;
                      }
                      onEditBill(b.id, { name: novoNome.trim(), due: Number(novoDia) || b.due, value: novoValor });
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                    aria-label={`Editar ${b.name}`}
                  >
                    <PencilSimple size={14} color={color.textWeak} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Apagar a conta "${b.name}"?`)) onDeleteBill(b.id);
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                    aria-label={`Apagar ${b.name}`}
                  >
                    <Trash size={14} color={color.textWeak} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

      {onFecharMes && (
        <div style={{ marginTop: 26, borderTop: `1px solid ${color.borderSubtle}`, paddingTop: 18 }}>
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Fechar ${mesAtualLabel} e começar o mês seguinte?\n\nIsso guarda um resumo de ${mesAtualLabel} no Histórico e zera os gastos, compras de cartão e gastos pessoais variáveis pro mês novo. Contas fixas, parcelas e metas continuam do jeito que estão.`
                )
              ) {
                onFecharMes();
              }
            }}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: radius.row,
              border: `1px solid ${color.accent}`,
              background: 'transparent',
              color: color.accentLight,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Fechar {mesAtualLabel} e começar mês seguinte
          </button>
        </div>
      )}
    </>
  );
}

function MesesFuturos({ state, rendaFixaCasal, simulacao, onDeleteInstallment }) {
  const [selecionado, setSelecionado] = useState(0);
  const meses = buildFutureMonths(state, simulacao);
  const maxTotal = Math.max(...meses.map((m) => m.total), 1);
  const mes = meses[selecionado];
  const pctRenda = rendaFixaCasal > 0 ? (mes.total / rendaFixaCasal) * 100 : 0;
  const alerta = pctRenda > 42;

  return (
    <>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90, marginBottom: 18 }}>
        {meses.map((m) => (
          <button
            key={m.k}
            onClick={() => setSelecionado(m.k)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '100%',
                height: Math.max(6, (m.total / maxTotal) * 60),
                borderRadius: 4,
                background: m.k === selecionado ? color.accent : color.chart[3],
              }}
            />
            <span style={{ fontSize: 9.5, color: m.k === selecionado ? color.accentLight : color.textWeak }}>
              {monthLabel(state.month.label, m.k)}
            </span>
          </button>
        ))}
      </div>

      <div
        style={{
          borderRadius: radius.card,
          padding: 16,
          background: color.surfaceInset,
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 4 }}>
          Previsão de {monthLabel(state.month.label, selecionado)}
        </div>
        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-.025em', fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
          {brl(mes.total)}
        </div>
        <div style={{ fontSize: 12, color: alerta ? color.alertText : color.textMedium, marginBottom: 10 }}>
          {pctRenda.toFixed(0)}% da renda fixa do casal
          {alerta ? ' — passa de 42% da renda fixa' : ''}
        </div>
        <div style={{ fontSize: 12, color: color.textMedium }}>Contas fixas do mês: {brl(mes.totalContasFixas)}</div>
        <div style={{ fontSize: 12, color: color.textMedium }}>
          Parcelas em aberto: {brl(mes.total - mes.totalContasFixas - mes.totalSimulacao)}
        </div>
        {mes.totalSimulacao > 0 && (
          <div style={{ fontSize: 12, color: color.accentLight, marginTop: 4 }}>
            Inclui a simulação: {brl(mes.totalSimulacao)}
          </div>
        )}
      </div>

      {mes.contasFixas.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 8 }}>Contas fixas (se repetem todo mês)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {mes.contasFixas.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: color.surface,
                  borderRadius: radius.row,
                  padding: '10px 12px',
                  fontSize: 13.5,
                }}
              >
                <span>{b.name}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(b.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 8 }}>Parcelas deste mês</div>
      {mes.parcelasAtivas.length === 0 ? (
        <div style={{ fontSize: 13, color: color.textWeak }}>Nenhuma parcela ativa neste mês.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mes.parcelasAtivas.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                background: color.surface,
                borderRadius: radius.row,
                padding: '10px 12px',
                fontSize: 13.5,
              }}
            >
              <span style={{ minWidth: 0 }}>
                {p.name} <span style={{ color: color.textWeak, fontSize: 11.5 }}>· parcela {p.parcelaAtual} de {p.count}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{brl(p.value)}</span>
                {onDeleteInstallment && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Apagar todas as parcelas de "${p.name}"? Isso remove de todos os meses futuros.`))
                        onDeleteInstallment(p.id);
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                    aria-label={`Apagar parcelas de ${p.name}`}
                  >
                    <Trash size={14} color={color.textWeak} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const PARCELAS_OPCOES = [1, 2, 3, 6, 10, 12, 18];

function Simulador({ onLancar }) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState(1);

  const valorNum = Number(valor.replace(',', '.')) || 0;
  const per = parcelas > 0 ? Math.round((valorNum / parcelas) * 100) / 100 : 0;
  const pronto = nome.trim() !== '' && valorNum > 0;

  function lancar() {
    if (!pronto) return;
    onLancar({ name: nome, value: valorNum, parcelas, per });
    setNome('');
    setValor('');
    setParcelas(1);
  }

  return (
    <div style={{ borderRadius: radius.card, padding: 16, border: `1px dashed ${color.accent}`, background: 'rgba(145,132,217,.16)' }}>
      <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 10 }}>Simulador de compra</div>
      <input
        placeholder="Nome (ex. Geladeira)"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{
          width: '100%',
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: radius.row,
          padding: '10px 12px',
          color: color.text,
          fontSize: 14,
          marginBottom: 8,
          outline: 'none',
        }}
      />
      <input
        placeholder="Valor total (ex. 3600)"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        style={{
          width: '100%',
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: radius.row,
          padding: '10px 12px',
          color: color.text,
          fontSize: 14,
          marginBottom: 10,
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {PARCELAS_OPCOES.map((n) => (
          <button
            key={n}
            onClick={() => setParcelas(n)}
            style={{
              padding: '6px 12px',
              borderRadius: 99,
              border: `1px solid ${parcelas === n ? color.accent : color.border}`,
              background: parcelas === n ? color.surfaceElevated : 'transparent',
              color: parcelas === n ? color.accentChipText : 'rgba(233,233,237,.6)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {n}×
          </button>
        ))}
      </div>

      {pronto && (
        <div style={{ fontSize: 12.5, color: color.textMedium, marginBottom: 12, lineHeight: 1.5 }}>
          {parcelas}× de {brl(per)}
          <br />
          Última parcela em {parcelas} {parcelas === 1 ? 'mês' : 'meses'} a partir de agora.
        </div>
      )}

      <button
        onClick={lancar}
        disabled={!pronto}
        style={{
          width: '100%',
          padding: '11px 0',
          borderRadius: radius.row,
          border: `1px solid ${pronto ? color.accent : 'transparent'}`,
          background: pronto ? color.accentSoft : 'transparent',
          color: pronto ? color.accentLight : 'rgba(233,233,237,.35)',
          fontSize: 14,
          fontWeight: 500,
          cursor: pronto ? 'pointer' : 'default',
        }}
      >
        Simular
      </button>
    </div>
  );
}

export default function Bills({ state, onTogglePaid, onEditBill, onDeleteBill, onDeleteSharedPurchase, onLancarInstallment, onDeleteInstallment, onFecharMes, rendaCasal, rendaFixaCasal }) {
  const [view, setView] = useState('mes');
  const [simulacao, setSimulacao] = useState(null);

  return (
    <div style={{ padding: '64px 20px 168px' }}>
      <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', marginBottom: 20 }}>Contas</div>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: 'mes', label: 'Este mês' },
          { id: 'futuro', label: 'Meses futuros' },
          { id: 'historico', label: 'Histórico' },
        ]}
      />

      {view === 'mes' && (
        <EstesMes
          bills={state.bills}
          sharedPurchases={state.sharedPurchases || []}
          onTogglePaid={onTogglePaid}
          onEditBill={onEditBill}
          onDeleteBill={onDeleteBill}
          onDeleteSharedPurchase={onDeleteSharedPurchase}
          rendaCasal={rendaCasal}
          mesAtualLabel={state.month.label}
          onFecharMes={onFecharMes}
        />
      )}

      {view === 'historico' && <Historico historico={state.historico || []} />}

      {view === 'futuro' && (
        <>
          <MesesFuturos state={state} rendaFixaCasal={rendaFixaCasal} simulacao={simulacao} onDeleteInstallment={onDeleteInstallment} />
          <div style={{ marginTop: 20 }}>
            <Simulador
              onLancar={(sim) => {
                setSimulacao(sim);
              }}
            />
            {simulacao && (
              <button
                onClick={() => {
                  onLancarInstallment(simulacao);
                  setSimulacao(null);
                }}
                style={{
                  width: '100%',
                  marginTop: 10,
                  padding: '11px 0',
                  borderRadius: radius.row,
                  border: `1px solid ${color.accent}`,
                  background: color.accentSoft,
                  color: color.accentLight,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Confirmar: lançar "{simulacao.name}" nas faturas
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
