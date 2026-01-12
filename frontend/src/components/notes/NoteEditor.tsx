import { useState, useEffect } from 'react';
import { Note, useNotesStore } from '@/stores/notes.store';
import { Button } from '@/components/ui/button';
import { renderMarkdown } from '@/lib/markdown';
import { Save, X, Trash2, Edit2, Eye } from 'lucide-react';

interface NoteEditorProps {
  note: Note | null;
  isNew?: boolean;
  onClose: () => void;
}

export function NoteEditor({ note, isNew, onClose }: NoteEditorProps) {
  const { createNote, updateNote, deleteNote, isEditing, setIsEditing } = useNotesStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content);
      setCategory(note.category || '');
      setTags(note.tags?.join(', ') || '');
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setTags('');
    }
  }, [note]);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      const data = {
        title: title || undefined,
        content,
        category: category || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      };

      if (isNew || !note) {
        await createNote(data);
      } else {
        await updateNote(note.id, data);
      }
      setIsEditing(false);
      if (isNew) onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteNote(note.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const editing = isNew || isEditing;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {editing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title (optional)"
              className="text-lg font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
          ) : (
            <h2 className="text-lg font-medium">{note?.title || 'Untitled Note'}</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreview(!isPreview)}
                className="h-8 w-8"
              >
                {isPreview ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {!editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Metadata */}
      {editing && (
        <div className="flex gap-4 p-4 border-b">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal"
              className="w-full mt-1 px-2 py-1 text-sm bg-muted rounded-md border-none outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., meeting, project"
              className="w-full mt-1 px-2 py-1 text-sm bg-muted rounded-md border-none outline-none"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {editing && !isPreview ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here... (Markdown supported)"
            className="w-full h-full resize-none bg-transparent border-none outline-none font-mono text-sm"
          />
        ) : (
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content || 'No content') }}
          />
        )}
      </div>

      {/* Footer */}
      {editing && (
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      )}
    </div>
  );
}
