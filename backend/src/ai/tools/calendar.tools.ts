import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { calendarService } from '../../services/calendar.service.js';

export function createCalendarTools(userId: string) {
  const scheduleEventTool = new DynamicStructuredTool({
    name: 'schedule_event',
    description: 'Schedule a new calendar event. Use this when the user wants to add something to their calendar.',
    schema: z.object({
      title: z.string().describe('Title of the event'),
      dateTime: z.string().describe('When the event should occur (e.g., "tomorrow at 3pm", "Monday at 10am")'),
      duration: z.string().optional().describe('Duration of the event (e.g., "1 hour", "30 minutes")'),
      description: z.string().optional().describe('Description or notes for the event'),
    }),
    func: async ({ title, dateTime, duration, description }) => {
      try {
        const parsed = calendarService.parseDateTime(dateTime + (duration ? ` for ${duration}` : ''));
        
        if (!parsed) {
          return JSON.stringify({
            success: false,
            error: 'Could not parse the date/time. Please be more specific.',
          });
        }

        const event = await calendarService.create({
          userId,
          title,
          description,
          startTime: parsed.start,
          endTime: parsed.end,
        });

        return JSON.stringify({
          success: true,
          message: `Event "${title}" scheduled for ${parsed.start.toLocaleString()}`,
          event: {
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const getTodayEventsTool = new DynamicStructuredTool({
    name: 'get_today_events',
    description: 'Get all events scheduled for today. Use this when the user asks what\'s on their calendar today.',
    schema: z.object({}),
    func: async () => {
      try {
        const events = await calendarService.getEventsForDay(userId, new Date());

        if (events.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No events scheduled for today.',
            events: [],
          });
        }

        return JSON.stringify({
          success: true,
          message: `You have ${events.length} event(s) today`,
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
            description: e.description,
          })),
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const getWeekEventsTool = new DynamicStructuredTool({
    name: 'get_week_events',
    description: 'Get all events for this week. Use this when the user asks about their schedule for the week.',
    schema: z.object({}),
    func: async () => {
      try {
        const events = await calendarService.getEventsForWeek(userId, new Date());

        if (events.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No events scheduled for this week.',
            events: [],
          });
        }

        return JSON.stringify({
          success: true,
          message: `You have ${events.length} event(s) this week`,
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
          })),
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const getUpcomingEventsTool = new DynamicStructuredTool({
    name: 'get_upcoming_events',
    description: 'Get upcoming events. Use this to check what\'s coming up on the calendar.',
    schema: z.object({
      limit: z.number().optional().default(5).describe('Number of events to retrieve'),
    }),
    func: async ({ limit }) => {
      try {
        const events = await calendarService.getUpcomingEvents(userId, limit);

        if (events.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No upcoming events scheduled.',
            events: [],
          });
        }

        return JSON.stringify({
          success: true,
          message: `Next ${events.length} upcoming event(s)`,
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
          })),
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const updateEventTool = new DynamicStructuredTool({
    name: 'update_event',
    description: 'Update a calendar event. Use this when the user wants to reschedule or modify an event.',
    schema: z.object({
      eventId: z.string().describe('The ID of the event to update'),
      title: z.string().optional().describe('New title'),
      dateTime: z.string().optional().describe('New date/time'),
      description: z.string().optional().describe('New description'),
    }),
    func: async ({ eventId, title, dateTime, description }) => {
      try {
        const updateData: Record<string, unknown> = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        
        if (dateTime) {
          const parsed = calendarService.parseDateTime(dateTime);
          if (parsed) {
            updateData.startTime = parsed.start;
            updateData.endTime = parsed.end;
          }
        }

        const event = await calendarService.update(eventId, userId, updateData);

        return JSON.stringify({
          success: true,
          message: `Event "${event.title}" updated`,
          event: {
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const deleteEventTool = new DynamicStructuredTool({
    name: 'delete_event',
    description: 'Delete a calendar event. Use this when the user wants to cancel or remove an event.',
    schema: z.object({
      eventId: z.string().describe('The ID of the event to delete'),
    }),
    func: async ({ eventId }) => {
      try {
        await calendarService.delete(eventId, userId);
        return JSON.stringify({
          success: true,
          message: 'Event deleted successfully',
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  return [
    scheduleEventTool,
    getTodayEventsTool,
    getWeekEventsTool,
    getUpcomingEventsTool,
    updateEventTool,
    deleteEventTool,
  ];
}
