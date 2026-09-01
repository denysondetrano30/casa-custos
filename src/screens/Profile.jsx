import { useState } from 'react';
import { X, Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';

function Segmented({ value, onChange, options, labels }) {
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
            {labels ? labels[opt] : opt}
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

function ListaValores({ titulo, itens, vazio, onEditItem, onDeleteItem }) {
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
                alignItems: 'center',
                justifyContent: 'space-between',
                background: color.surface,
                borderRadius: radius.row,
                padding: '10px 12px',
                fontSize: 13.5,
              }}
            >
              <span>{item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(item.part ?? item.value)}</span>
                {onEditItem && (
                  <button
                    onClick={() => onEditItem(item)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                    aria-label={`Editar ${item.name}`}
                  >
                    <PencilSimple size={13} color={color.textWeak} />
                  </button>
                )}
                {onDeleteItem && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Apagar "${item.name}"?`)) onDeleteItem(item.id);
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                    aria-label={`Apagar ${item.name}`}
                  >
                    <Trash size={13} color={color.textWeak} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function mesAtualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Resumo anual de recebimentos PJ — pensado pra facilitar a declaração de
// imposto de renda anual: total recebido em cada mês e no ano inteiro,
// mais a lista de cada recebimento pra conferir depois.
function RecebimentosPJ({ itens = [], onAdd, onEdit, onDelete }) {
  const anos = Array.from(new Set(itens.map((i) => i.mes.slice(0, 4))));
  const anoAtual = String(new Date().getFullYear());
  if (!anos.includes(anoAtual)) anos.push(anoAtual);
  anos.sort();

  const [ano, setAno] = useState(anoAtual);

  const doAno = itens.filter((i) => i.mes.startsWith(ano));
  const totalAno = doAno.reduce((s, i) => s + i.valor, 0);
  const porMes = MESES_NOMES.map((nome, idx) => {
    const mesISO = `${ano}-${String(idx + 1).padStart(2, '0')}`;
    const soma = doAno.filter((i) => i.mes === mesISO).reduce((s, i) => s + i.valor, 0);
    return { nome, soma };
  });

  const ordenados = [...doAno].sort((a, b) => (a.mes < b.mes ? 1 : -1));

  function registrar() {
    const mes = window.prompt('Mês do recebimento (formato AAAA-MM, ex. 2026-08):', mesAtualISO());
    if (mes === null) return;
    if (!/^\d{4}-\d{2}$/.test(mes.trim())) {
      window.alert('Formato inválido. Use AAAA-MM, por exemplo 2026-08.');
      return;
    }
    const valorStr = window.prompt('Valor recebido (só números, ex. 4500):');
    if (valorStr === null) return;
    const valor = Number(String(valorStr).replace(',', '.'));
    if (Number.isNaN(valor) || valor <= 0) {
      window.alert('Isso não parece um valor válido.');
      return;
    }
    const obs = window.prompt('Observação (opcional — ex. nome do cliente/nota fiscal):', '') || '';
    onAdd({ mes: mes.trim(), valor, obs });
  }

  function editar(item) {
    const mes = window.prompt('Mês do recebimento (formato AAAA-MM):', item.mes);
    if (mes === null) return;
    if (!/^\d{4}-\d{2}$/.test(mes.trim())) {
      window.alert('Formato inválido. Use AAAA-MM, por exemplo 2026-08.');
      return;
    }
    const valorStr = window.prompt('Valor recebido:', item.valor);
    if (valorStr === null) return;
    const valor = Number(String(valorStr).replace(',', '.'));
    if (Number.isNaN(valor) || valor <= 0) {
      window.alert('Isso não parece um valor válido.');
      return;
    }
    const obs = window.prompt('Observação (opcional):', item.obs || '') || '';
    onEdit(item.id, { mes: mes.trim(), valor, obs });
  }

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <SectionLabel>Recebimentos PJ (declaração anual)</SectionLabel>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {anos.map((a) => (
          <button
            key={a}
            onClick={() => setAno(a)}
            style={{
              padding: '6px 14px',
              borderRadius: radius.chip,
              border: `1px solid ${a === ano ? color.accent : color.border}`,
              background: a === ano ? color.surfaceElevated : 'transparent',
              color: a === ano ? color.accentChipText : 'rgba(233,233,237,.6)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <div
        style={{
          borderRadius: radius.card,
          padding: 16,
          background: color.surfaceInset,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 4 }}>Total recebido em {ano}</div>
        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-.025em', fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>
          {brl(totalAno)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {porMes.map((m) => (
            <div key={m.nome} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: color.textWeak }}>{m.nome}</div>
              <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: m.soma > 0 ? color.text : color.textWeak }}>
                {m.soma > 0 ? brl(m.soma, false) : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {ordenados.length === 0 ? (
        <div style={{ fontSize: 13, color: color.textWeak, marginBottom: 10 }}>Nenhum recebimento registrado em {ano}.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
          {ordenados.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: color.surface,
                borderRadius: radius.row,
                padding: '10px 12px',
                fontSize: 13.5,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div>{item.mes}{item.obs ? ` · ${item.obs}` : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(item.valor)}</span>
                <button
                  onClick={() => editar(item)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                  aria-label="Editar recebimento"
                >
                  <PencilSimple size={13} color={color.textWeak} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Apagar este recebimento?')) onDelete(item.id);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
                  aria-label="Apagar recebimento"
                >
                  <Trash size={13} color={color.textWeak} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={registrar}
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
        <Plus size={14} /> Registrar recebimento
      </button>
      <div style={{ fontSize: 10.5, color: color.textWeak, marginTop: 8, lineHeight: 1.5 }}>
        Isso é só um registro pra facilitar sua declaração anual — não entra em nenhuma conta ou divisão do casal.
      </div>
    </div>
  );
}

// Cadastro/troca/remoção da senha da própria pessoa, usada pra travar o app
// (ver src/screens/Lock.jsx). Cada um cuida só da sua senha.
function SecaoSenha({ pessoa, temSenha, onSetPin, onRemovePin }) {
  function definirOuTrocar() {
    const pin = window.prompt(
      temSenha ? 'Nova senha (4 a 6 números):' : 'Crie uma senha de 4 a 6 números pra travar o app:'
    );
    if (pin === null) return;
    if (!/^\d{4,6}$/.test(pin.trim())) {
      window.alert('A senha precisa ter só números, de 4 a 6 dígitos.');
      return;
    }
    const confirmacao = window.prompt('Digite a senha de novo pra confirmar:');
    if (confirmacao === null) return;
    if (confirmacao.trim() !== pin.trim()) {
      window.alert('As senhas digitadas são diferentes. Tente de novo.');
      return;
    }
    onSetPin(pessoa, pin.trim());
  }

  function remover() {
    if (window.confirm('Remover sua senha? O app vai parar de pedir senha se ninguém mais tiver uma cadastrada.')) {
      onRemovePin(pessoa);
    }
  }

  return (
    <div style={{ marginBottom: 22 }}>
      <SectionLabel>Segurança</SectionLabel>
      <div
        style={{
          borderRadius: radius.card,
          padding: 16,
          background: color.surfaceInset,
        }}
      >
        <div style={{ fontSize: 13, color: color.textMedium, marginBottom: 12, lineHeight: 1.5 }}>
          {temSenha
            ? 'Sua senha está ativa: sempre que o app for aberto de novo, ele vai pedir uma senha antes de mostrar qualquer informação.'
            : 'Cadastre uma senha pra travar o app — útil se alguém de fora pegar o celular. Não tem nada a ver com senha de banco ou cartão.'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={definirOuTrocar}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: radius.row,
              border: `1px solid ${color.border}`,
              background: 'transparent',
              color: color.textMedium,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {temSenha ? 'Trocar minha senha' : 'Criar minha senha'}
          </button>
          {temSenha && (
            <button
              onClick={remover}
              style={{
                padding: '10px 14px',
                borderRadius: radius.row,
                border: `1px solid ${color.border}`,
                background: 'transparent',
                color: color.alertText,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Remover
            </button>
          )}
        </div>
      </div>
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
  houseId,
  names = { Rui: 'Rui', Ana: 'Ana' },
  onUpdateName,
  onEditPersonalItem,
  onDeletePersonalItem,
  recebimentosPJ = { Rui: [], Ana: [] },
  onAddRecebimentoPJ,
  onEditRecebimentoPJ,
  onDeleteRecebimentoPJ,
  pins = { Rui: null, Ana: null },
  onSetPin,
  onRemovePin,
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

      {houseId && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: color.surfaceInset,
            borderRadius: radius.row,
            padding: '10px 14px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 11.5, color: color.textWeak }}>
            Código da casa (compartilhe para a outra pessoa entrar)
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '.08em' }}>{houseId}</div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <Segmented value={person} onChange={onChangePerson} options={['Rui', 'Ana']} labels={names} />
        </div>
      </div>

      {onUpdateName && (
        <button
          onClick={() => {
            const resposta = window.prompt(`Como quer ser chamado(a) no app? (hoje: "${names[person]}")`, names[person]);
            if (resposta === null) return;
            const nome = resposta.trim();
            if (!nome) return;
            onUpdateName(person, nome);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            color: color.textWeak,
            fontSize: 12,
            cursor: 'pointer',
            marginBottom: 20,
            padding: 0,
          }}
        >
          <PencilSimple size={12} /> Mudar meu nome de exibição
        </button>
      )}

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
      <ListaValores
        titulo="Contas pessoais fixas"
        itens={fixas}
        vazio="Nenhuma conta pessoal fixa."
        onEditItem={(item) => {
          const novoNome = window.prompt('Nome:', item.name);
          if (novoNome === null) return;
          const novoValorStr = window.prompt('Valor (só números):', item.value);
          if (novoValorStr === null) return;
          const novoValor = Number(String(novoValorStr).replace(',', '.'));
          if (!novoNome.trim() || Number.isNaN(novoValor) || novoValor < 0) {
            window.alert('Alguma dessas respostas não é válida. Tente de novo.');
            return;
          }
          onEditPersonalItem(person, 'fixed', item.id, { name: novoNome.trim(), value: novoValor });
        }}
        onDeleteItem={(id) => onDeletePersonalItem(person, 'fixed', id)}
      />
      <ListaValores
        titulo="Gastos pessoais variáveis"
        itens={variaveis}
        vazio="Nenhum gasto pessoal variável."
        onEditItem={(item) => {
          const novoNome = window.prompt('Nome:', item.name);
          if (novoNome === null) return;
          const novoValorStr = window.prompt('Valor (só números):', item.value);
          if (novoValorStr === null) return;
          const novoValor = Number(String(novoValorStr).replace(',', '.'));
          if (!novoNome.trim() || Number.isNaN(novoValor) || novoValor < 0) {
            window.alert('Alguma dessas respostas não é válida. Tente de novo.');
            return;
          }
          onEditPersonalItem(person, 'variable', item.id, { name: novoNome.trim(), value: novoValor });
        }}
        onDeleteItem={(id) => onDeletePersonalItem(person, 'variable', id)}
      />

      {onSetPin && (
        <SecaoSenha
          pessoa={person}
          temSenha={!!pins[person]}
          onSetPin={onSetPin}
          onRemovePin={onRemovePin}
        />
      )}

      {onAddRecebimentoPJ && (
        <RecebimentosPJ
          itens={recebimentosPJ[person] || []}
          onAdd={(dados) => onAddRecebimentoPJ(person, dados)}
          onEdit={(id, dados) => onEditRecebimentoPJ(person, id, dados)}
          onDelete={(id) => onDeleteRecebimentoPJ(person, id)}
        />
      )}

      <div style={{ marginTop: 24, fontSize: 12, color: color.textWeak, lineHeight: 1.5, marginBottom: 24 }}>
        Gasto real de {names[outraPessoa] || outraPessoa}: {brl(outroGastoReal)}
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

        <button
          onClick={() => signOut(auth)}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '11px 0',
            borderRadius: radius.row,
            border: `1px solid ${color.border}`,
            background: 'transparent',
            color: color.textMedium,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
