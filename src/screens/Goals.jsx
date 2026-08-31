import { useState } from 'react';
import { Target, Plus } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';
import { monthLabel } from '../lib/futureBills';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Quantos meses faltam entre o mês atual do app (ex. "Agosto 2026") e um
// mês/ano escolhido num <input type="month"> (formato "2027-12").
function mesesAte(baseMonthLabel, valorInputMonth) {
  if (!valorInputMonth) return null;
  const [nomeMes, ano] = baseMonthLabel.split(' ');
  const idxBase = MESES.findIndex((m) => nomeMes.toLowerCase().startsWith(m));
  const baseTotal = Number(ano) * 12 + idxBase;

  const [anoAlvo, mesAlvoNum] = valorInputMonth.split('-').map(Number);
  const alvoTotal = anoAlvo * 12 + (mesAlvoNum - 1);

  return alvoTotal - baseTotal;
}

function GoalCard({ goal, baseMonthLabel }) {
  const pct = Math.min(100, (goal.saved / goal.target) * 100);
  const falta = Math.max(0, goal.target - goal.saved);
  const mesesRestantes = goal.monthly > 0 ? Math.ceil(falta / goal.monthly) : null;
  const previsao = mesesRestantes === null
    ? 'sem aporte definido'
    : mesesRestantes === 0
      ? 'concluída'
      : `previsão: ${monthLabel(baseMonthLabel, mesesRestantes)}`;

  return (
    <div
      style={{
        borderRadius: radius.card,
        padding: 16,
        background: color.surface,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: color.surfaceElevated,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Target size={16} color={color.accentIcon} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14 }}>{goal.name}</div>
          <div style={{ fontSize: 11, color: color.textWeak }}>{previsao}</div>
        </div>
      </div>

      <div style={{ fontSize: 13.5, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
        {brl(goal.saved)} de {brl(goal.target)}
      </div>

      <div style={{ height: 6, borderRadius: 99, background: color.borderSubtle, overflow: 'hidden', marginBottom: 8 }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color.chart[2]}, ${color.accent})`,
          }}
        />
      </div>

      <div style={{ fontSize: 11.5, color: color.textMedium }}>
        Aporte mensal {brl(goal.monthly)} · {pct.toFixed(0)}%
      </div>
    </div>
  );
}

function NovaMetaForm({ onAdd, onClose, baseMonthLabel }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [dataAlvo, setDataAlvo] = useState('');
  const [monthlyManual, setMonthlyManual] = useState('');

  const meses = mesesAte(baseMonthLabel, dataAlvo);
  const mesesValidos = meses !== null && meses > 0;
  const aporteSugerido = mesesValidos && Number(target) > 0 ? Number(target) / meses : 0;
  const monthly = monthlyManual !== '' ? Number(monthlyManual) : Math.ceil(aporteSugerido);

  const pronto = name.trim() !== '' && Number(target) > 0;

  function inputStyle() {
    return {
      width: '100%',
      background: color.surface,
      border: `1px solid ${color.border}`,
      borderRadius: radius.row,
      padding: '11px 12px',
      color: color.text,
      fontSize: 14,
      marginBottom: 10,
      outline: 'none',
    };
  }

  return (
    <div style={{ borderRadius: radius.card, padding: 16, background: color.surfaceInset, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 10 }}>Nova meta</div>
      <input style={inputStyle()} placeholder="Nome (ex. Viagem)" value={name} onChange={(e) => setName(e.target.value)} />
      <input style={inputStyle()} placeholder="Valor alvo (ex. 12000)" value={target} onChange={(e) => setTarget(e.target.value)} />
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 6 }}>Quer juntar até quando?</div>
        <input
          type="month"
          style={inputStyle()}
          value={dataAlvo}
          onChange={(e) => setDataAlvo(e.target.value)}
        />
      </div>

      {dataAlvo && !mesesValidos && (
        <div style={{ fontSize: 12, color: color.alertText, marginBottom: 10 }}>
          Escolha um mês depois do mês atual ({baseMonthLabel}).
        </div>
      )}

      {mesesValidos && Number(target) > 0 && (
        <div style={{ fontSize: 12, color: color.textMedium, marginBottom: 10, lineHeight: 1.5 }}>
          Faltam {meses} {meses === 1 ? 'mês' : 'meses'} — aporte sugerido: <strong>{brl(Math.ceil(aporteSugerido))}</strong>/mês
        </div>
      )}

      <input
        style={inputStyle()}
        placeholder={mesesValidos ? `Aporte mensal (sugestão: ${Math.ceil(aporteSugerido)})` : 'Aporte mensal (ex. 400)'}
        value={monthlyManual}
        onChange={(e) => setMonthlyManual(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            if (!pronto) return;
            onAdd({ name, target: Number(target), monthly: monthly || 0 });
          }}
          disabled={!pronto}
          style={{
            flex: 1,
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
          Criar meta
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '11px 16px',
            borderRadius: radius.row,
            border: `1px solid ${color.border}`,
            background: 'transparent',
            color: color.textMedium,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function Goals({ goals, baseMonthLabel, onAddGoal }) {
  const [criando, setCriando] = useState(false);

  return (
    <div style={{ padding: '64px 20px 168px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em' }}>Metas</div>
        {!criando && (
          <button
            onClick={() => setCriando(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: `1px solid ${color.border}`,
              borderRadius: 99,
              padding: '7px 12px',
              color: color.textMedium,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Nova meta
          </button>
        )}
      </div>

      {criando && (
        <NovaMetaForm
          baseMonthLabel={baseMonthLabel}
          onAdd={(goal) => {
            onAddGoal(goal);
            setCriando(false);
          }}
          onClose={() => setCriando(false)}
        />
      )}

      {goals.length === 0 && !criando && (
        <div style={{ fontSize: 13, color: color.textWeak }}>Nenhuma meta ainda. Toque em "Nova meta" para começar.</div>
      )}

      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} baseMonthLabel={baseMonthLabel} />
      ))}
    </div>
  );
}
