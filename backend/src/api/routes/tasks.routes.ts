import { Router } from 'express';
import { tasksService } from '../../services/tasks.service.js';
import { conversationService } from '../../services/conversation.service.js';

const router = Router();

// List tasks
router.get('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { status, priority, goalId, dueBefore, dueAfter, limit, offset } = req.query;

    const result = await tasksService.list({
      userId,
      status: status as 'pending' | 'in_progress' | 'completed' | 'cancelled' | undefined,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent' | undefined,
      goalId: goalId as string | undefined,
      dueBefore: dueBefore ? new Date(dueBefore as string) : undefined,
      dueAfter: dueAfter ? new Date(dueAfter as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json(result);
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

// Get tasks for today
router.get('/today', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const tasks = await tasksService.getTasksForToday(userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting today tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks for today' });
  }
});

// Get task stats
router.get('/stats', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const stats = await tasksService.getTaskStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting task stats:', error);
    res.status(500).json({ error: 'Failed to get task stats' });
  }
});

// Get overdue tasks
router.get('/overdue', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const tasks = await tasksService.getOverdueTasks(userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting overdue tasks:', error);
    res.status(500).json({ error: 'Failed to get overdue tasks' });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const task = await tasksService.getById(req.params.id, userId);
    res.json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    if ((error as Error).message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title, description, status, priority, dueDate, goalId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await tasksService.create({
      userId,
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      goalId,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.patch('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title, description, status, priority, dueDate, goalId } = req.body;

    const task = await tasksService.update(req.params.id, userId, {
      title,
      description,
      status,
      priority,
      dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
      goalId,
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    if ((error as Error).message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Mark task as complete
router.post('/:id/complete', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const task = await tasksService.markComplete(req.params.id, userId);
    res.json(task);
  } catch (error) {
    console.error('Error completing task:', error);
    if ((error as Error).message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    await tasksService.delete(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    if ((error as Error).message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
