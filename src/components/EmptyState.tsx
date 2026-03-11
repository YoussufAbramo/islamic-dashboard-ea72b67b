import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon = Inbox, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 space-y-4">
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <div className="text-center space-y-1">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
    </div>
    {actionLabel && onAction && (
      <Button onClick={onAction}>
        <Plus className="h-4 w-4 me-2" />
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
