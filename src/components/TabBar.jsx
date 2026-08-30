import {
  House,
  Basket,
  Receipt,
  Scales,
  Target,
  User,
} from '@phosphor-icons/react';
import { color } from '../lib/tokens';

const TABS = [
  { id: 'home', label: 'Início', Icon: House },
  { id: 'shop', label: 'Feira', Icon: Basket },
  { id: 'bills', label: 'Contas', Icon: Receipt },
  { id: 'split', label: 'Divisão', Icon: Scales },
  { id: 'goals', label: 'Metas', Icon: Target },
  { id: 'profile', label: 'Perfil', Icon: User },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        background: color.bg,
        borderTop: `1px solid ${color.borderSubtle}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 10,
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 0 8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon
              size={21}
              weight={isActive ? 'fill' : 'regular'}
              color={isActive ? color.accentLight : 'rgba(233,233,237,.42)'}
            />
            <span
              style={{
                fontSize: 9.5,
                color: isActive ? color.accentLight : 'rgba(233,233,237,.42)',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
