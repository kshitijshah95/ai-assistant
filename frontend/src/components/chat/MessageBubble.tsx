import { Message } from '@/types';
import { renderMarkdown } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-lg',
        isUser ? 'bg-muted/50' : 'bg-transparent'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div
          className={cn(
            'markdown-content',
            isStreaming && 'cursor-blink'
          )}
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(message.content || ' '),
          }}
        />
      </div>
    </div>
  );
}
