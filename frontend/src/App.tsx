import { useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { NotesView } from '@/components/notes/NotesView';
import { TasksView } from '@/components/tasks/TasksView';
import { GoalsView } from '@/components/goals/GoalsView';
import { HabitsView } from '@/components/habits/HabitsView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { useAppStore } from '@/stores/app.store';
import { useChatStore } from '@/stores/chat.store';

function App() {
  const { currentView } = useAppStore();
  const { initializeSocket } = useChatStore();

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatContainer />;
      case 'notes':
        return <NotesView />;
      case 'tasks':
        return <TasksView />;
      case 'goals':
        return <GoalsView />;
      case 'habits':
        return <HabitsView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <ChatContainer />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderView()}
        </main>
      </div>
    </TooltipProvider>
  );
}

export default App;
