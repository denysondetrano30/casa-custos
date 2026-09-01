// Trava simples do app: guarda só um "hash" (uma versão embaralhada, que não
// dá pra transformar de volta na senha) de cada senha, nunca a senha em
// texto puro. Isso não é proteção contra banco/hacker — é só pra alguém que
// pegar o celular na mão não conseguir ver os números da casa sem saber a
// senha combinada entre vocês.
export async function hashPin(pin) {
  if (!pin) return null;
  const bytes = new TextEncoder().encode(String(pin));
  const buffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
