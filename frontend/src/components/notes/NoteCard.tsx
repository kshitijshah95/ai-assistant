import { Note } from '@/stores/notes.store';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { FileText, Tag } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
}

export function NoteCard({ note, isSelected, onClick }: NoteCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">
            {note.title || 'Untitled Note'}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {note.content}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {note.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                {note.category}
              </span>
            )}
            {note.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {note.tags?.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{note.tags.length - 2} more
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDate(note.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
