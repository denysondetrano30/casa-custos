import { useState } from 'react';
import { Lock as LockIcon } from '@phosphor-icons/react';
import { color } from '../lib/tokens';
import { hashPin } from '../lib/security';

const TAMANHO_PIN = 6; // aceita de 4 a 6 dígitos; a bolinha 5ª/6ª só acende se digitado

function numStyle() {
  return {
    width: 64,
    height: 64,
    borderRadius: 99,
    border: `1px solid ${color.border}`,
    background: color.surface,
    color: color.text,
    fontSize: 21,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  };
}

// Tela de bloqueio: pede a senha (PIN) antes de mostrar qualquer informação
// financeira do casal. Verifica o PIN digitado contra o "hash" salvo de
// Rui e/ou Ana — quem souber a própria senha desbloqueia o app inteiro,
// já que os dados são compartilhados entre os dois.
export default function Lock({ pins, onUnlock }) {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState(false);
  const [verificando, setVerificando] = useState(false);

  async function conferir(novoPin) {
    setVerificando(true);
    const hash = await hashPin(novoPin);
    const ok = (pins?.Rui && hash === pins.Rui) || (pins?.Ana && hash === pins.Ana);
    if (ok) {
      onUnlock();
      return;
    }
    setErro(true);
    setVerificando(false);
    setTimeout(() => {
      setPin('');
      setErro(false);
    }, 450);
  }

  function digitar(d) {
    if (verificando || pin.length >= 6) return;
    const novoPin = pin + d;
    setPin(novoPin);
    setErro(false);
    if (novoPin.length >= 4) conferir(novoPin);
  }

  function apagar() {
    if (verificando) return;
    setErro(false);
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: color.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: color.surfaceElevated,
          display: 'grid',
          placeItems: 'center',
          marginBottom: 18,
        }}
      >
        <LockIcon size={26} color={color.accentIcon} />
      </div>
      <div style={{ fontSize: 15, color: color.text, marginBottom: 6 }}>Digite a senha do app</div>
      <div style={{ fontSize: 12, color: erro ? color.alertText : color.textWeak, marginBottom: 22, height: 16 }}>
        {erro ? 'Senha incorreta, tente de novo' : ' '}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 30 }}>
        {Array.from({ length: TAMANHO_PIN }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 99,
              border: `1px solid ${color.border}`,
              background: i < pin.length ? (erro ? color.alertText : color.accent) : 'transparent',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 14 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button key={n} onClick={() => digitar(n)} style={numStyle()}>
            {n}
          </button>
        ))}
        <div />
        <button onClick={() => digitar('0')} style={numStyle()}>
          0
        </button>
        <button onClick={apagar} style={{ ...numStyle(), border: 'none', background: 'transparent', fontSize: 15, color: color.textMedium }}>
          apagar
        </button>
      </div>

      <div style={{ fontSize: 11, color: color.textWeak, marginTop: 30, maxWidth: 260, textAlign: 'center', lineHeight: 1.5 }}>
        A senha é combinada entre vocês dois e pode ser trocada no Perfil.
      </div>
    </div>
  );
}
