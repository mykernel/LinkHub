---
title: Project Structure
description: "File organization, naming conventions, and architectural patterns."
inclusion: always
---

# Project Structure

## Directory Organization

```
ops-dashboard/
├── .ai-rules/              # AI agent steering files
├── .git/                   # Git repository
├── dist/                   # Build output (generated)
├── node_modules/           # Dependencies (generated)
├── public/                 # Static assets (if any)
├── server/                 # Backend files (if applicable)
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── *.tsx          # Feature components
│   │   └── theme-*.tsx    # Theme-related components
│   ├── data/              # Static data files
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and types
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── *.config.js            # Configuration files
├── *.json                 # Package and config files
└── *.md                   # Documentation
```

## File Naming Conventions

### Components
- **PascalCase** for component files: `ToolCard.tsx`, `CategoryNav.tsx`
- **kebab-case** for utility components: `theme-toggle.tsx`, `theme-provider.tsx`
- **UI components** in `/ui` subdirectory following shadcn/ui conventions

### Hooks
- **camelCase** starting with "use": `useTools.ts`, `useLocalStorage.ts`
- **Business logic hooks** contain main application state and operations

### Types and Constants
- **camelCase** for files: `types.ts`, `constants.ts`, `utils.ts`
- **UPPERCASE** for constants: `DEFAULT_CATEGORIES`, `STORAGE_KEYS`
- **PascalCase** for TypeScript interfaces: `Tool`, `Category`

### Data Files
- **camelCase** with descriptive names: `defaultTools.json`
- **JSON format** for configuration and seed data

## Component Architecture

### Component Hierarchy
```
App.tsx
├── CategoryNav.tsx          # Left sidebar navigation
├── SearchBar.tsx           # Top search bar
├── ViewModeToggle.tsx      # Grid/list view toggle
├── ThemeToggle.tsx         # Light/dark theme
├── AddToolDialog.tsx       # Tool management modal
├── ToolCard.tsx            # Individual tool cards
└── Pagination.tsx          # Bottom pagination
```

### Component Props Pattern
- **Callback Props**: `onAction` pattern for event handlers
- **Data Props**: Direct data passing for display components
- **State Lifting**: Parent components manage shared state

## State Management Patterns

### Custom Hooks Structure
- **useTools**: Central business logic hook
  - Tool CRUD operations
  - Search and filtering
  - Pagination logic
  - View state management
- **useLocalStorage**: Generic persistence hook
- **useKeyboardShortcuts**: User interaction hook

### Data Flow
1. **App.tsx**: Main state container, renders layout
2. **useTools Hook**: Manages all tool-related state and operations
3. **Components**: Receive props and emit events via callbacks
4. **Local Storage**: Automatic persistence layer

## Asset Organization

### Icons
- **Emoji icons** for categories (📈, 📝, 🚀, etc.)
- **Lucide React** for UI icons (search, menu, etc.)
- **Icon strings** stored in data/constants

### Styles
- **Global styles**: `src/index.css`
- **Component styles**: Tailwind classes inline
- **Theme variables**: CSS custom properties in index.css

## Configuration Files

### Core Config
- `package.json`: Dependencies and scripts
- `vite.config.ts`: Build tool configuration
- `tsconfig.json`: TypeScript settings
- `components.json`: shadcn/ui configuration

### Styling Config
- `tailwind.config.js`: Tailwind customization
- `postcss.config.js`: PostCSS plugins

## Development Patterns

### Component Creation
1. Create `.tsx` file in appropriate directory
2. Export named component with PascalCase
3. Define props interface if needed
4. Use TypeScript for all new components

### Hook Creation
1. Create `.ts` file in `/hooks` directory
2. Start name with "use"
3. Export as named export
4. Include TypeScript return type

### Data Management
1. Define interfaces in `types.ts`
2. Add constants to `constants.ts`
3. Use localStorage for persistence
4. Validate data shape on load

## Import/Export Conventions

### Import Order
1. React and React ecosystem
2. Third-party libraries
3. Local hooks and utilities
4. Local components
5. CSS/asset imports

### Path Aliases
- `@/` maps to `src/` directory
- Absolute imports preferred over relative
- Configured in `vite.config.ts`

### Export Style
- **Named exports** preferred for most files
- **Default exports** only for main components
- Consistent export style within each file type

## Build Output
- **Static files**: HTML, CSS, JS bundles
- **Asset optimization**: Automatic via Vite
- **Type checking**: Integrated in build process
- **No runtime dependencies**: Pure client-side app