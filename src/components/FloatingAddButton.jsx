import { Plus } from '@phosphor-icons/react';
import { color } from '../lib/tokens';

export default function FloatingAddButton({ onClick, hidden }) {
  if (hidden) return null;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 'calc(env(safe-area-inset-bottom) + 76px)',
        width: 56,
        height: 56,
        borderRadius: 99,
        background: color.bg,
        border: `1px solid ${color.accent}`,
        boxShadow: '0 10px 26px rgba(0,0,0,.55), 0 0 0 6px rgba(145,132,217,.08)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        zIndex: 10,
      }}
    >
      <Plus size={24} color={color.accentLight} weight="bold" />
    </button>
  );
}
