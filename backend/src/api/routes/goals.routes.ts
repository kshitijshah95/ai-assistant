import { Router } from 'express';
import { goalsService } from '../../services/goals.service.js';
import { conversationService } from '../../services/conversation.service.js';

const router = Router();

// List goals
router.get('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { status } = req.query;
    const goals = await goalsService.list(
      userId,
      status as 'active' | 'completed' | 'archived' | undefined
    );
    res.json(goals);
  } catch (error) {
    console.error('Error listing goals:', error);
    res.status(500).json({ error: 'Failed to list goals' });
  }
});

// Get single goal
router.get('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const goal = await goalsService.getGoalWithProgress(req.params.id, userId);
    res.json(goal);
  } catch (error) {
    console.error('Error getting goal:', error);
    if ((error as Error).message === 'Goal not found') {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(500).json({ error: 'Failed to get goal' });
  }
});

// Create goal
router.post('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title, description, targetDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const goal = await goalsService.create({
      userId,
      title,
      description,
      targetDate: targetDate ? new Date(targetDate) : undefined,
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
router.patch('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title, description, status, targetDate } = req.body;

    const goal = await goalsService.update(req.params.id, userId, {
      title,
      description,
      status,
      targetDate: targetDate === null ? null : targetDate ? new Date(targetDate) : undefined,
    });

    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    if ((error as Error).message === 'Goal not found') {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    await goalsService.delete(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting goal:', error);
    if ((error as Error).message === 'Goal not found') {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
