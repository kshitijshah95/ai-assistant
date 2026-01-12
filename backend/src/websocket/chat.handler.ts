import { Server, Socket } from 'socket.io';
import { createChatAgent, convertToLangChainMessages } from '../ai/agents/chat.agent.js';
import { conversationService } from '../services/conversation.service.js';
import { ChatRequest, LLMProviderType } from '../types/index.js';

export function setupChatHandler(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('chat:message', async (data: ChatRequest) => {
      try {
        await handleChatMessage(socket, data);
      } catch (error) {
        console.error('Chat error:', error);
        socket.emit('chat:error', {
          message: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    });

    socket.on('chat:stop', () => {
      console.log('Stop generation requested');
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

async function handleChatMessage(socket: Socket, request: ChatRequest) {
  const { message, conversationId, provider: providerType } = request;

  // Get or create user
  const userId = await conversationService.getOrCreateUser();

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const conversation = await conversationService.createConversation(userId);
    convId = conversation.id;
    socket.emit('chat:conversation', { conversationId: convId });
  }

  // Save user message
  await conversationService.addMessage(convId, 'user', message);

  // Get conversation history
  const history = await conversationService.getMessages(convId);

  // Convert to LangChain messages (excluding the last user message since we pass it separately)
  const chatHistory = convertToLangChainMessages(history.slice(0, -1));

  // Create agent with tools
  const agent = await createChatAgent(userId, (providerType as LLMProviderType) || 'openai');

  socket.emit('chat:start', { conversationId: convId, provider: providerType || 'openai' });

  let fullResponse = '';

  try {
    // Use streaming with the agent
    const stream = await agent.streamEvents(
      {
        input: message,
        chat_history: chatHistory,
      },
      { version: 'v2' }
    );

    for await (const event of stream) {
      if (event.event === 'on_chat_model_stream') {
        const chunk = event.data?.chunk;
        if (chunk?.content) {
          const content = typeof chunk.content === 'string' 
            ? chunk.content 
            : chunk.content[0]?.text || '';
          if (content) {
            fullResponse += content;
            socket.emit('chat:chunk', { content });
          }
        }
      }
    }

    // If no streaming happened, try to get the final output
    if (!fullResponse) {
      const result = await agent.invoke({
        input: message,
        chat_history: chatHistory,
      });
      fullResponse = result.output;
      socket.emit('chat:chunk', { content: fullResponse });
    }

    // Save assistant message
    const assistantMessage = await conversationService.addMessage(convId, 'assistant', fullResponse);

    socket.emit('chat:end', {
      conversationId: convId,
      messageId: assistantMessage.id,
      content: fullResponse,
    });

    // Generate title for new conversations
    if (history.length <= 2) {
      const title = generateSimpleTitle(message);
      await conversationService.updateConversationTitle(convId, title);
      socket.emit('chat:title', { conversationId: convId, title });
    }
  } catch (error) {
    console.error('Agent error:', error);
    socket.emit('chat:error', {
      message: error instanceof Error ? error.message : 'Failed to generate response',
    });
  }
}

function generateSimpleTitle(message: string): string {
  // Simple title generation based on first few words
  const words = message.split(' ').slice(0, 5);
  let title = words.join(' ');
  if (message.split(' ').length > 5) {
    title += '...';
  }
  return title.slice(0, 50);
}
