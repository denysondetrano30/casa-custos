import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';

// Lista os meses já fechados, com o total gasto e a divisão por categoria
// de cada um — pra comparar a evolução mês a mês (ex. "quanto gastamos de
// Mercado em julho vs agosto").
export default function Historico({ historico = [], names = { Rui: 'Rui', Ana: 'Ana' } }) {
  if (historico.length === 0) {
    return (
      <div style={{ fontSize: 13, color: color.textWeak, padding: '4px 2px' }}>
        Nenhum mês fechado ainda. Quando você fechar o mês (na aba "Este mês"), ele aparece aqui.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {historico.map((mes) => {
        const sobra = mes.rendaCasal - mes.gastoTotalCasal;
        return (
          <div
            key={mes.id}
            style={{
              borderRadius: radius.card,
              padding: 16,
              background: color.surfaceInset,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{mes.label}</span>
              <span style={{ fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>{brl(mes.gastoTotalCasal)}</span>
            </div>

            <div style={{ fontSize: 11.5, color: sobra >= 0 ? color.textMedium : color.alertText, marginBottom: 12 }}>
              {sobra >= 0 ? `Sobrou ${brl(sobra)}` : `Passou ${brl(Math.abs(sobra))} da renda`} · renda {brl(mes.rendaCasal)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mes.cats.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: color.textMedium }}>{c.name}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(c.spent)}</span>
                </div>
              ))}
            </div>

            {mes.pendencias && mes.pendencias.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${color.borderSubtle}` }}>
                <div style={{ fontSize: 11, color: color.alertText, marginBottom: 6 }}>
                  Ficou pendente ao fechar o mês:
                </div>
                {mes.pendencias.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: color.textMedium, marginBottom: 3 }}>
                    <span>
                      {p.name}
                      {p.responsaveis && p.responsaveis.length > 0 && (
                        <span style={{ color: color.textWeak }}>
                          {' '}
                          · {p.responsaveis.map((r) => names[r.pessoa] || r.pessoa).join(' e ')}
                        </span>
                      )}
                    </span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(p.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
