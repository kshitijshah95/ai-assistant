import { Router } from 'express';
import { conversationService } from '../../services/conversation.service.js';

const router = Router();

// Get all conversations
router.get('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const conversations = await conversationService.listConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get a specific conversation with messages
router.get('/:id', async (req, res) => {
  try {
    const conversation = await conversationService.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Create a new conversation
router.post('/', async (req, res) => {
  try {
    const userId = await conversationService.getOrCreateUser();
    const { title } = req.body;
    const conversation = await conversationService.createConversation(userId, title);
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Delete a conversation
router.delete('/:id', async (req, res) => {
  try {
    await conversationService.deleteConversation(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Update conversation title
router.patch('/:id', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const conversation = await conversationService.updateConversationTitle(req.params.id, title);
    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

export default router;
