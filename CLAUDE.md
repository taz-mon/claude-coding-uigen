# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run setup` - Install dependencies, generate Prisma client, and run database migrations
- `npm run dev` - Start development server with Turbopack
- `npm run dev:daemon` - Start development server in background with logs written to logs.txt
- `npm run build` - Build production application
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests

### Database Commands
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma migrate dev` - Create and apply new database migration
- `npm run db:reset` - Reset database (force reset all migrations)

### Testing Commands
- `npm run test` - Run all tests with Vitest
- `npx vitest run path/to/test.test.tsx` - Run individual test files
- `npx vitest --watch` - Run tests in watch mode
- Tests are located in `__tests__` directories alongside components

## Architecture Overview

UIGen is an AI-powered React component generator built with Next.js 15 and the App Router. The application uses a virtual file system approach where generated components exist only in memory (not written to disk) and are rendered in real-time.

### Core Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Database**: Prisma with SQLite
- **AI Integration**: Anthropic Claude via Vercel AI SDK
- **Testing**: Vitest with React Testing Library
- **Authentication**: Custom JWT-based auth with bcrypt

### Key Architectural Patterns

#### 1. Virtual File System
The application uses a custom `VirtualFileSystem` class (`src/lib/file-system.ts`) that manages component files in memory. This allows:
- Real-time preview without disk I/O
- Instant component updates
- Safe sandboxed execution

#### 2. Context-Based State Management
Two primary React contexts manage application state:
- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`) - Manages virtual files, selected files, and file operations
- **ChatContext** (`src/lib/contexts/chat-context.tsx`) - Handles AI chat integration and message flow

#### 3. Server Actions for Authentication
Authentication uses Next.js server actions (`src/actions/index.ts`) with:
- Password hashing via bcrypt
- JWT session management
- Database operations via Prisma

#### 4. AI Tool Calling Architecture
The chat system supports structured tool calls for file manipulation:
- **str_replace** tool (`src/lib/tools/str-replace.ts`) - Create/update files with content
- **file_manager** tool (`src/lib/tools/file-manager.ts`) - Rename/delete files and directories
- JSON-based tool calling interface via Vercel AI SDK
- Real-time file system updates trigger preview refreshes

### Directory Structure

```
src/
├── actions/           # Server actions for auth and data operations
├── app/              # Next.js App Router pages and API routes
│   ├── [projectId]/  # Dynamic project page
│   └── api/chat/     # Chat API endpoint for AI integration
├── components/       # React components organized by feature
│   ├── auth/         # Authentication forms and dialogs
│   ├── chat/         # Chat interface and message handling
│   ├── editor/       # Code editor and file tree components
│   ├── preview/      # Component preview frame
│   └── ui/           # Reusable UI components (shadcn/ui style)
├── generated/        # Generated Prisma client (auto-generated)
├── hooks/            # Custom React hooks
├── lib/              # Core utilities and configurations
│   ├── contexts/     # React context providers
│   ├── prompts/      # AI prompt templates
│   ├── tools/        # AI tool definitions for file operations
│   └── transform/    # Code transformation utilities
└── middleware.ts     # Next.js middleware for auth
```

### Key Components

#### Chat Interface (`src/components/chat/`)
- **ChatInterface.tsx** - Main chat container with resizable panels
- **MessageList.tsx** - Displays conversation history
- **MessageInput.tsx** - Text input with submission handling
- **MarkdownRenderer.tsx** - Renders AI responses with syntax highlighting

#### File System (`src/components/editor/`)
- **FileTree.tsx** - Tree view of virtual files with CRUD operations
- **CodeEditor.tsx** - Monaco editor integration for file editing

#### Preview System (`src/components/preview/`)
- **PreviewFrame.tsx** - Sandboxed iframe for component rendering

### Database Schema

The database schema is defined in `prisma/schema.prisma` - reference this file anytime you need to understand the structure of data stored in the database.

The application uses a simple two-table schema:

- **User** - Authentication and user management  
- **Project** - Stores project metadata, chat messages (JSON), and file data (JSON)

### Development Workflow

1. **Setup**: Run `npm run setup` to initialize database and dependencies
2. **Development**: Use `npm run dev` for hot-reload development
3. **Testing**: Write tests in `__tests__` directories, run with `npm run test`
4. **Database Changes**: Modify `prisma/schema.prisma`, then run `npx prisma migrate dev`
5. **AI Integration**: Configure `ANTHROPIC_API_KEY` in `.env` (optional - falls back to static responses)

### Important Notes

#### Core Architecture
- The virtual file system is the core abstraction - all file operations go through `VirtualFileSystem` class
- AI responses contain tool calls that directly manipulate the file system via structured JSON
- Components are rendered in an isolated iframe to prevent interference with the main application
- Authentication is optional - anonymous users can use the application with limited persistence

#### File System Behavior
- Files exist only in memory during development - no disk writes except for database persistence
- Project data (files + chat messages) is serialized to JSON in the database
- Preview updates happen automatically when files change in the virtual file system

#### Development Guidelines
- Generated Prisma client outputs to `src/generated/prisma` (do not edit manually)
- Tests use jsdom environment for React component testing
- Environment variable `ANTHROPIC_API_KEY` is optional - fallback responses provided without it