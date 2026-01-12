import { Router } from 'express';
import { notesService } from '../../services/notes.service.js';
import { conversationService } from '../../services/conversation.service.js';

const router = Router();

// List notes
router.get('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { category, tags, limit, offset, search } = req.query;

    if (search && typeof search === 'string') {
      const results = await notesService.search(
        userId,
        search,
        limit ? parseInt(limit as string) : 10
      );
      return res.json({ notes: results, total: results.length });
    }

    const result = await notesService.list({
      userId,
      category: category as string | undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json(result);
  } catch (error) {
    console.error('Error listing notes:', error);
    res.status(500).json({ error: 'Failed to list notes' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const categories = await notesService.getCategories(userId);
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const note = await notesService.getById(req.params.id, userId);
    res.json(note);
  } catch (error) {
    console.error('Error getting note:', error);
    if ((error as Error).message === 'Note not found') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: 'Failed to get note' });
  }
});

// Create note
router.post('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title, content, category, tags } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const note = await notesService.create({
      userId,
      title,
      content,
      category,
      tags,
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.patch('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title, content, category, tags } = req.body;

    const note = await notesService.update(req.params.id, userId, {
      title,
      content,
      category,
      tags,
    });

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    if ((error as Error).message === 'Note not found') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    await notesService.delete(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    if ((error as Error).message === 'Note not found') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Search notes (semantic)
router.post('/search', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await notesService.search(userId, query, limit || 10);
    res.json(results);
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ error: 'Failed to search notes' });
  }
});

export default router;
