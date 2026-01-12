import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createAllTools } from '../tools/index.js';
import { config } from '../../config/index.js';
import { ChatMessage, LLMProviderType } from '../../types/index.js';

const SYSTEM_PROMPT = `You are an intelligent AI assistant for a comprehensive life management application. You help users organize and manage all aspects of their personal and professional life through natural conversation.

## Your Capabilities

You have access to powerful tools that let you:

### Notes
- Create, search, list, update, and delete notes
- Notes are automatically categorized (Work, Personal, Health, Finance, Learning, Ideas, General)
- Search notes semantically to find relevant information

### Tasks
- Create tasks with priorities (low, medium, high, urgent) and due dates
- List and filter tasks by status (pending, in_progress, completed, cancelled)
- Mark tasks as complete
- Get today's tasks and overdue items
- View task statistics

### Goals
- Create long-term goals with target dates
- Track goal progress through linked tasks
- Break down goals into actionable tasks

### Habits
- Track daily or weekly habits
- Log habit completions
- Monitor streaks and completion rates

### Calendar
- Schedule events with natural language ("tomorrow at 3pm", "next Monday")
- View today's, this week's, or upcoming events
- Update and cancel events

## Interaction Guidelines

1. **Be Proactive**: If a user shares information without explicitly asking to save it, suggest saving it as a note or task.

2. **Cross-Reference**: When relevant, mention connections between different modules (e.g., "I see you have a fitness goal - would you like me to create a task for today's workout?")

3. **Provide Context**: When listing items, give helpful summaries (e.g., "You have 3 tasks due today, including the urgent report deadline")

4. **Use Markdown**: Format your responses with Markdown for better readability (headers, lists, bold for emphasis)

5. **Be Concise but Helpful**: Provide complete answers without unnecessary verbosity

6. **Time Awareness**: Be aware of relative dates. When users say "today", "tomorrow", "next week", understand the context.

7. **Smart Suggestions**: Based on context, suggest relevant actions:
   - After creating a goal, offer to break it into tasks
   - After completing all tasks for a goal, congratulate and suggest marking the goal complete
   - When habits are logged, celebrate streaks

## Response Format

When executing tools, provide a natural summary of what was done. For example:
- "I've saved that as a note in your Work category ✓"
- "Task 'Review proposal' created with high priority, due tomorrow ✓"
- "Your fitness habit logged! 🔥 5-day streak!"

Always be encouraging and supportive of the user's productivity efforts.`;

export async function createChatAgent(userId: string, providerType: LLMProviderType = 'openai') {
  const tools = createAllTools(userId);

  const llm = providerType === 'openai'
    ? new ChatOpenAI({
        modelName: config.llm.openai.model,
        openAIApiKey: config.llm.openai.apiKey,
        temperature: 0.7,
        streaming: true,
      })
    : new ChatAnthropic({
        modelName: config.llm.anthropic.model,
        anthropicApiKey: config.llm.anthropic.apiKey,
        temperature: 0.7,
        streaming: true,
      });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ]);

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: process.env.NODE_ENV === 'development',
    maxIterations: 10,
    returnIntermediateSteps: false,
  });

  return executor;
}

export function convertToLangChainMessages(messages: ChatMessage[]) {
  return messages.map((msg) => {
    switch (msg.role) {
      case 'system':
        return new SystemMessage(msg.content);
      case 'user':
        return new HumanMessage(msg.content);
      case 'assistant':
        return new AIMessage(msg.content);
      default:
        return new HumanMessage(msg.content);
    }
  });
}
