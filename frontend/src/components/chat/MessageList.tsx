import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { MessageBubble } from './MessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Sparkles } from 'lucide-react';

export function MessageList() {
  const { getCurrentConversation, isStreaming, streamingContent } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversation = getCurrentConversation();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamingContent]);

  if (!conversation || conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
        <p className="text-muted-foreground max-w-md">
          I'm your AI assistant for life management. Ask me anything about organizing
          your notes, tasks, goals, habits, or schedule.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
          {[
            'Help me organize my week',
            'What should I focus on today?',
            'Create a morning routine',
            'Help me set a fitness goal',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                const { sendMessage, createConversation, currentConversationId } =
                  useChatStore.getState();
                if (!currentConversationId) {
                  createConversation().then(() => sendMessage(suggestion));
                } else {
                  sendMessage(suggestion);
                }
              }}
              className="p-3 text-left text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="max-w-3xl mx-auto py-4 space-y-2">
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isStreaming && streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              createdAt: new Date(),
            }}
            isStreaming
          />
        )}
        {isStreaming && !streamingContent && (
          <div className="flex gap-4 p-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
