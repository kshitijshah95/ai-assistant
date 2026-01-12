import { Router } from 'express';
import { calendarService } from '../../services/calendar.service.js';
import { conversationService } from '../../services/conversation.service.js';

const router = Router();

// Get events for a date range
router.get('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { start, end, year, month, view } = req.query;

    let events;

    if (view === 'month' && year && month) {
      events = await calendarService.getEventsForMonth(
        userId,
        parseInt(year as string),
        parseInt(month as string)
      );
    } else if (view === 'week') {
      events = await calendarService.getEventsForWeek(userId, start ? new Date(start as string) : new Date());
    } else if (view === 'day') {
      events = await calendarService.getEventsForDay(userId, start ? new Date(start as string) : new Date());
    } else if (start && end) {
      events = await calendarService.listByDateRange({
        userId,
        startDate: new Date(start as string),
        endDate: new Date(end as string),
      });
    } else {
      // Default: upcoming events
      events = await calendarService.getUpcomingEvents(userId, 20);
    }

    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { limit } = req.query;
    const events = await calendarService.getUpcomingEvents(
      userId,
      limit ? parseInt(limit as string) : 10
    );
    res.json(events);
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ error: 'Failed to get upcoming events' });
  }
});

// Get events for today
router.get('/today', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const events = await calendarService.getEventsForDay(userId, new Date());
    res.json(events);
  } catch (error) {
    console.error('Error getting today events:', error);
    res.status(500).json({ error: 'Failed to get today events' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const event = await calendarService.getById(req.params.id, userId);
    res.json(event);
  } catch (error) {
    console.error('Error getting event:', error);
    if ((error as Error).message === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title, description, startTime, endTime, recurrenceRule } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }

    const event = await calendarService.create({
      userId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      recurrenceRule,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.patch('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title, description, startTime, endTime, recurrenceRule } = req.body;

    const event = await calendarService.update(req.params.id, userId, {
      title,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      recurrenceRule,
    });

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    if ((error as Error).message === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    await calendarService.delete(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    if ((error as Error).message === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
