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
import ImportExtrato from './screens/ImportExtrato';
import Lock from './screens/Lock';
import { color } from './lib/tokens';
import { auth, db } from './lib/firebase';
import { useHouseData } from './hooks/useHouseData';
import { initialState } from './lib/initialState';
import { buildCommitments } from './lib/commitments';
import { splitBills } from './lib/split';
import { buildSnapshot, resetForNextMonth } from './lib/monthClose';
import { hashPin } from './lib/security';

const CHAVE_DESBLOQUEADO = 'casa:desbloqueado';

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
  const [importing, setImporting] = useState(false);
  const [profilePerson, setProfilePerson] = useState('Rui');

  // Trava do app: se alguém já cadastrou uma senha, o app pede ela toda vez
  // que for aberto de novo. "Aberto de novo" = sessionStorage, que some
  // quando a aba/app é fechado de verdade (diferente de só trocar de tela).
  const [desbloqueado, setDesbloqueado] = useState(() => {
    try {
      return sessionStorage.getItem(CHAVE_DESBLOQUEADO) === '1';
    } catch {
      return false;
    }
  });

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
  const names = state?.names || { Rui: 'Rui', Ana: 'Ana' };

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
    const { addType, value, cat, payer, desc, addPerson, pcat, addRecurring, addName, addDue, contaCat, rendaKind } = payload;

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
              catId: cat,
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
            { id: Date.now(), name: addName, due: Number(addDue), value, paid: false, category: contaCat || null },
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

  function editPersonalItem(pessoa, bucket, id, dados) {
    setState((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [pessoa]: {
          ...prev.personal[pessoa],
          [bucket]: prev.personal[pessoa][bucket].map((item) => (item.id === id ? { ...item, ...dados } : item)),
        },
      },
    }));
  }

  function deletePersonalItem(pessoa, bucket, id) {
    setState((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [pessoa]: {
          ...prev.personal[pessoa],
          [bucket]: prev.personal[pessoa][bucket].filter((item) => item.id !== id),
        },
      },
    }));
  }

  function togglePaid(id) {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)),
    }));
  }

  function editBill(id, dados) {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => (b.id === id ? { ...b, ...dados } : b)),
    }));
  }

  function deleteBill(id) {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== id),
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
    'credito-rui': `Crédito · Cartão ${names.Rui}`,
    'credito-ana': `Crédito · Cartão ${names.Ana}`,
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
          catId: 'mercado',
          meta: `${payer} · hoje · ${METODO_LABEL[prev.shop.method]}`,
          value: credito,
        });
        if (debito > 0) {
          novasTxs.push({
            id: purchaseId + 1,
            desc: 'Mercado',
            icon: 'ph-basket',
            catId: 'mercado',
            meta: 'hoje · Débito (parte da compra)',
            value: debito,
          });
        }
      } else {
        novasTxs.push({
          id: purchaseId,
          desc: 'Mercado',
          icon: 'ph-basket',
          catId: 'mercado',
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

  // Apaga uma compra registrada na Feira. Isso desfaz tudo que aquela
  // compra tinha gerado: o(s) lançamento(s) em txs (que ela criou com o
  // mesmo id, e id+1 quando foi pagamento misto crédito+débito) e o valor
  // somado em Mercado — senão a compra some da lista mas o gasto continua
  // contando, ou o lançamento é apagado só pela metade.
  function deletePurchase(id) {
    setState((prev) => {
      const purchase = prev.purchases.find((p) => p.id === id);
      if (!purchase) return prev;
      const idsTxsDaCompra = new Set([id, id + 1]);
      return {
        ...prev,
        cats: prev.cats.map((c) => (c.id === 'mercado' ? { ...c, spent: Math.max(0, c.spent - purchase.total) } : c)),
        txs: prev.txs.filter((t) => !idsTxsDaCompra.has(t.id)),
        purchases: prev.purchases.filter((p) => p.id !== id),
      };
    });
  }

  // Apaga um lançamento da tela Início e também tira o valor da categoria
  // (senão o "Onde foi" continuaria contando um gasto que não existe mais).
  // Lançamentos mais antigos não guardam o id da categoria (catId) — pra
  // esses, a gente descobre a categoria pelo ícone, que sempre bateu certo.
  function deleteTx(id) {
    setState((prev) => {
      const tx = prev.txs.find((t) => t.id === id);
      if (!tx) return prev;
      const catId = tx.catId || prev.cats.find((c) => c.icon === tx.icon)?.id;
      return {
        ...prev,
        cats: catId ? prev.cats.map((c) => (c.id === catId ? { ...c, spent: Math.max(0, c.spent - tx.value) } : c)) : prev.cats,
        txs: prev.txs.filter((t) => t.id !== id),
      };
    });
  }

  function deleteInstallment(id) {
    setState((prev) => ({
      ...prev,
      installments: prev.installments.filter((p) => p.id !== id),
    }));
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

  // Registra um aporte (dinheiro guardado de verdade) numa meta, somando ao
  // que já tinha sido guardado — é isso que faz a barra de progresso andar.
  function addAporteGoal(id, valor) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + valor) } : g)),
    }));
  }

  function editGoal(id, dados) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...dados } : g)),
    }));
  }

  function deleteGoal(id) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }

  // Define/troca a senha de uma pessoa. Guarda só o hash (ver lib/security.js).
  async function setPinPessoa(pessoa, pin) {
    const hash = await hashPin(pin);
    setState((prev) => ({ ...prev, pins: { ...(prev.pins || {}), [pessoa]: hash } }));
  }

  function removePinPessoa(pessoa) {
    setState((prev) => ({ ...prev, pins: { ...(prev.pins || {}), [pessoa]: null } }));
  }

  // Cadastro de cartões (nome + limite) — só informativo, ver lib/cardLimits.js.
  function addCard(nome, limite) {
    setState((prev) => ({
      ...prev,
      cards: [...(prev.cards || []), { id: `c${Date.now()}`, name: nome, limit: limite }],
    }));
  }

  function editCard(id, dados) {
    setState((prev) => ({
      ...prev,
      cards: (prev.cards || []).map((c) => (c.id === id ? { ...c, ...dados } : c)),
    }));
  }

  function deleteCard(id) {
    setState((prev) => ({
      ...prev,
      cards: (prev.cards || []).filter((c) => c.id !== id),
      // As compras/parcelas que estavam nesse cartão não são apagadas —
      // só voltam a ficar sem cartão identificado (fatura geral).
      sharedPurchases: (prev.sharedPurchases || []).map((p) => (p.cardId === id ? { ...p, cardId: null } : p)),
      installments: (prev.installments || []).map((i) => (i.cardId === id ? { ...i, cardId: null } : i)),
    }));
  }

  function updateName(pessoa, nome) {
    setState((prev) => ({ ...prev, names: { ...prev.names, [pessoa]: nome } }));
  }

  // Recebe a lista já classificada do extrato importado (ImportExtrato.jsx)
  // e lança cada item no lugar certo:
  // - gasto marcado como "Casa" é gasto conjunto: vira uma "compra
  //   conjunta" deste mês (sharedPurchases), que aparece em Contas → Este
  //   mês, entra na categoria correspondente na tela Início, e entra na
  //   divisão de quem paga o quê — igual uma conta fixa, mas sem virar
  //   recorrente.
  // - se a compra é parcelada, além da parcela deste mês, a gente também
  //   lança a parcela como "ativa" pra aparecer nos Meses futuros.
  // - gasto marcado como pessoal de alguém entra nos gastos pessoais
  //   variáveis dessa pessoa (não é dividido, é só dela).
  function importTransactions(items) {
    setState((prev) => {
      let installments = [...prev.installments];
      let personal = prev.personal;
      let sharedPurchases = [...(prev.sharedPurchases || [])];

      for (const it of items) {
        if (it.classificacao === 'ignorar') continue;

        if (it.classificacao === 'Rui' || it.classificacao === 'Ana') {
          personal = {
            ...personal,
            [it.classificacao]: {
              ...personal[it.classificacao],
              variable: [
                ...personal[it.classificacao].variable,
                { id: Date.now() + Math.random(), name: it.desc, value: it.value },
              ],
            },
          };
          continue;
        }

        // classificacao === 'casa'
        if (it.parcelaTotal && it.parcelaTotal > 1) {
          installments = [
            ...installments,
            {
              id: Date.now() + Math.random(),
              name: it.desc,
              per: it.value,
              count: it.parcelaTotal,
              done: Math.max(0, (it.parcelaAtual || 1) - 1),
              cardId: it.cardId || null,
            },
          ];
        }

        sharedPurchases = [
          ...sharedPurchases,
          {
            id: Date.now() + Math.random(),
            name: it.desc + (it.parcelaTotal ? ` · Parcela ${it.parcelaAtual}/${it.parcelaTotal}` : ''),
            value: it.value,
            category: it.category || null,
            cardId: it.cardId || null,
            paid: false,
          },
        ];
      }

      return { ...prev, installments, personal, sharedPurchases };
    });
  }

  // Corrige a categoria de uma compra conjunta depois de importada — útil
  // pra arrumar um "chute" errado da importação (ex. algo que caiu em
  // Mercado sem ser mercado de verdade).
  function editSharedPurchaseCategory(id, category) {
    setState((prev) => ({
      ...prev,
      sharedPurchases: (prev.sharedPurchases || []).map((p) => (p.id === id ? { ...p, category } : p)),
    }));
  }

  function deleteSharedPurchase(id) {
    setState((prev) => ({
      ...prev,
      sharedPurchases: (prev.sharedPurchases || []).filter((p) => p.id !== id),
    }));
  }

  // Marca uma compra conjunta (importada do extrato) como paga/quitada entre
  // vocês dois — é só um status de acompanhamento, não muda o valor que já
  // foi dividido no mês (igual o "paid" das contas fixas).
  function toggleSharedPurchasePaid(id) {
    setState((prev) => ({
      ...prev,
      sharedPurchases: (prev.sharedPurchases || []).map((p) => (p.id === id ? { ...p, paid: !p.paid } : p)),
    }));
  }

  // Marca de uma vez várias compras (todas as de uma fatura de cartão
  // agrupada) como pagas ou não — porque a fatura é paga numa cobrança só,
  // não compra por compra.
  function setSharedPurchasesPaidBulk(ids, paid) {
    setState((prev) => ({
      ...prev,
      sharedPurchases: (prev.sharedPurchases || []).map((p) => (ids.includes(p.id) ? { ...p, paid } : p)),
    }));
  }

  // Recebimentos PJ (declaração anual) — só um histórico manual, não entra
  // em nenhum cálculo de orçamento ou divisão do casal.
  function addRecebimentoPJ(pessoa, dados) {
    setState((prev) => ({
      ...prev,
      recebimentosPJ: {
        ...prev.recebimentosPJ,
        [pessoa]: [...(prev.recebimentosPJ?.[pessoa] || []), { id: Date.now() + Math.random(), ...dados }],
      },
    }));
  }

  function editRecebimentoPJ(pessoa, id, dados) {
    setState((prev) => ({
      ...prev,
      recebimentosPJ: {
        ...prev.recebimentosPJ,
        [pessoa]: (prev.recebimentosPJ?.[pessoa] || []).map((item) => (item.id === id ? { ...item, ...dados } : item)),
      },
    }));
  }

  function deleteRecebimentoPJ(pessoa, id) {
    setState((prev) => ({
      ...prev,
      recebimentosPJ: {
        ...prev.recebimentosPJ,
        [pessoa]: (prev.recebimentosPJ?.[pessoa] || []).filter((item) => item.id !== id),
      },
    }));
  }

  // Fecha o mês atual: guarda um resumo dele no histórico e zera o que é
  // "deste mês" (gastos, compras de cartão, gastos pessoais variáveis,
  // entradas extras), preparando o app pro mês seguinte. Contas fixas,
  // parcelas, metas e contas pessoais fixas continuam do jeito que estão.
  function fecharMes() {
    setState((prev) => {
      // Recalcula a divisão em cima do estado mais atual (não do `splitResult`
      // de fora, que pode já estar um passo desatualizado) só pra saber quem
      // ficou responsável por cada pendência que sobrou pro histórico.
      const commitmentsAtuais = buildCommitments(prev);
      const splitAtual = splitBills(commitmentsAtuais, prev.splitPct.Rui, ['Rui', 'Ana']);
      const snapshot = buildSnapshot(prev, splitAtual);
      return resetForNextMonth(prev, snapshot);
    });
  }

  function addPersonalCategory(nome) {
    setState((prev) => {
      const atuais = prev.personalCategories || [];
      if (atuais.includes(nome)) return prev;
      return { ...prev, personalCategories: [...atuais, nome] };
    });
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

  const temSenhaCadastrada = !!(state.pins && (state.pins.Rui || state.pins.Ana));
  if (temSenhaCadastrada && !desbloqueado) {
    return (
      <Lock
        pins={state.pins}
        onUnlock={() => {
          try {
            sessionStorage.setItem(CHAVE_DESBLOQUEADO, '1');
          } catch {
            /* sem sessionStorage disponível, segue sem lembrar */
          }
          setDesbloqueado(true);
        }}
      />
    );
  }

  const outraPessoa = { Rui: 'Ana', Ana: 'Rui' };
  const extrasTotal = (pessoa) => state.extras[pessoa].reduce((s, e) => s + e.v, 0);
  const rendaCasalTotal =
    state.income.Rui + state.income.Ana + extrasTotal('Rui') + extrasTotal('Ana');
  const sharedPurchasesTotal = (state.sharedPurchases || []).reduce((s, p) => s + p.value, 0);
  const billsTotal = state.bills.reduce((s, b) => s + b.value, 0) + sharedPurchasesTotal;
  const rendaCasal = state.income.Rui + state.income.Ana; // só renda fixa, usada nas faturas futuras

  const SCREENS = {
    home: () => (
      <Home
        month={state.month}
        cats={state.cats}
        bills={state.bills}
        sharedPurchases={state.sharedPurchases}
        txs={state.txs}
        onEditCategoryBudget={editCategoryBudget}
        rendaCasal={rendaCasalTotal}
        billsTotal={billsTotal}
        onImport={() => setImporting(true)}
        onDeleteTx={deleteTx}
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
        onDeletePurchase={deletePurchase}
        names={names}
      />
    ),
    bills: () => (
      <Bills
        state={state}
        onEditBill={editBill}
        onDeleteBill={deleteBill}
        onDeleteSharedPurchase={deleteSharedPurchase}
        onEditSharedPurchaseCategory={editSharedPurchaseCategory}
        onToggleSharedPurchasePaid={toggleSharedPurchasePaid}
        onLancarInstallment={lancarInstallment}
        onDeleteInstallment={deleteInstallment}
        onFecharMes={fecharMes}
        rendaCasal={rendaCasal}
        rendaFixaCasal={rendaCasal}
        splitResult={splitResult}
        names={names}
        onAddCard={addCard}
        onEditCard={editCard}
        onDeleteCard={deleteCard}
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
        names={names}
      />
    ),
    goals: () => (
      <Goals
        goals={state.goals}
        baseMonthLabel={state.month.label}
        onAddGoal={addGoal}
        onAporteGoal={addAporteGoal}
        onEditGoal={editGoal}
        onDeleteGoal={deleteGoal}
      />
    ),
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
        names={names}
        onUpdateName={updateName}
        onEditPersonalItem={editPersonalItem}
        onDeletePersonalItem={deletePersonalItem}
        recebimentosPJ={state.recebimentosPJ}
        onAddRecebimentoPJ={addRecebimentoPJ}
        onEditRecebimentoPJ={editRecebimentoPJ}
        onDeleteRecebimentoPJ={deleteRecebimentoPJ}
        pins={state.pins}
        onSetPin={setPinPessoa}
        onRemovePin={removePinPessoa}
        bills={state.bills}
        sharedPurchases={state.sharedPurchases}
        onTogglePaid={togglePaid}
        onToggleSharedPurchasePaid={toggleSharedPurchasePaid}
        onSetGroupPaid={setSharedPurchasesPaidBulk}
      />
    ),
  };
  const Screen = SCREENS[screen];

  return (
    <div style={{ minHeight: '100vh', background: color.bg }}>
      {adding ? (
        <Add
          onClose={() => setAdding(null)}
          onSave={handleSaveEntry}
          initialPerson={adding.person}
          names={names}
          personalCategories={state.personalCategories}
          onAddPersonalCategory={addPersonalCategory}
          cats={state.cats}
        />
      ) : importing ? (
        <ImportExtrato
          cats={state.cats}
          cards={state.cards || []}
          names={names}
          onClose={() => setImporting(false)}
          onConfirm={(items) => {
            importTransactions(items);
            setImporting(false);
          }}
        />
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
