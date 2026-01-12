import { useEffect } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { useAppStore } from '@/stores/app.store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  FileText,
  CheckSquare,
  Calendar,
  Target,
  Repeat,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { View } from '@/types';

const navItems: { id: View; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'notes', label: 'Notes', icon: <FileText className="w-4 h-4" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
  { id: 'habits', label: 'Habits', icon: <Repeat className="w-4 h-4" /> },
];

export function Sidebar() {
  const { currentView, setView, sidebarOpen, toggleSidebar } = useAppStore();
  const {
    conversations,
    currentConversationId,
    selectConversation,
    createConversation,
    deleteConversation,
    loadConversations,
  } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-muted/30 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        {sidebarOpen && (
          <span className="font-semibold text-sm">AI Assistant</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn('ml-auto h-8 w-8', !sidebarOpen && 'mx-auto')}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === item.id ? 'secondary' : 'ghost'}
                size={sidebarOpen ? 'default' : 'icon'}
                onClick={() => !item.disabled && setView(item.id)}
                disabled={item.disabled}
                className={cn(
                  'w-full',
                  sidebarOpen ? 'justify-start' : 'justify-center'
                )}
              >
                {item.icon}
                {sidebarOpen && <span className="ml-2">{item.label}</span>}
                {sidebarOpen && item.disabled && (
                  <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                )}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
          </Tooltip>
        ))}
      </nav>

      {/* Conversations List (Chat view only) */}
      {currentView === 'chat' && (
        <>
          <div className="px-3 py-2 flex items-center justify-between">
            {sidebarOpen && (
              <span className="text-xs font-medium text-muted-foreground">
                Conversations
              </span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    createConversation();
                  }}
                  className="h-6 w-6"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New conversation</TooltipContent>
            </Tooltip>
          </div>

          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors',
                    conv.id === currentConversationId
                      ? 'bg-secondary'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => selectConversation(conv.id)}
                >
                  <MessageSquare className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                  {sidebarOpen && (
                    <>
                      <span className="text-sm truncate flex-1">{conv.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
