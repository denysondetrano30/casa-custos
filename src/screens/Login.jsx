import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { color, radius } from '../lib/tokens';

// Tela mostrada antes de entrar no app. Sem login, ninguém vê os dados.
export default function Login() {
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro('');
    setCarregando(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Depois de logar com sucesso, o App.jsx detecta sozinho e troca de tela.
    } catch (e) {
      console.error(e);
      setErro('Não deu para entrar. Tente de novo — se persistir, me avise com o print do erro.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: color.bg,
        color: color.text,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 500, marginBottom: 8 }}>Casa</div>
      <div style={{ fontSize: 13.5, color: color.textMedium, marginBottom: 32, maxWidth: 280 }}>
        Entre com sua conta Google para ver e guardar os dados de vocês dois no mesmo lugar.
      </div>
      <button
        onClick={entrar}
        disabled={carregando}
        style={{
          padding: '13px 28px',
          borderRadius: radius.row,
          border: 'none',
          background: color.accent,
          color: '#fff',
          fontSize: 14.5,
          fontWeight: 500,
          cursor: carregando ? 'default' : 'pointer',
          opacity: carregando ? 0.7 : 1,
        }}
      >
        {carregando ? 'Entrando…' : 'Entrar com Google'}
      </button>
      {erro && (
        <div style={{ marginTop: 16, fontSize: 12.5, color: color.alertText, maxWidth: 280 }}>{erro}</div>
      )}
    </div>
  );
}
