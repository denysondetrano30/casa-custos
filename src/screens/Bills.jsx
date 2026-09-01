import { useState } from 'react';
import { CheckCircle, Circle, PencilSimple, Trash, Plus, CreditCard } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';
import { buildFutureMonths, monthLabel } from '../lib/futureBills';
import { commitmentIdForSharedPurchase } from '../lib/commitments';
import { buildCardUsage } from '../lib/cardLimits';
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

// Descobre, no resultado da divisão, quem ficou responsável por um
// compromisso (uma conta ou compra específica) e devolve um textinho tipo
// "Rui" ou "Rui e Ana" (quando essa foi a única conta dividida no meio).
function textoResponsavel(commitmentId, splitResult, names) {
  if (!splitResult) return null;
  const partes = [];
  for (const pessoa of ['Rui', 'Ana']) {
    const item = (splitResult[pessoa] || []).find((i) => i.id === commitmentId);
    if (item) partes.push(names[pessoa] || pessoa);
  }
  return partes.length ? partes.join(' e ') : null;
}

function EstesMes({
  bills,
  sharedPurchases = [],
  onEditBill,
  onDeleteBill,
  onDeleteSharedPurchase,
  onEditSharedPurchaseCategory,
  onToggleSharedPurchasePaid,
  cats = [],
  rendaCasal,
  mesAtualLabel,
  onFecharMes,
  hoje,
  splitResult,
  names = { Rui: 'Rui', Ana: 'Ana' },
}) {
  const totalContas = bills.reduce((s, b) => s + b.value, 0);
  const totalCompras = sharedPurchases.reduce((s, p) => s + p.value, 0);
  const saldo = rendaCasal - totalContas - totalCompras;
  const pctComprometido = rendaCasal > 0 ? ((totalContas + totalCompras) / rendaCasal) * 100 : 0;

  const porSemana = {};
  bills.forEach((b) => {
    const semana = Math.min(4, Math.ceil((b.due || 1) / 7));
    porSemana[semana] = porSemana[semana] || [];
    porSemana[semana].push(b);
  });

  // Contas fixas com vencimento hoje ou já passado que ainda não foram
  // marcadas como pagas — é o aviso "olha, isso ainda precisa ser pago".
  const vencidas = hoje ? bills.filter((b) => !b.paid && (b.due || 1) <= hoje) : [];

  // O marcar como pago das contas fixas continua vivendo no Perfil de cada
  // pessoa. Já a compra de cartão pode ser marcada aqui mesmo, direto na
  // lista detalhada — e, diferente da conta fixa, assim que ela é marcada
  // como paga ela sai do valor dividido (porque já foi resolvida entre
  // vocês de outro jeito, não faz sentido continuar "devendo" ela).
  const pendentes = [
    ...bills.filter((b) => !b.paid).map((b) => ({ id: `bill-${b.id}`, name: b.name, value: b.value })),
    ...sharedPurchases
      .filter((p) => !p.paid)
      .map((p) => ({ id: commitmentIdForSharedPurchase(p), name: p.name, value: p.value })),
  ];

  return (
    <>
      {vencidas.length > 0 && (
        <div
          style={{
            borderRadius: radius.card,
            padding: 14,
            background: 'rgba(201,138,138,.12)',
            border: `1px solid ${color.alertBar}`,
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 12.5, color: color.alertText, fontWeight: 500, marginBottom: 6 }}>
            {vencidas.length === 1 ? 'Uma conta está vencendo ou já venceu' : `${vencidas.length} contas estão vencendo ou já venceram`}
          </div>
          {vencidas.map((b) => (
            <div key={b.id} style={{ fontSize: 12, color: color.alertText, lineHeight: 1.6 }}>
              {b.name} · dia {b.due} · {brl(b.value)} — ainda precisa guardar esse valor pra pagar
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          borderRadius: radius.card,
          padding: 16,
          background: color.surfaceInset,
          marginBottom: 22,
        }}
      >
        <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 6 }}>Total gasto este mês</div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-.025em',
            fontVariantNumeric: 'tabular-nums',
            color: color.text,
          }}
        >
          {brl(totalContas + totalCompras)}
        </div>
        <div style={{ fontSize: 12, color: saldo < 0 ? color.alertText : color.textMedium, marginTop: 8 }}>
          {saldo < 0 ? 'Faltam para fechar o mês' : 'Sobra'}: {brl(saldo)} (de {brl(rendaCasal)} de renda)
        </div>
        {rendaCasal > 0 && (
          <div style={{ fontSize: 12, color: pctComprometido >= 100 ? color.alertText : color.textMedium }}>
            {pctComprometido.toFixed(0)}% da renda do casal já está comprometida esse mês
          </div>
        )}
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
                onClick={() => onToggleSharedPurchasePaid && onToggleSharedPurchasePaid(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: color.surface,
                  borderRadius: radius.row,
                  padding: '11px 12px',
                  cursor: onToggleSharedPurchasePaid ? 'pointer' : 'default',
                }}
              >
                {p.paid ? (
                  <CheckCircle size={18} weight="fill" color={color.accentIcon} />
                ) : (
                  <Circle size={18} color={color.textWeak} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      color: p.paid ? color.textWeak : color.text,
                      textDecoration: p.paid ? 'line-through' : 'none',
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: color.textWeak }}>
                    {p.category ? cats.find((c) => c.id === p.category)?.name || p.category : 'sem categoria'}
                  </div>
                </div>
                <span style={{ fontSize: 13.5, fontVariantNumeric: 'tabular-nums', color: p.paid ? color.textWeak : color.text }}>
                  {brl(p.value)}
                </span>
                {onEditSharedPurchaseCategory && cats.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const opcoes = cats.map((c) => c.name).join(', ');
                      const resposta = window.prompt(
                        `Categoria de "${p.name}" (opções: ${opcoes}). Deixe em branco pra tirar a categoria.`,
                        cats.find((c) => c.id === p.category)?.name || ''
                      );
                      if (resposta === null) return;
                      const escolhida = cats.find((c) => c.name.toLowerCase() === resposta.trim().toLowerCase());
                      if (resposta.trim() && !escolhida) {
                        window.alert(`Não achei essa categoria. Escolha uma entre: ${opcoes}.`);
                        return;
                      }
                      onEditSharedPurchaseCategory(p.id, escolhida ? escolhida.id : null);
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                    aria-label={`Editar categoria de ${p.name}`}
                  >
                    <PencilSimple size={14} color={color.textWeak} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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
            Essas compras vêm do extrato importado (ou lançadas na mão) e sempre contam no saldo acima. Toque numa
            pra marcar como paga — aí ela sai do valor dividido na Divisão e no Perfil, porque já foi resolvida de
            outro jeito. Na Divisão, todas juntam numa fatura só por cartão, mesmo as categorizadas como Mercado —
            a categoria aqui é só pra saber onde foi o dinheiro.
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: color.surface,
                    borderRadius: radius.row,
                    padding: '11px 12px',
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

      {pendentes.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 8 }}>
            Ainda pendente este mês ({brl(pendentes.reduce((s, i) => s + i.value, 0))})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendentes.map((item) => {
              const responsavel = textoResponsavel(item.id, splitResult, names);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: color.surfaceInset,
                    borderRadius: radius.row,
                    padding: '10px 12px',
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div>{item.name}</div>
                    {responsavel && (
                      <div style={{ fontSize: 11, color: color.textWeak, marginTop: 2 }}>
                        fica com {responsavel}
                      </div>
                    )}
                  </div>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(item.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {onFecharMes && (
        <div style={{ marginTop: 26, borderTop: `1px solid ${color.borderSubtle}`, paddingTop: 18 }}>
          <button
            onClick={() => {
              const avisoPendentes =
                pendentes.length > 0
                  ? `\n\nAtenção: ainda tem ${pendentes.length} ${pendentes.length === 1 ? 'pendência' : 'pendências'} não marcada(s) como paga(s), totalizando ${brl(
                      pendentes.reduce((s, i) => s + i.value, 0)
                    )}. Isso vai ficar registrado no Histórico, mas some da tela deste mês.`
                  : '';
              if (
                window.confirm(
                  `Fechar ${mesAtualLabel} e começar o mês seguinte?\n\nIsso guarda um resumo de ${mesAtualLabel} no Histórico e zera os gastos, compras de cartão e gastos pessoais variáveis pro mês novo. Contas fixas, parcelas e metas continuam do jeito que estão.${avisoPendentes}`
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

function MesesFuturos({ state, rendaFixaCasal, simulacao, onDeleteInstallment, cats = [] }) {
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
          {mes.k === 0 ? 'Compras no cartão deste mês' : 'Parcelas em aberto'}:{' '}
          {brl(mes.total - mes.totalContasFixas - mes.totalSimulacao)}
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

      {mes.k === 0 ? (
        <>
          <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 8 }}>Compras no cartão deste mês</div>
          {(state.sharedPurchases || []).length === 0 ? (
            <div style={{ fontSize: 13, color: color.textWeak }}>Nenhuma compra lançada neste mês ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(state.sharedPurchases || []).map((p) => (
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
                    {p.name}{' '}
                    <span style={{ color: color.textWeak, fontSize: 11.5 }}>
                      · {p.category ? cats.find((c) => c.id === p.category)?.name || p.category : 'sem categoria'}
                    </span>
                  </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{brl(p.value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
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
      )}
    </>
  );
}

// Cartões de crédito cadastrados, com quanto do limite já está
// comprometido — a fatura deste mês mais as parcelas que ainda vão cair
// nele nos próximos meses. É só informativo: não muda orçamento, divisão
// nem o alerta de 42% da renda, só ajuda a não precisar abrir o app do
// banco pra saber quanto ainda sobra de limite.
function Cartoes({ state, onAddCard, onEditCard, onDeleteCard }) {
  const cards = state.cards || [];

  function novoCartao() {
    const nome = window.prompt('Nome do cartão (ex. Nubank):');
    if (nome === null || !nome.trim()) return;
    const limiteStr = window.prompt('Limite total desse cartão (só números, ex. 1900):');
    if (limiteStr === null) return;
    const limite = Number(String(limiteStr).replace(',', '.'));
    if (Number.isNaN(limite) || limite <= 0) {
      window.alert('Isso não parece um valor válido.');
      return;
    }
    onAddCard(nome.trim(), limite);
  }

  function editarCartao(card) {
    const nome = window.prompt('Nome do cartão:', card.name);
    if (nome === null || !nome.trim()) return;
    const limiteStr = window.prompt('Limite total (só números):', card.limit);
    if (limiteStr === null) return;
    const limite = Number(String(limiteStr).replace(',', '.'));
    if (Number.isNaN(limite) || limite <= 0) {
      window.alert('Isso não parece um valor válido.');
      return;
    }
    onEditCard(card.id, { name: nome.trim(), limit: limite });
  }

  return (
    <>
      {cards.length === 0 ? (
        <div style={{ fontSize: 13, color: color.textWeak, marginBottom: 16 }}>
          Nenhum cartão cadastrado ainda. Cadastre pra acompanhar o limite disponível de cada um, sem precisar abrir o
          app do banco.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          {cards.map((card) => {
            const uso = buildCardUsage(state, card.id);
            const disponivel = card.limit - uso.comprometido;
            const pct = card.limit > 0 ? Math.min(100, (uso.comprometido / card.limit) * 100) : 0;
            const estourou = uso.comprometido > card.limit;
            return (
              <div key={card.id} style={{ borderRadius: radius.card, padding: 16, background: color.surfaceInset }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={17} color={color.accentIcon} />
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{card.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => editarCartao(card)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                      aria-label={`Editar ${card.name}`}
                    >
                      <PencilSimple size={14} color={color.textWeak} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Apagar o cartão "${card.name}"? As compras já lançadas continuam, só deixam de ter cartão identificado.`))
                          onDeleteCard(card.id);
                      }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                      aria-label={`Apagar ${card.name}`}
                    >
                      <Trash size={14} color={color.textWeak} />
                    </button>
                  </div>
                </div>

                <div style={{ height: 6, borderRadius: 99, background: color.borderSubtle, overflow: 'hidden', marginBottom: 8 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: estourou ? color.alertBar : `linear-gradient(90deg, ${color.chart[2]}, ${color.accent})`,
                    }}
                  />
                </div>

                <div style={{ fontSize: 12.5, color: estourou ? color.alertText : color.textMedium, marginBottom: 2 }}>
                  {brl(uso.comprometido)} comprometido de {brl(card.limit)}
                </div>
                <div style={{ fontSize: 12.5, color: estourou ? color.alertText : color.text, fontWeight: 500 }}>
                  {disponivel >= 0 ? `${brl(disponivel)} disponível` : `${brl(Math.abs(disponivel))} acima do limite`}
                </div>
                <div style={{ fontSize: 10.5, color: color.textWeak, marginTop: 6 }}>
                  {brl(uso.faturaDesteMes)} na fatura deste mês + {brl(uso.futuroComprometido)} em parcelas dos próximos meses
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={novoCartao}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '11px 0',
          borderRadius: radius.row,
          border: `1px solid ${color.border}`,
          background: 'transparent',
          color: color.textMedium,
          fontSize: 13.5,
          cursor: 'pointer',
        }}
      >
        <Plus size={14} /> Novo cartão
      </button>
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

export default function Bills({
  state,
  onEditBill,
  onDeleteBill,
  onDeleteSharedPurchase,
  onEditSharedPurchaseCategory,
  onToggleSharedPurchasePaid,
  onLancarInstallment,
  onDeleteInstallment,
  onFecharMes,
  rendaCasal,
  rendaFixaCasal,
  splitResult,
  names,
  onAddCard,
  onEditCard,
  onDeleteCard,
}) {
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
          { id: 'cartoes', label: 'Cartões' },
          { id: 'historico', label: 'Histórico' },
        ]}
      />

      {view === 'mes' && (
        <EstesMes
          bills={state.bills}
          sharedPurchases={state.sharedPurchases || []}
          onEditBill={onEditBill}
          onDeleteBill={onDeleteBill}
          onDeleteSharedPurchase={onDeleteSharedPurchase}
          onEditSharedPurchaseCategory={onEditSharedPurchaseCategory}
          onToggleSharedPurchasePaid={onToggleSharedPurchasePaid}
          cats={state.cats}
          rendaCasal={rendaCasal}
          mesAtualLabel={state.month.label}
          onFecharMes={onFecharMes}
          hoje={state.month.today}
          splitResult={splitResult}
          names={names}
        />
      )}

      {view === 'cartoes' && (
        <Cartoes state={state} onAddCard={onAddCard} onEditCard={onEditCard} onDeleteCard={onDeleteCard} />
      )}

      {view === 'historico' && <Historico historico={state.historico || []} names={names} />}

      {view === 'futuro' && (
        <>
          <MesesFuturos state={state} rendaFixaCasal={rendaFixaCasal} simulacao={simulacao} onDeleteInstallment={onDeleteInstallment} cats={state.cats} />
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
