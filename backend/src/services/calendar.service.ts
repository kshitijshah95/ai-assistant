import prisma from '../db/prisma.js';

export interface CreateEventInput {
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  recurrenceRule?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  recurrenceRule?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EventListParams {
  userId: string;
  startDate: Date;
  endDate: Date;
}

export class CalendarService {
  async create(input: CreateEventInput) {
    const event = await prisma.calendarEvent.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        recurrenceRule: input.recurrenceRule,
        metadata: input.metadata || {},
      },
    });

    return event;
  }

  async update(eventId: string, userId: string, input: UpdateEventInput) {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!existing) {
      throw new Error('Event not found');
    }

    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        recurrenceRule: input.recurrenceRule,
        metadata: input.metadata,
      },
    });

    return event;
  }

  async delete(eventId: string, userId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    await prisma.calendarEvent.delete({ where: { id: eventId } });
    return { success: true };
  }

  async getById(eventId: string, userId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  async listByDateRange(params: EventListParams) {
    const { userId, startDate, endDate } = params;

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            AND: [
              { startTime: { lte: startDate } },
              { endTime: { gte: endDate } },
            ],
          },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    return events;
  }

  async getEventsForDay(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.listByDateRange({ userId, startDate: startOfDay, endDate: endOfDay });
  }

  async getEventsForWeek(userId: string, date: Date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.listByDateRange({ userId, startDate: startOfWeek, endDate: endOfWeek });
  }

  async getEventsForMonth(userId: string, year: number, month: number) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return this.listByDateRange({ userId, startDate: startOfMonth, endDate: endOfMonth });
  }

  async getUpcomingEvents(userId: string, limit: number = 10) {
    const now = new Date();

    return prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: { gte: now },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });
  }

  // Parse natural language datetime
  parseDateTime(text: string, referenceDate: Date = new Date()): { start: Date; end: Date } | undefined {
    const lowered = text.toLowerCase();
    const now = new Date(referenceDate);

    // Parse time patterns
    const timeMatch = lowered.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    let hours = 9; // Default to 9 AM
    let minutes = 0;

    if (timeMatch) {
      hours = parseInt(timeMatch[1]);
      minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3]?.toLowerCase() === 'pm' && hours !== 12) hours += 12;
      if (timeMatch[3]?.toLowerCase() === 'am' && hours === 12) hours = 0;
    }

    // Parse date patterns
    let targetDate = new Date(now);

    if (lowered.includes('today')) {
      // Keep today
    } else if (lowered.includes('tomorrow')) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (lowered.includes('next week')) {
      targetDate.setDate(targetDate.getDate() + 7);
    } else {
      // Check for day names
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < days.length; i++) {
        if (lowered.includes(days[i])) {
          const today = now.getDay();
          let daysUntil = i - today;
          if (daysUntil <= 0) daysUntil += 7;
          targetDate.setDate(targetDate.getDate() + daysUntil);
          break;
        }
      }
    }

    targetDate.setHours(hours, minutes, 0, 0);

    // Default duration: 1 hour
    const endDate = new Date(targetDate);
    endDate.setHours(endDate.getHours() + 1);

    // Check for duration patterns
    const durationMatch = lowered.match(/for (\d+) (hour|hours|minute|minutes)/i);
    if (durationMatch) {
      const amount = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      if (unit.startsWith('hour')) {
        endDate.setHours(targetDate.getHours() + amount);
      } else {
        endDate.setMinutes(targetDate.getMinutes() + amount);
      }
    }

    return { start: targetDate, end: endDate };
  }
}

export const calendarService = new CalendarService();
