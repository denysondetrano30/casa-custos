import { useState, useMemo } from 'react';
import TabBar from './components/TabBar';
import FloatingAddButton from './components/FloatingAddButton';
import Home from './screens/Home';
import Add from './screens/Add';
import Profile from './screens/Profile';
import Bills from './screens/Bills';
import Split from './screens/Split';
import Goals from './screens/Goals';
import Shop from './screens/Shop';
import { color } from './lib/tokens';
import { useStoredState } from './hooks/useStoredState';
import { initialState } from './lib/initialState';
import { buildCommitments } from './lib/commitments';
import { splitBills } from './lib/split';

// Telas que ainda não existem: por enquanto mostram um aviso simples,
// para não quebrar a navegação enquanto construímos uma de cada vez.
function EmComConstrucao({ nome }) {
  return (
    <div style={{ padding: '64px 20px 168px', color: color.textMedium }}>
      Tela "{nome}" ainda não construída.
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [adding, setAdding] = useState(null); // null = fechado, ou { person } quando aberto
  const [profilePerson, setProfilePerson] = useState('Rui');
  const [state, setState] = useStoredState('casa:v1', initialState);

  const commitments = useMemo(() => buildCommitments(state), [state.bills, state.cats]);
  const totalCommitments = commitments.reduce((s, c) => s + c.value, 0);

  // Recalcula quem paga o quê sempre que contas ou renda mudam.
  const splitResult = useMemo(() => {
    return splitBills(commitments, state.splitPct.Rui, ['Rui', 'Ana']);
  }, [commitments, state.splitPct]);

  function gastoRealDe(pessoa) {
    const casa = splitResult[pessoa].reduce((s, i) => s + i.part, 0);
    const fixas = state.personal[pessoa].fixed.reduce((s, i) => s + i.value, 0);
    const variaveis = state.personal[pessoa].variable.reduce((s, i) => s + i.value, 0);
    return casa + fixas + variaveis;
  }

  function handleSaveEntry(payload) {
    const { addType, value, cat, payer, desc, addPerson, pcat, addRecurring, addName, addDue, rendaKind } = payload;

    setState((prev) => {
      if (addType === 'casa') {
        return {
          ...prev,
          cats: prev.cats.map((c) => (c.id === cat ? { ...c, spent: c.spent + value } : c)),
          txs: [
            {
              id: Date.now(),
              desc: desc || prev.cats.find((c) => c.id === cat)?.name || 'Gasto',
              icon: prev.cats.find((c) => c.id === cat)?.icon,
              meta: `${payer} · hoje`,
              value,
            },
            ...prev.txs,
          ],
        };
      }

      if (addType === 'pessoal') {
        const bucket = addRecurring ? 'fixed' : 'variable';
        return {
          ...prev,
          personal: {
            ...prev.personal,
            [addPerson]: {
              ...prev.personal[addPerson],
              [bucket]: [
                ...prev.personal[addPerson][bucket],
                { id: Date.now(), name: desc || pcat, value },
              ],
            },
          },
        };
      }

      if (addType === 'conta') {
        return {
          ...prev,
          bills: [
            ...prev.bills,
            { id: Date.now(), name: addName, due: Number(addDue), value, paid: false },
          ],
        };
      }

      if (addType === 'renda') {
        if (rendaKind === 'fixa') {
          return { ...prev, income: { ...prev.income, [addPerson]: value } };
        }
        return {
          ...prev,
          extras: {
            ...prev.extras,
            [addPerson]: [...prev.extras[addPerson], { id: Date.now(), n: desc || 'Entrada extra', v: value }],
          },
        };
      }

      return prev;
    });

    setAdding(null);
  }

  function updateIncome(pessoa, valor) {
    setState((prev) => ({ ...prev, income: { ...prev.income, [pessoa]: valor } }));
  }

  function removeExtra(pessoa, id) {
    setState((prev) => ({
      ...prev,
      extras: { ...prev.extras, [pessoa]: prev.extras[pessoa].filter((e) => e.id !== id) },
    }));
  }

  function togglePaid(id) {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)),
    }));
  }

  function lancarInstallment(sim) {
    setState((prev) => ({
      ...prev,
      installments: [
        ...prev.installments,
        { id: Date.now(), name: sim.name, per: sim.per, count: sim.parcelas, done: 0 },
      ],
    }));
  }

  function updateSplitPct(pctRui) {
    setState((prev) => ({ ...prev, splitPct: { Rui: pctRui, Ana: 100 - pctRui } }));
  }

  function shopAddItem(item) {
    setState((prev) => ({ ...prev, shop: { ...prev.shop, items: [...prev.shop.items, item] } }));
  }

  function shopChangeQty(id, qty) {
    setState((prev) => ({
      ...prev,
      shop: {
        ...prev.shop,
        items: qty <= 0 ? prev.shop.items.filter((i) => i.id !== id) : prev.shop.items.map((i) => (i.id === id ? { ...i, qty } : i)),
      },
    }));
  }

  function shopChangeMethod(method) {
    setState((prev) => ({ ...prev, shop: { ...prev.shop, method, debitPart: 0 } }));
  }

  function shopChangeDebitPart(debitPart) {
    setState((prev) => ({ ...prev, shop: { ...prev.shop, debitPart } }));
  }

  const METODO_LABEL = {
    'credito-rui': 'Crédito · Cartão Rui',
    'credito-ana': 'Crédito · Cartão Ana',
    debito: 'Débito',
    pix: 'Pix',
  };
  const METODO_PAYER = { 'credito-rui': 'Rui', 'credito-ana': 'Ana', debito: null, pix: null };

  function shopFinalizar() {
    setState((prev) => {
      const total = prev.shop.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      if (total <= 0 || prev.shop.items.length === 0) return prev;

      const isCredito = prev.shop.method.startsWith('credito');
      const debito = isCredito ? Math.min(prev.shop.debitPart, total) : prev.shop.method === 'debito' ? total : 0;
      const credito = isCredito ? total - debito : 0;
      const pix = prev.shop.method === 'pix' ? total : 0;

      const purchaseId = Date.now();
      const payer = METODO_PAYER[prev.shop.method];
      const novasTxs = [];

      if (isCredito) {
        novasTxs.push({
          id: purchaseId,
          desc: 'Mercado',
          icon: 'ph-basket',
          meta: `${payer} · hoje · ${METODO_LABEL[prev.shop.method]}`,
          value: credito,
        });
        if (debito > 0) {
          novasTxs.push({
            id: purchaseId + 1,
            desc: 'Mercado',
            icon: 'ph-basket',
            meta: 'hoje · Débito (parte da compra)',
            value: debito,
          });
        }
      } else {
        novasTxs.push({
          id: purchaseId,
          desc: 'Mercado',
          icon: 'ph-basket',
          meta: `hoje · ${METODO_LABEL[prev.shop.method]}`,
          value: total,
        });
      }

      const purchase = {
        id: purchaseId,
        date: 'hoje',
        items: prev.shop.items,
        total,
        credit: credito,
        debit: debito || pix,
        method: METODO_LABEL[prev.shop.method],
      };

      return {
        ...prev,
        cats: prev.cats.map((c) => (c.id === 'mercado' ? { ...c, spent: c.spent + total } : c)),
        txs: [...novasTxs, ...prev.txs],
        purchases: [purchase, ...prev.purchases],
        shop: { items: [], method: prev.shop.method, debitPart: 0 },
      };
    });
  }

  function editCategoryBudget(id, budget) {
    setState((prev) => ({
      ...prev,
      cats: prev.cats.map((c) => (c.id === id ? { ...c, budget } : c)),
    }));
  }

  function addGoal(goal) {
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, { id: Date.now(), name: goal.name, target: goal.target, saved: 0, monthly: goal.monthly }],
    }));
  }

  const outraPessoa = { Rui: 'Ana', Ana: 'Rui' };
  const extrasTotal = (pessoa) => state.extras[pessoa].reduce((s, e) => s + e.v, 0);
  const rendaCasalTotal =
    state.income.Rui + state.income.Ana + extrasTotal('Rui') + extrasTotal('Ana');
  const billsTotal = state.bills.reduce((s, b) => s + b.value, 0);
  const rendaCasal = state.income.Rui + state.income.Ana; // só renda fixa, usada nas faturas futuras

  const SCREENS = {
    home: () => (
      <Home
        month={state.month}
        cats={state.cats}
        txs={state.txs}
        onEditCategoryBudget={editCategoryBudget}
        rendaCasal={rendaCasalTotal}
        billsTotal={billsTotal}
      />
    ),
    shop: () => (
      <Shop
        shop={state.shop}
        mercado={state.cats.find((c) => c.id === 'mercado')}
        onAddItem={shopAddItem}
        onChangeQty={shopChangeQty}
        onChangeMethod={shopChangeMethod}
        onChangeDebitPart={shopChangeDebitPart}
        onFinalizar={shopFinalizar}
        purchases={state.purchases}
      />
    ),
    bills: () => (
      <Bills
        state={state}
        onTogglePaid={togglePaid}
        onLancarInstallment={lancarInstallment}
        rendaCasal={rendaCasal}
        rendaFixaCasal={rendaCasal}
      />
    ),
    split: () => (
      <Split
        income={state.income}
        onUpdateIncome={updateIncome}
        pctRui={state.splitPct.Rui}
        onChangePctRui={updateSplitPct}
        splitResult={splitResult}
        totalCommitments={totalCommitments}
      />
    ),
    goals: () => <Goals goals={state.goals} baseMonthLabel={state.month.label} onAddGoal={addGoal} />,
    profile: () => (
      <Profile
        person={profilePerson}
        onChangePerson={setProfilePerson}
        income={state.income}
        extras={state.extras}
        personal={state.personal}
        contasCasa={splitResult[profilePerson]}
        outraPessoa={outraPessoa[profilePerson]}
        outroGastoReal={gastoRealDe(outraPessoa[profilePerson])}
        onUpdateIncome={updateIncome}
        onRemoveExtra={removeExtra}
        onRegistrarExtra={(pessoa) => setAdding({ person: pessoa })}
      />
    ),
  };
  const Screen = SCREENS[screen];

  return (
    <div style={{ minHeight: '100vh', background: color.bg }}>
      {adding ? (
        <Add onClose={() => setAdding(null)} onSave={handleSaveEntry} initialPerson={adding.person} />
      ) : (
        <>
          <Screen />
          <FloatingAddButton hidden={screen === 'shop'} onClick={() => setAdding({ person: profilePerson })} />
          <TabBar active={screen} onChange={setScreen} />
        </>
      )}
    </div>
  );
}
