import { useState } from 'react';
import { House, User, Receipt, TrendUp, Backspace, Plus } from '@phosphor-icons/react';
import { color, radius } from '../lib/tokens';
import { brl } from '../lib/format';
import { opcoesPagamento } from '../lib/paymentMethods';

const TYPES = [
  { id: 'casa', label: 'Casa', Icon: House },
  { id: 'pessoal', label: 'Pessoal', Icon: User },
  { id: 'conta', label: 'Conta fixa', Icon: Receipt },
  { id: 'renda', label: 'Renda', Icon: TrendUp },
];

const SAVE_LABEL = {
  casa: 'Salvar gasto',
  pessoal: 'Salvar gasto pessoal',
  conta: 'Criar conta',
  renda: 'Salvar renda',
};

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: radius.chip,
        border: `1px solid ${active ? color.accent : color.border}`,
        background: active ? color.surfaceElevated : 'transparent',
        color: active ? color.accentChipText : 'rgba(233,233,237,.6)',
        fontSize: 13,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: color.textMedium, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.row,
        padding: '11px 12px',
        color: color.text,
        fontSize: 14,
        outline: 'none',
      }}
    />
  );
}

export default function Add({
  onClose,
  onSave,
  initialPerson,
  initialType,
  initialRendaKind,
  names = { Rui: 'Rui', Ana: 'Ana' },
  personalCategories = ['Streaming', 'Academia', 'Assinaturas', 'Cabeleireiro', 'Cursos'],
  onAddPersonalCategory,
  cats = [],
  cards = [],
}) {
  const [addType, setAddType] = useState(initialType || 'casa');
  const [raw, setRaw] = useState('');

  // Onde o gasto foi pago: um dos cartões cadastrados (aí fica pendente
  // na fatura) ou débito/pix/dinheiro (aí já sai como pago).
  const pagamentos = opcoesPagamento(cards);
  const [pagamentoId, setPagamentoId] = useState(pagamentos[0]?.id || 'debito');

  const [cat, setCat] = useState(cats[0]?.id || '');
  const [payer, setPayer] = useState('Ana');
  const [desc, setDesc] = useState('');

  const [addPerson, setAddPerson] = useState(initialPerson || 'Rui');
  const [pcat, setPcat] = useState(personalCategories[0] || '');
  const [addRecurring, setAddRecurring] = useState(true);

  const [addName, setAddName] = useState('');
  const [addDue, setAddDue] = useState('');
  const [contaCat, setContaCat] = useState(cats[0]?.id || '');

  const [rendaKind, setRendaKind] = useState(initialRendaKind || 'fixa');

  const value = Number(raw || '0') / 100;

  function pressDigit(d) {
    setRaw((r) => (r + d).slice(0, 9));
  }
  function pressBackspace() {
    setRaw((r) => r.slice(0, -1));
  }

  const pagamentoEscolhido = pagamentos.find((p) => p.id === pagamentoId);
  const textoOnde = pagamentoEscolhido
    ? pagamentoEscolhido.ehCartao
      ? `no cartão ${pagamentoEscolhido.label}`
      : `no ${pagamentoEscolhido.label.toLowerCase()}`
    : '';

  function hint() {
    if (addType === 'casa') return `${cats.find((c) => c.id === cat)?.name || ''} · pago por ${names[payer]} · ${textoOnde}`;
    if (addType === 'pessoal')
      return `${pcat} · ${names[addPerson]} · ${addRecurring ? 'repete todo mês' : 'só neste mês'} · ${textoOnde}`;
    if (addType === 'conta') {
      const nomeCat = cats.find((c) => c.id === contaCat)?.name;
      return `${nomeCat ? nomeCat + ' · ' : ''}${addDue ? `vence dia ${addDue}` : 'defina o dia de vencimento'}`;
    }
    if (addType === 'renda') return rendaKind === 'fixa' ? `renda fixa de ${names[addPerson]}` : `entrada extra de ${names[addPerson]}`;
    return '';
  }

  function canSave() {
    if (value <= 0) return false;
    if (addType === 'conta') {
      const dia = Number(addDue);
      return addName.trim() !== '' && Number.isInteger(dia) && dia >= 1 && dia <= 31;
    }
    return true;
  }

  function handleSave() {
    if (!canSave()) return;
    const payload = { addType, value, cat, payer, desc, addPerson, pcat, addRecurring, addName, addDue, contaCat, rendaKind, pagamentoId };
    onSave(payload);
  }

  // Campo "Onde foi pago", usado tanto no gasto de casa quanto no pessoal.
  const campoOndeFoiPago = (
    <Field label="Onde foi pago">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {pagamentos.map((p) => (
          <Chip key={p.id} active={pagamentoId === p.id} onClick={() => setPagamentoId(p.id)}>
            {p.label}
          </Chip>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: color.textWeak, marginTop: 6, lineHeight: 1.5 }}>
        {pagamentoEscolhido?.ehCartao
          ? addType === 'pessoal'
            ? 'Vai ficar pendente na fatura desse cartão e ocupando limite até você marcar como pago no Perfil.'
            : 'Fica registrado de onde saiu. Gasto de casa lançado aqui entra no orçamento da categoria — pra ele entrar na fatura dividida do cartão, use Início → Importar extrato.'
          : 'Já sai como pago, porque o dinheiro saiu da conta na hora.'}
        {cards.length === 0 && ' Cadastre seus cartões em Contas → Cartões pra escolher um aqui.'}
      </div>
    </Field>
  );

  return (
    <div style={{ padding: '64px 20px 40px', minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 28,
          overflowX: 'auto',
        }}
      >
        {TYPES.map(({ id, label, Icon }) => {
          const active = id === addType;
          return (
            <button
              key={id}
              onClick={() => setAddType(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '12px 6px',
                borderRadius: radius.row,
                border: `1px solid ${active ? color.accent : color.border}`,
                background: active ? color.surfaceElevated : 'transparent',
                cursor: 'pointer',
              }}
            >
              <Icon size={20} weight={active ? 'fill' : 'regular'} color={active ? color.accentLight : 'rgba(233,233,237,.6)'} />
              <span style={{ fontSize: 11, color: active ? color.accentChipText : 'rgba(233,233,237,.6)' }}>{label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 500,
            letterSpacing: '-.03em',
            fontVariantNumeric: 'tabular-nums',
            color: value > 0 ? color.text : color.textWeak,
          }}
        >
          {brl(value)}
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: color.textWeak, marginBottom: 22, minHeight: 16 }}>
        {hint()}
      </div>

      {addType === 'casa' && (
        <>
          <Field label="Categoria">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cats.map((c) => (
                <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Quem pagou">
            <div style={{ display: 'flex', gap: 8 }}>
              {['Ana', 'Rui'].map((p) => (
                <Chip key={p} active={payer === p} onClick={() => setPayer(p)}>
                  {names[p]}
                </Chip>
              ))}
            </div>
          </Field>
          {campoOndeFoiPago}
          <Field label="Descrição">
            <TextInput value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex. Mercado" />
          </Field>
        </>
      )}

      {addType === 'pessoal' && (
        <>
          <Field label="Pessoa">
            <div style={{ display: 'flex', gap: 8 }}>
              {['Rui', 'Ana'].map((p) => (
                <Chip key={p} active={addPerson === p} onClick={() => setAddPerson(p)}>
                  {names[p]}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Categoria">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {personalCategories.map((c) => (
                <Chip key={c} active={pcat === c} onClick={() => setPcat(c)}>
                  {c}
                </Chip>
              ))}
              {onAddPersonalCategory && (
                <button
                  onClick={() => {
                    const nome = window.prompt('Nome da nova categoria (ex. Pilates):');
                    if (!nome || !nome.trim()) return;
                    const limpo = nome.trim();
                    onAddPersonalCategory(limpo);
                    setPcat(limpo);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 14px',
                    borderRadius: radius.chip,
                    border: `1px dashed ${color.border}`,
                    background: 'transparent',
                    color: color.textMedium,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={13} /> Nova
                </button>
              )}
            </div>
          </Field>
          <Field label="Frequência">
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip active={addRecurring} onClick={() => setAddRecurring(true)}>Repete todo mês</Chip>
              <Chip active={!addRecurring} onClick={() => setAddRecurring(false)}>Só neste mês</Chip>
            </div>
          </Field>
          {campoOndeFoiPago}
          <Field label="Descrição">
            <TextInput value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex. Academia" />
          </Field>
        </>
      )}

      {addType === 'conta' && (
        <>
          <Field label="Nome da conta">
            <TextInput value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Ex. Internet" />
          </Field>
          <Field label="Categoria">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cats.map((c) => (
                <Chip key={c.id} active={contaCat === c.id} onClick={() => setContaCat(c.id)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Dia de vencimento">
            <TextInput
              type="number"
              min="1"
              max="31"
              value={addDue}
              onChange={(e) => setAddDue(e.target.value)}
              placeholder="Ex. 25"
            />
            {addDue !== '' && !(Number(addDue) >= 1 && Number(addDue) <= 31) && (
              <div style={{ fontSize: 11, color: color.alertText, marginTop: 6 }}>
                O dia de vencimento tem que ser entre 1 e 31.
              </div>
            )}
          </Field>
        </>
      )}

      {addType === 'renda' && (
        <>
          <Field label="Pessoa">
            <div style={{ display: 'flex', gap: 8 }}>
              {['Rui', 'Ana'].map((p) => (
                <Chip key={p} active={addPerson === p} onClick={() => setAddPerson(p)}>
                  {names[p]}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Tipo">
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip active={rendaKind === 'fixa'} onClick={() => setRendaKind('fixa')}>Renda fixa</Chip>
              <Chip active={rendaKind === 'extra'} onClick={() => setRendaKind('extra')}>Entrada extra</Chip>
            </div>
          </Field>
        </>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          margin: '8px 0 20px',
        }}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((d) => (
          <button
            key={d}
            onClick={() => pressDigit(d)}
            style={{
              height: 48,
              borderRadius: radius.row,
              background: color.surface,
              border: 'none',
              color: color.text,
              fontSize: 17,
              cursor: 'pointer',
            }}
          >
            {d}
          </button>
        ))}
        <button
          onClick={pressBackspace}
          style={{
            height: 48,
            borderRadius: radius.row,
            background: color.surface,
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Backspace size={18} color={color.textMedium} />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave()}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: radius.row,
          border: `1px solid ${canSave() ? color.accent : 'transparent'}`,
          background: canSave() ? color.accentSoft : 'transparent',
          color: canSave() ? color.accentLight : 'rgba(233,233,237,.35)',
          fontSize: 15,
          fontWeight: 500,
          cursor: canSave() ? 'pointer' : 'default',
        }}
      >
        {SAVE_LABEL[addType]}
      </button>

      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '12px 0',
          marginTop: 10,
          background: 'transparent',
          border: 'none',
          color: color.textMedium,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Cancelar
      </button>
    </div>
  );
}
