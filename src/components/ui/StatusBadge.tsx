import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'Disponível' | 'Em uso' | 'Manutenção';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        status === 'Disponível' && "status-available",
        status === 'Em uso' && "status-in-use",
        status === 'Manutenção' && "status-maintenance"
      )}
    >
      {status}
    </span>
  );
}
