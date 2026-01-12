import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatStore } from '@/stores/chat.store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ChatContainer() {
  const { provider, setProvider, isConnected, error } = useChatStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Provider:</span>
          <div className="flex rounded-md border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={provider === 'openai' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setProvider('openai')}
                  className="rounded-r-none text-xs h-7"
                >
                  OpenAI
                </Button>
              </TooltipTrigger>
              <TooltipContent>Use GPT-4</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={provider === 'anthropic' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setProvider('anthropic')}
                  className="rounded-l-none text-xs h-7"
                >
                  Anthropic
                </Button>
              </TooltipTrigger>
              <TooltipContent>Use Claude</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <MessageList />

      {/* Input */}
      <MessageInput />
    </div>
  );
}
