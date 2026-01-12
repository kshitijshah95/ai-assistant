import { useEffect, useState } from 'react';
import { useCalendarStore, CalendarEvent } from '@/stores/calendar.store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Save, Edit2, Trash2, Clock } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function CalendarView() {
  const {
    events,
    currentDate,
    view,
    isLoading,
    selectedEvent,
    isEditing,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    setView,
    setSelectedEvent,
    setIsEditing,
    goToToday,
    goToPrevious,
    goToNext,
  } = useCalendarStore();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (selectedEvent && !isCreating) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || '');
      const start = new Date(selectedEvent.startTime);
      const end = new Date(selectedEvent.endTime);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    }
  }, [selectedEvent, isCreating]);

  const handleSave = async () => {
    if (!title.trim() || !startDate || !startTime || !endDate || !endTime) return;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (isCreating) {
      await createEvent({
        title,
        description: description || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
      setIsCreating(false);
    } else if (selectedEvent) {
      await updateEvent(selectedEvent.id, {
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
      setIsEditing(false);
    }
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedEvent || !confirm('Delete this event?')) return;
    await deleteEvent(selectedEvent.id);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
  };

  const handleCreateNew = (date?: Date) => {
    setIsCreating(true);
    setSelectedEvent(null);
    resetForm();
    if (date) {
      setStartDate(date.toISOString().split('T')[0]);
      setEndDate(date.toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
    }
  };

  // Generate calendar grid for month view
  const generateMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];
    
    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full">
      {/* Main Calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={goToPrevious} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNext} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              {(['month', 'week', 'day'] as const).map((v) => (
                <Button
                  key={v}
                  variant={view === v ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView(v)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md capitalize"
                >
                  {v}
                </Button>
              ))}
            </div>
            <Button onClick={() => handleCreateNew()}>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {view === 'month' && (
            <div className="h-full flex flex-col">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {DAYS.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {generateMonthGrid().map((date, index) => (
                  <div
                    key={index}
                    className={cn(
                      'border-b border-r p-1 min-h-[100px] cursor-pointer hover:bg-muted/50',
                      !date && 'bg-muted/20'
                    )}
                    onClick={() => date && handleCreateNew(date)}
                  >
                    {date && (
                      <>
                        <div
                          className={cn(
                            'text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1',
                            isToday(date) && 'bg-primary text-primary-foreground'
                          )}
                        >
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {getEventsForDate(date).slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setIsCreating(false);
                              }}
                              className="text-xs p-1 rounded bg-primary/10 text-primary truncate hover:bg-primary/20"
                            >
                              {formatTime(event.startTime)} {event.title}
                            </div>
                          ))}
                          {getEventsForDate(date).length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{getEventsForDate(date).length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(view === 'week' || view === 'day') && (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No events scheduled for this {view}.
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsCreating(false);
                      }}
                      className="p-3 rounded-lg border hover:border-primary cursor-pointer"
                    >
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Event Editor Panel */}
      {(selectedEvent || isCreating) && (
        <div className="w-[400px] border-l flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">{isCreating ? 'New Event' : isEditing ? 'Edit Event' : selectedEvent?.title}</h3>
            <div className="flex gap-2">
              {!isCreating && !isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {!isCreating && (
                <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => { setSelectedEvent(null); setIsCreating(false); resetForm(); }} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {(isCreating || isEditing) ? (
            <div className="flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none resize-none"
                  rows={2}
                  placeholder="Add description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-muted rounded-lg outline-none"
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={!title.trim()} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Event
              </Button>
            </div>
          ) : selectedEvent && (
            <div className="flex-1 p-4 space-y-4">
              {selectedEvent.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Time</h4>
                <p className="text-sm">
                  {new Date(selectedEvent.startTime).toLocaleString()} -{' '}
                  {new Date(selectedEvent.endTime).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
