import { useEffect, useState } from 'react';
import { useHabitsStore } from '@/stores/habits.store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus, Repeat, Flame, CheckCircle2, Circle, X, Save, Trash2 } from 'lucide-react';

export function HabitsView() {
  const {
    habits,
    isLoading,
    loadHabits,
    createHabit,
    logHabit,
    deleteHabit,
  } = useHabitsStore();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createHabit({ name, frequency });
    setName('');
    setIsCreating(false);
  };

  const handleLog = async (habitId: string) => {
    await logHabit(habitId);
  };

  const handleDelete = async (habitId: string) => {
    if (!confirm('Delete this habit?')) return;
    await deleteHabit(habitId);
  };

  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-56 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Habits
          </h2>
        </div>

        {/* Today's Progress */}
        {totalHabits > 0 && (
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium mb-2">Today's Progress</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">{completedToday}</span>
              <span className="text-muted-foreground">/ {totalHabits}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(completedToday / totalHabits) * 100}%` }}
              />
            </div>
            {completedToday === totalHabits && totalHabits > 0 && (
              <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <Flame className="w-4 h-4" />
                All done for today!
              </p>
            )}
          </div>
        )}

        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="w-full justify-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Habit
          </Button>
        </div>
      </div>

      {/* Habits List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b">
          <h3 className="font-medium">Your Habits</h3>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-12">
                <Repeat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No habits yet</h3>
                <p className="text-muted-foreground mb-4">Start building positive habits today!</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Habit
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      habit.completedToday ? 'border-green-500 bg-green-500/5' : 'border-border'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => !habit.completedToday && handleLog(habit.id)}
                          disabled={habit.completedToday}
                          className={cn(
                            'transition-colors',
                            habit.completedToday ? 'text-green-500' : 'text-muted-foreground hover:text-primary'
                          )}
                        >
                          {habit.completedToday ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </button>
                        <div>
                          <h4 className="font-medium">{habit.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{habit.frequency}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(habit.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Flame className={cn('w-4 h-4', habit.streak > 0 ? 'text-orange-500' : 'text-muted-foreground')} />
                      <span className="text-sm font-medium">{habit.streak} day streak</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="w-[400px] border-l flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">New Habit</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Habit Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
                placeholder="e.g., Morning meditation"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
                className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Create Habit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
