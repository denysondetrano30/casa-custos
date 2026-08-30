import { useEffect, useState } from 'react';

// Guarda um estado no localStorage do navegador, para não se perder
// quando a página é fechada ou recarregada.
//
// Uso: const [state, setState] = useStoredState('casa:v1', valorInicial)
// Funciona igual ao useState — só que também salva.
//
// Se o valor inicial for um objeto e o que estiver salvo não tiver todos
// os campos (porque o app ganhou campos novos depois que você já tinha
// dados salvos), completamos com o que faltar, sem apagar o resto.
export function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return initialValue;
      const parsed = JSON.parse(saved);
      if (
        typeof initialValue === 'object' &&
        initialValue !== null &&
        !Array.isArray(initialValue) &&
        typeof parsed === 'object' &&
        parsed !== null
      ) {
        return { ...initialValue, ...parsed };
      }
      return parsed;
    } catch (err) {
      console.warn(`Não consegui ler "${key}" do localStorage, usando o valor inicial.`, err);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Não consegui salvar "${key}" no localStorage.`, err);
    }
  }, [key, value]);

  return [value, setValue];
}
