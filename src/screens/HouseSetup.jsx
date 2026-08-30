import { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { color, radius } from '../lib/tokens';
import { initialState } from '../lib/initialState';
import { signOut } from 'firebase/auth';

// Gera um código curto e fácil de digitar/ditar por telefone, tipo "K7QX2P".
function gerarCodigo() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem letras/números confusos (0/O, 1/I)
  let codigo = '';
  for (let i = 0; i < 6; i++) codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return codigo;
}

// Tela mostrada depois do login, quando a conta ainda não está ligada a
// nenhuma "casa" (o documento compartilhado no Firestore). Aqui a pessoa
// cria uma casa nova (e recebe um código para passar pro parceiro/parceira)
// ou entra numa casa já existente com o código de convite.
export default function HouseSetup({ onHouseReady }) {
  const [modo, setModo] = useState(null); // null | 'criar' | 'entrar'
  const [codigoGerado, setCodigoGerado] = useState('');
  const [codigoDigitado, setCodigoDigitado] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function criarCasa() {
    setCarregando(true);
    setErro('');
    try {
      const codigo = gerarCodigo();
      await setDoc(doc(db, 'houses', codigo), initialState);
      // Importante: só ligamos a conta a essa casa quando a pessoa clicar em
      // "Continuar", depois de ver e guardar o código. Se ligássemos aqui,
      // o app trocaria de tela sozinho antes de dar tempo de ler o código.
      setCodigoGerado(codigo);
      setModo('criada');
    } catch (e) {
      console.error(e);
      setErro('Não deu para criar a casa agora. Tente de novo.');
    } finally {
      setCarregando(false);
    }
  }

  async function entrarNaCasa() {
    const codigo = codigoDigitado.trim().toUpperCase();
    if (!codigo) return;
    setCarregando(true);
    setErro('');
    try {
      const casaRef = doc(db, 'houses', codigo);
      const snap = await getDoc(casaRef);
      if (!snap.exists()) {
        setErro('Não encontrei nenhuma casa com esse código. Confira se digitou certo.');
        return;
      }
      await setDoc(doc(db, 'users', auth.currentUser.uid), { houseId: codigo }, { merge: true });
      onHouseReady(codigo);
    } catch (e) {
      console.error(e);
      setErro('Não deu para entrar agora. Tente de novo.');
    } finally {
      setCarregando(false);
    }
  }

  const boxStyle = {
    width: '100%',
    maxWidth: 320,
    padding: '12px 14px',
    borderRadius: radius.row,
    border: `1px solid ${color.border}`,
    background: color.surface,
    color: color.text,
    fontSize: 16,
    marginBottom: 12,
  };

  const botaoStyle = {
    width: '100%',
    maxWidth: 320,
    padding: '13px 0',
    borderRadius: radius.row,
    border: 'none',
    background: color.accent,
    color: '#fff',
    fontSize: 14.5,
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: 12,
  };

  const linkStyle = {
    background: 'transparent',
    border: 'none',
    color: color.textMedium,
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
  };

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
      <div style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>Falta um passo</div>

      {modo === 'criada' ? (
        <>
          <div style={{ fontSize: 13.5, color: color.textMedium, marginBottom: 20, maxWidth: 300 }}>
            Casa criada! Passe esse código para o outro entrar também — pode ser por WhatsApp mesmo.
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: '.1em',
              padding: '16px 24px',
              borderRadius: radius.card,
              background: color.surfaceElevated,
              marginBottom: 24,
            }}
          >
            {codigoGerado}
          </div>
          <button
            style={botaoStyle}
            onClick={async () => {
              await setDoc(doc(db, 'users', auth.currentUser.uid), { houseId: codigoGerado }, { merge: true });
              onHouseReady(codigoGerado);
            }}
          >
            Continuar para o app
          </button>
        </>
      ) : modo === 'entrar' ? (
        <>
          <div style={{ fontSize: 13.5, color: color.textMedium, marginBottom: 20, maxWidth: 300 }}>
            Digite o código de 6 letras/números que a outra pessoa te passou.
          </div>
          <input
            style={{ ...boxStyle, textAlign: 'center', letterSpacing: '.15em', fontSize: 20, textTransform: 'uppercase' }}
            value={codigoDigitado}
            onChange={(e) => setCodigoDigitado(e.target.value)}
            maxLength={6}
            placeholder="K7QX2P"
          />
          <button style={botaoStyle} onClick={entrarNaCasa} disabled={carregando}>
            {carregando ? 'Entrando…' : 'Entrar na casa'}
          </button>
          <button style={linkStyle} onClick={() => setModo(null)}>
            Voltar
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: color.textMedium, marginBottom: 24, maxWidth: 300 }}>
            É a primeira vez que alguém do casal entra? Crie uma casa nova. Se a outra pessoa já criou, use o código
            que ela te passou.
          </div>
          <button style={botaoStyle} onClick={criarCasa} disabled={carregando}>
            {carregando ? 'Criando…' : 'Criar uma casa nova'}
          </button>
          <button style={{ ...botaoStyle, background: 'transparent', border: `1px solid ${color.border}` }} onClick={() => setModo('entrar')}>
            Já tenho um código
          </button>
        </>
      )}

      {erro && <div style={{ marginTop: 16, fontSize: 12.5, color: color.alertText, maxWidth: 300 }}>{erro}</div>}

      <button style={{ ...linkStyle, marginTop: 32 }} onClick={() => signOut(auth)}>
        Sair da conta
      </button>
    </div>
  );
}
