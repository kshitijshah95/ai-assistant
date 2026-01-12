import { Router } from 'express';
import { habitsService } from '../../services/habits.service.js';
import { conversationService } from '../../services/conversation.service.js';

const router = Router();

// List habits
router.get('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const habits = await habitsService.list(userId);
    res.json(habits);
  } catch (error) {
    console.error('Error listing habits:', error);
    res.status(500).json({ error: 'Failed to list habits' });
  }
});

// Get today's habit status
router.get('/today', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const status = await habitsService.getTodayStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Error getting today status:', error);
    res.status(500).json({ error: 'Failed to get today status' });
  }
});

// Get single habit
router.get('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const habit = await habitsService.getById(req.params.id, userId);
    res.json(habit);
  } catch (error) {
    console.error('Error getting habit:', error);
    if ((error as Error).message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.status(500).json({ error: 'Failed to get habit' });
  }
});

// Get habit stats
router.get('/:id/stats', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const stats = await habitsService.getHabitStats(req.params.id, userId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting habit stats:', error);
    res.status(500).json({ error: 'Failed to get habit stats' });
  }
});

// Get habit logs
router.get('/:id/logs', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { days } = req.query;
    const logs = await habitsService.getHabitLogs(
      req.params.id,
      userId,
      days ? parseInt(days as string) : 30
    );
    res.json(logs);
  } catch (error) {
    console.error('Error getting habit logs:', error);
    res.status(500).json({ error: 'Failed to get habit logs' });
  }
});

// Create habit
router.post('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { name, frequency, schedule } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const habit = await habitsService.create({
      userId,
      name,
      frequency,
      schedule,
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Log habit completion
router.post('/:id/log', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { date, completed, notes } = req.body;

    const log = await habitsService.logHabit(
      req.params.id,
      userId,
      date ? new Date(date) : undefined,
      completed ?? true,
      notes
    );

    res.status(201).json(log);
  } catch (error) {
    console.error('Error logging habit:', error);
    if ((error as Error).message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.status(500).json({ error: 'Failed to log habit' });
  }
});

// Update habit
router.patch('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { name, frequency, schedule } = req.body;

    const habit = await habitsService.update(req.params.id, userId, {
      name,
      frequency,
      schedule,
    });

    res.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    if ((error as Error).message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete habit
router.delete('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    await habitsService.delete(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting habit:', error);
    if ((error as Error).message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

export default router;
