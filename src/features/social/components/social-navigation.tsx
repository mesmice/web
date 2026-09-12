import { UserPlus } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';

export type SocialTab = 'all' | 'active' | 'requests';

interface SocialNavigationProps {
  activeTab: SocialTab;
  onChange: (tab: SocialTab) => void;
  onAddFriend?: () => void;
}

const tabs: Array<{ id: SocialTab; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Ativos' },
  { id: 'requests', label: 'Solicitações' }
];

export function SocialNavigation({ activeTab, onChange, onAddFriend }: SocialNavigationProps) {
  return (
    <nav
      aria-label="Navegação social"
      className="flex min-h-14 flex-wrap items-center gap-1 border-b border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] px-2 py-2"
    >
      <div className="flex flex-wrap items-center gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            onClick={() => onChange(tab.id)}
            className="min-w-[110px] justify-center rounded-[var(--radius-md)] px-3"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Button
        variant="primary"
        onClick={onAddFriend}
        className="ml-auto rounded-[var(--radius-md)] px-3"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Adicionar amigo</span>
      </Button>
    </nav>
  );
}

export default SocialNavigation;
