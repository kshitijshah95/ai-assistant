# AI Assistant - Life Management Tool

An AI-first life management application with chat as the primary interface. Manage your notes, tasks, goals, habits, and calendar through natural conversation.

## Features

- **Chat Interface**: Natural language interaction with AI assistant
- **Multi-Provider Support**: Switch between OpenAI (GPT-4) and Anthropic (Claude)
- **Notes** (Coming Soon): Auto-categorized notes with semantic search
- **Tasks** (Coming Soon): Task management with AI assistance
- **Goals** (Coming Soon): Goal tracking with task breakdown
- **Habits** (Coming Soon): Habit tracking with streaks
- **Calendar** (Coming Soon): Event scheduling with natural language

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Database**: PostgreSQL with pgvector for embeddings
- **AI**: LangChain.js with OpenAI/Anthropic providers

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- OpenAI API key and/or Anthropic API key

## Getting Started

### 1. Clone and Install

```bash
cd ai-assistant
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_assistant?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ai_assistant

# LLM Providers
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Default LLM Provider (openai | anthropic)
DEFAULT_LLM_PROVIDER=openai

# Server
PORT=3001
NODE_ENV=development
```

### 3. Start Database

```bash
docker-compose up -d
```

### 4. Initialize Database

```bash
npm run db:generate
npm run db:push
```

### 5. Start Development Servers

```bash
npm run dev
```

This starts both frontend (http://localhost:5173) and backend (http://localhost:3001).

## Project Structure

```
ai-assistant/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── stores/        # Zustand stores
│   │   ├── services/      # API and socket services
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── ...
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── api/          # REST API routes
│   │   ├── ai/           # LLM providers and agents
│   │   ├── services/     # Business logic
│   │   ├── websocket/    # Socket.io handlers
│   │   └── db/           # Database (Prisma)
│   └── prisma/           # Prisma schema
├── docker-compose.yml    # PostgreSQL + pgvector
└── package.json          # Monorepo root
```

## Development Phases

1. **Phase 1** ✅ - Foundation: Chat interface, LLM providers, database setup
2. **Phase 2** ✅ - Notes module with auto-categorization
3. **Phase 3** ✅ - Tasks module with AI assistance
4. **Phase 4** ✅ - Goals and Habits modules
5. **Phase 5** ✅ - Calendar module
6. **Phase 6** ✅ - Advanced AI features (routing, cross-module queries)
7. **Phase 7** ✅ - Production polish (error handling, logging, validation)

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run build` - Build both frontend and backend
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## License

MIT
