import { useEffect, useState } from 'react';
import { useTasksStore, TaskStatus } from '@/stores/tasks.store';
import { TaskCard } from './TaskCard';
import { TaskEditor } from './TaskEditor';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus, CheckSquare, Clock, AlertCircle, CheckCircle2, ListTodo } from 'lucide-react';

const statusFilters: { id: TaskStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <ListTodo className="w-4 h-4" /> },
  { id: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
  { id: 'in_progress', label: 'In Progress', icon: <AlertCircle className="w-4 h-4" /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export function TasksView() {
  const {
    tasks,
    stats,
    filterStatus,
    isLoading,
    selectedTask,
    loadTasks,
    loadStats,
    setFilterStatus,
    setSelectedTask,
  } = useTasksStore();

  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTasks();
    loadStats();
  }, [loadTasks, loadStats]);

  return (
    <div className="flex h-full">
      {/* Sidebar - Filters */}
      <div className="w-56 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Tasks
          </h2>
        </div>

        {/* Stats */}
        {stats && (
          <div className="p-4 border-b space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium text-green-500">{stats.completed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overdue</span>
              <span className={cn('font-medium', stats.overdue > 0 && 'text-red-500')}>
                {stats.overdue}
              </span>
            </div>
            {stats.total > 0 && (
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {statusFilters.map((filter) => (
              <Button
                key={filter.id}
                variant={filterStatus === filter.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus(filter.id)}
                className="w-full justify-start"
              >
                {filter.icon}
                <span className="ml-2">{filter.label}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Tasks List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Actions */}
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium capitalize">
            {filterStatus === 'all' ? 'All Tasks' : `${filterStatus.replace('_', ' ')} Tasks`}
          </h3>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Tasks Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first task or use the chat to add reminders.
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTask?.id === task.id}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Task Editor Panel */}
      {(selectedTask || isCreating) && (
        <div className="w-[400px] border-l flex flex-col">
          <TaskEditor
            task={isCreating ? null : selectedTask}
            isNew={isCreating}
            onClose={() => {
              setSelectedTask(null);
              setIsCreating(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
