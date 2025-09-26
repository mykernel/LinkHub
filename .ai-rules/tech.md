---
title: Technology Stack
description: "Technical architecture, frameworks, tools, and development workflow."
inclusion: always
---

# Technology Stack

## Frontend Framework
- **React 18.3.1**: Modern React with hooks and functional components
- **TypeScript 5.6.2**: Strong typing for better code quality
- **Vite 6.0.1**: Fast build tool and dev server
- **ESM**: ES modules for modern JavaScript

## UI & Styling
- **shadcn/ui**: Modern component library based on Radix UI primitives
  - `@radix-ui/react-dialog`: Modal dialogs
  - `@radix-ui/react-dropdown-menu`: Dropdown menus
  - `@radix-ui/react-select`: Select components
  - `@radix-ui/react-slot`: Composition utilities
  - `@radix-ui/react-toast`: Toast notifications
- **Tailwind CSS 3.4.15**: Utility-first CSS framework
- **Lucide React 0.454.0**: Modern icon library
- **class-variance-authority**: Type-safe component variants
- **clsx & tailwind-merge**: Conditional CSS classes

## State Management
- **React Built-in State**: useState, useEffect, useMemo for local state
- **Custom Hooks**: Centralized business logic
  - `useTools`: Main data management hook
  - `useLocalStorage`: Persistent storage
  - `useKeyboardShortcuts`: Keyboard interaction

## Data Storage
- **localStorage**: Client-side persistence
- **JSON Files**: Default data structure and configuration
- **No Backend Required**: Pure frontend application

## Development Tools
- **ESLint 9.15.0**: Code linting with TypeScript support
- **PostCSS 8.5.0**: CSS processing
- **Autoprefixer 10.4.20**: CSS vendor prefixes

## Build & Deployment
- **Static Deployment**: Builds to static HTML/CSS/JS
- **No Server Required**: Can be deployed to any static hosting

## Key Architecture Patterns

### Component Structure
```
src/
├── components/
│   ├── ui/              # Reusable UI components (shadcn)
│   ├── ToolCard.tsx     # Main tool display component
│   ├── CategoryNav.tsx  # Category navigation
│   ├── SearchBar.tsx    # Search functionality
│   ├── AddToolDialog.tsx # Tool management modal
│   ├── Pagination.tsx   # Data pagination
│   └── theme-*.tsx      # Theme management
├── hooks/
│   ├── useTools.ts      # Main business logic
│   ├── useLocalStorage.ts # Data persistence
│   └── useKeyboardShortcuts.ts # User interaction
├── lib/
│   ├── types.ts         # TypeScript interfaces
│   ├── constants.ts     # App configuration
│   └── utils.ts         # Utility functions
└── data/
    └── defaultTools.json # Default tool data
```

### Data Flow
1. **useTools Hook**: Central state management for all tool operations
2. **Local Storage**: Automatic persistence of user data
3. **Component Props**: Unidirectional data flow
4. **Event Handlers**: User actions bubble up through callbacks

### TypeScript Interfaces
```typescript
interface Tool {
  id: string
  name: string
  url: string
  category: string
  description?: string
  icon?: string
  clickCount: number
  lastAccessed: Date
  createdAt: Date
  isPinned: boolean
  pinnedPosition?: number
}
```

## Development Workflow
```bash
# Development
npm run dev          # Start dev server (Vite)

# Production
npm run build        # TypeScript compilation + Vite build
npm run preview      # Preview production build

# Code Quality
npm run lint         # ESLint checking
```

## Configuration Files
- `vite.config.ts`: Build configuration with path aliases
- `tailwind.config.js`: Styling system configuration
- `components.json`: shadcn/ui setup
- `tsconfig.json`: TypeScript compilation settings
- `postcss.config.js`: CSS processing setup

## Performance Considerations
- **Lazy Loading**: Components loaded on demand
- **Memoization**: useMemo for expensive calculations
- **Pagination**: Large datasets split into pages
- **Local Storage**: Cached data for fast loading
- **Efficient Re-renders**: Proper dependency arrays in hooks