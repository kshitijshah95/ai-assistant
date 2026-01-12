import { Router } from 'express';
import conversationsRoutes from './conversations.routes.js';
import notesRoutes from './notes.routes.js';
import tasksRoutes from './tasks.routes.js';
import goalsRoutes from './goals.routes.js';
import habitsRoutes from './habits.routes.js';
import calendarRoutes from './calendar.routes.js';

const router = Router();

router.use('/conversations', conversationsRoutes);
router.use('/notes', notesRoutes);
router.use('/tasks', tasksRoutes);
router.use('/goals', goalsRoutes);
router.use('/habits', habitsRoutes);
router.use('/calendar', calendarRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
