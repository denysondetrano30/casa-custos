import { useState, useMemo, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import TabBar from './components/TabBar';
import FloatingAddButton from './components/FloatingAddButton';
import Home from './screens/Home';
import Add from './screens/Add';
import Profile from './screens/Profile';
import Bills from './screens/Bills';
import Split from './screens/Split';
import Goals from './screens/Goals';
import Shop from './screens/Shop';
import Login from './screens/Login';
import HouseSetup from './screens/HouseSetup';
import { color } from './lib/tokens';
import { auth, db } from './lib/firebase';
import { useHouseData } from './hooks/useHouseData';
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

  // Controle de login: enquanto o Firebase ainda não respondeu se tem
  // alguém logado, "carregandoAuth" fica true e mostramos uma tela vazia
  // rapidinha, para não piscar a tela de login à toa.
  const [user, setUser] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCarregandoAuth(false);
    });
    return unsubscribe;
  }, []);

  // Depois de logado, descobrimos a qual "casa" (documento compartilhado no
  // Firestore) essa conta pertence. Se ainda não pertence a nenhuma, a tela
  // HouseSetup cuida de criar uma nova ou entrar com um código de convite.
  const [houseId, setHouseId] = useState(undefined); // undefined = ainda não sabemos, null = sabemos que não tem
  useEffect(() => {
    if (!user) {
      setHouseId(undefined);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setHouseId(snap.exists() && snap.data().houseId ? snap.data().houseId : null);
    });
    return unsubscribe;
  }, [user]);

  const [state, setState] = useHouseData(houseId, initialState);

  const commitments = useMemo(() => (state ? buildCommitments(state) : []), [state]);
  const totalCommitments = commitments.reduce((s, c) => s + c.value, 0);

  // Recalcula quem paga o quê sempre que contas ou renda mudam.
  const splitResult = useMemo(() => {
    if (!state) return { Rui: [], Ana: [] };
    return splitBills(commitments, state.splitPct.Rui, ['Rui', 'Ana']);
  }, [commitments, state]);

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

  if (carregandoAuth) {
    return <div style={{ minHeight: '100vh', background: color.bg }} />;
  }
  if (!user) {
    return <Login />;
  }
  if (houseId === undefined || (houseId && !state)) {
    // Ainda buscando a casa, ou já sabemos a casa mas os dados ainda não chegaram do Firestore.
    return <div style={{ minHeight: '100vh', background: color.bg }} />;
  }
  if (houseId === null) {
    return <HouseSetup onHouseReady={setHouseId} />;
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
        houseId={houseId}
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
