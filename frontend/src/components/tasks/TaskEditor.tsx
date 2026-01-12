import { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, useTasksStore } from '@/stores/tasks.store';
import { Button } from '@/components/ui/button';
import { Save, X, Trash2, Edit2, Flag, Calendar } from 'lucide-react';

interface TaskEditorProps {
  task: Task | null;
  isNew?: boolean;
  onClose: () => void;
}

const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

export function TaskEditor({ task, isNew, onClose }: TaskEditorProps) {
  const { createTask, updateTask, deleteTask, isEditing, setIsEditing } = useTasksStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
      setDueDate('');
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      if (isNew || !task) {
        await createTask({
          title,
          description: description || undefined,
          priority,
          dueDate: dueDate || undefined,
        });
      } else {
        await updateTask(task.id, {
          title,
          description,
          priority,
          status,
          dueDate: dueDate || null,
        });
      }
      setIsEditing(false);
      if (isNew) onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await deleteTask(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const editing = isNew || isEditing;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-medium">
          {isNew ? 'New Task' : editing ? 'Edit Task' : task?.title}
        </h2>
        <div className="flex items-center gap-2">
          {!isNew && !editing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {!isNew && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {editing ? (
          <>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full mt-1 px-3 py-2 bg-muted rounded-lg border-none outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-muted rounded-lg border-none outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg border-none outline-none"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg border-none outline-none"
                />
              </div>
            </div>

            {!isNew && (
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg border-none outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : (
          <>
            {task?.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm">{task.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Priority</h3>
                <p className="text-sm capitalize">{task?.priority}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <p className="text-sm capitalize">{task?.status.replace('_', ' ')}</p>
              </div>
              {task?.dueDate && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h3>
                  <p className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {editing && (
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Task'}
          </Button>
        </div>
      )}
    </div>
  );
}
