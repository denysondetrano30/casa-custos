import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Guarda e sincroniza os dados da casa (contas, categorias, renda, gastos
// pessoais, metas, tudo) num único documento no Firestore, compartilhado
// pelos dois. Funciona como o antigo useStoredState (localStorage), só que
// agora em vez de ficar só no navegador, fica na nuvem — por isso o que uma
// pessoa lançar aparece pro outro também, em qualquer aparelho.
export function useHouseData(houseId, initialValue) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!houseId) return;
    const ref = doc(db, 'houses', houseId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          // Mescla com o valor inicial, assim se no futuro eu adicionar um
          // campo novo ao app, quem já tem casa criada não quebra.
          setData({ ...initialValue, ...snap.data() });
        } else {
          setDoc(ref, initialValue).then(() => setData(initialValue));
        }
      },
      (err) => console.error('Erro lendo dados da casa:', err)
    );
    return unsub;
  }, [houseId]);

  const update = useCallback(
    (updater) => {
      if (!houseId) return;
      setData((prev) => {
        const base = prev ?? initialValue;
        const next = typeof updater === 'function' ? updater(base) : updater;
        setDoc(doc(db, 'houses', houseId), next, { merge: true }).catch((err) =>
          console.error('Erro salvando dados da casa:', err)
        );
        return next;
      });
    },
    [houseId]
  );

  return [data, update];
}
