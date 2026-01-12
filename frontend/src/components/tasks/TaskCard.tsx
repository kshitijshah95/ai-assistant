import { Task, TaskPriority, useTasksStore } from '@/stores/tasks.store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, Flag, MoreVertical } from 'lucide-react';

const priorityColors: Record<TaskPriority, string> = {
  low: 'text-slate-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Circle className="w-5 h-5" />,
  in_progress: <Clock className="w-5 h-5 text-blue-500" />,
  completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
};

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
}

export function TaskCard({ task, isSelected, onClick }: TaskCardProps) {
  const { completeTask } = useTasksStore();

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
        task.status === 'completed' && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleComplete}
          className={cn(
            'mt-0.5 transition-colors',
            task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'
          )}
        >
          {statusIcons[task.status] || statusIcons.pending}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-medium', task.status === 'completed' && 'line-through')}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={cn('flex items-center gap-1 text-xs', priorityColors[task.priority])}>
              <Flag className="w-3 h-3" />
              {task.priority}
            </span>
            {task.dueDate && (
              <span className={cn('text-xs', isOverdue ? 'text-red-500' : 'text-muted-foreground')}>
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.goal && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                {task.goal.title}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
