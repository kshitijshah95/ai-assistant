import { useEffect, useState } from 'react';
import { useGoalsStore, GoalStatus } from '@/stores/goals.store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus, Target, Trophy, Archive, CheckCircle2, X, Save, Edit2, Trash2 } from 'lucide-react';

export function GoalsView() {
  const {
    goals,
    isLoading,
    selectedGoal,
    isEditing,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    setSelectedGoal,
    setIsEditing,
  } = useGoalsStore();

  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('active');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    loadGoals(filterStatus === 'all' ? undefined : filterStatus);
  }, [loadGoals, filterStatus]);

  useEffect(() => {
    if (selectedGoal && !isCreating) {
      setTitle(selectedGoal.title);
      setDescription(selectedGoal.description || '');
      setTargetDate(selectedGoal.targetDate?.split('T')[0] || '');
    }
  }, [selectedGoal, isCreating]);

  const handleSave = async () => {
    if (!title.trim()) return;

    if (isCreating) {
      await createGoal({ title, description, targetDate: targetDate || undefined });
      setIsCreating(false);
    } else if (selectedGoal) {
      await updateGoal(selectedGoal.id, { title, description, targetDate: targetDate || null });
      setIsEditing(false);
    }
    setTitle('');
    setDescription('');
    setTargetDate('');
  };

  const handleDelete = async () => {
    if (!selectedGoal || !confirm('Delete this goal?')) return;
    await deleteGoal(selectedGoal.id);
  };

  const statusFilters = [
    { id: 'active', label: 'Active', icon: <Target className="w-4 h-4" /> },
    { id: 'completed', label: 'Completed', icon: <Trophy className="w-4 h-4" /> },
    { id: 'archived', label: 'Archived', icon: <Archive className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-56 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Goals
          </h2>
        </div>
        <div className="p-2 space-y-1">
          {statusFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={filterStatus === filter.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(filter.id as GoalStatus)}
              className="w-full justify-start"
            >
              {filter.icon}
              <span className="ml-2">{filter.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Goals List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium capitalize">{filterStatus} Goals</h3>
          <Button onClick={() => { setIsCreating(true); setSelectedGoal(null); setTitle(''); setDescription(''); setTargetDate(''); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                <p className="text-muted-foreground mb-4">Set your first goal to get started!</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            ) : (
              goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => { setSelectedGoal(goal); setIsCreating(false); setIsEditing(false); }}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-all',
                    selectedGoal?.id === goal.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
                      )}
                    </div>
                    {goal.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{goal.tasks.length} tasks</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  {goal.targetDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Editor Panel */}
      {(selectedGoal || isCreating) && (
        <div className="w-[400px] border-l flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">{isCreating ? 'New Goal' : isEditing ? 'Edit Goal' : selectedGoal?.title}</h3>
            <div className="flex gap-2">
              {!isCreating && !isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {!isCreating && (
                <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => { setSelectedGoal(null); setIsCreating(false); }} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {(isCreating || isEditing) ? (
            <div className="flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
                  placeholder="Goal title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none resize-none"
                  rows={3}
                  placeholder="What do you want to achieve?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
                />
              </div>
              <Button onClick={handleSave} disabled={!title.trim()} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Goal
              </Button>
            </div>
          ) : selectedGoal && (
            <ScrollArea className="flex-1 p-4">
              {selectedGoal.description && (
                <p className="text-sm text-muted-foreground mb-4">{selectedGoal.description}</p>
              )}
              <h4 className="font-medium mb-2">Tasks ({selectedGoal.tasks.length})</h4>
              {selectedGoal.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks linked to this goal yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedGoal.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <CheckCircle2 className={cn('w-4 h-4', task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground')} />
                      <span className={cn('text-sm', task.status === 'completed' && 'line-through')}>{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
