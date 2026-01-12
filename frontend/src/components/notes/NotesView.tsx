import { useEffect, useState } from 'react';
import { useNotesStore } from '@/stores/notes.store';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus, Search, FolderOpen, FileText } from 'lucide-react';

export function NotesView() {
  const {
    notes,
    categories,
    selectedCategory,
    searchQuery,
    isLoading,
    selectedNote,
    loadNotes,
    loadCategories,
    searchNotes,
    setSelectedCategory,
    setSearchQuery,
    setSelectedNote,
  } = useNotesStore();

  const [isCreating, setIsCreating] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    loadNotes();
    loadCategories();
  }, [loadNotes, loadCategories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchNotes(localSearch);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Categories */}
      <div className="w-56 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notes
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <Button
              variant={selectedCategory === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="w-full justify-start"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              All Notes
              <span className="ml-auto text-muted-foreground">
                {notes.length}
              </span>
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.name}
                variant={selectedCategory === cat.name ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat.name)}
                className="w-full justify-start"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {cat.name}
                <span className="ml-auto text-muted-foreground">{cat.count}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Notes List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search and Actions */}
        <div className="p-4 border-b flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>

        {/* Notes Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first note or use the chat to save information.
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isSelected={selectedNote?.id === note.id}
                    onClick={() => setSelectedNote(note)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Note Editor Panel */}
      {(selectedNote || isCreating) && (
        <div className="w-[500px] border-l flex flex-col">
          <NoteEditor
            note={isCreating ? null : selectedNote}
            isNew={isCreating}
            onClose={() => {
              setSelectedNote(null);
              setIsCreating(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
