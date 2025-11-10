# TaskFlow - Module Design Document

## Table of Contents
1. [Overview](#overview)
2. [Architecture Overview](#architecture-overview)
3. [Backend Modules](#backend-modules)
4. [Frontend Modules](#frontend-modules)
5. [Database Modules](#database-modules)
6. [Integration & Infrastructure](#integration--infrastructure)
7. [Module Dependencies](#module-dependencies)
8. [Data Flow](#data-flow)
9. [API Design](#api-design)

---

## Overview

TaskFlow is a full-stack task management application built with a modular architecture. The system follows a three-tier architecture pattern with clear separation between presentation, business logic, and data layers.

**Key Principles:**
- **Separation of Concerns**: Each module has a single, well-defined responsibility
- **Modularity**: Components can be developed, tested, and maintained independently
- **Scalability**: Architecture supports horizontal scaling and feature extensions
- **Type Safety**: TypeScript ensures type safety across all modules

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │   Services   │     │
│  │   Module     │  │   Module     │  │   Module     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Server     │  │   Routes     │  │   Database   │     │
│  │   Module     │  │   Module     │  │   Module     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            │
┌─────────────────────────────────────────────────────────────┐
│                        Database Layer                        │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  PostgreSQL  │  │   SQLite     │                        │
│  │  (Production)│  │  (Development)                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Modules

### 1. Server Module (`server.ts`)

**Purpose**: Application entry point and HTTP server configuration

**Responsibilities:**
- Initialize Express application
- Configure middleware (CORS, JSON parsing)
- Register API routes
- Start HTTP server
- Health check endpoint

**Key Components:**
- Express application instance
- Port configuration (default: 4000)
- CORS middleware with configurable origins
- Route registration for tasks and categories

**Dependencies:**
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `./tasks` - Tasks router
- `./categories` - Categories router

**API Endpoints:**
- `GET /api/health` - Health check endpoint

---

### 2. Database Module (`db.ts`)

**Purpose**: Database abstraction layer supporting both PostgreSQL and SQLite

**Responsibilities:**
- Database connection management
- Schema initialization
- Query execution abstraction
- Data seeding for development
- Database type detection (PostgreSQL vs SQLite)

**Key Components:**

#### Database Connection
- **PostgreSQL**: Uses connection pooling via `pg` library
- **SQLite**: Uses `better-sqlite3` for local development
- Automatic detection based on `DATABASE_URL` environment variable

#### Schema Management
- **Users Table**: User authentication and profile data
- **Tasks Table**: Task management data
- **Categories Table**: Task categorization
- **Indexes**: Performance optimization indexes

#### Query Interface
```typescript
query<T>(sql: string, params?: any[]): Promise<{ rows: T[] }>
```
- Unified query interface for both database types
- Parameterized query support
- Automatic parameter conversion ($1 → ? for SQLite)
- RETURNING clause handling for INSERT/UPDATE operations

**Features:**
- Dual database support (PostgreSQL/SQLite)
- Automatic schema migration
- Seed data initialization
- Transaction support (SQLite)
- Connection pooling (PostgreSQL)

**Dependencies:**
- `pg` - PostgreSQL client
- `better-sqlite3` - SQLite database
- `dotenv` - Environment configuration

---

### 3. Tasks Router Module (`tasks.ts`)

**Purpose**: RESTful API endpoints for task management

**Responsibilities:**
- Task CRUD operations
- Task filtering and querying
- Task status management
- Task priority management

**API Endpoints:**

#### `GET /api/tasks`
- **Purpose**: Retrieve all tasks for a user
- **Query Parameters**: `userId` (default: 1)
- **Response**: Array of task objects
- **Status Codes**: 200 OK

#### `POST /api/tasks`
- **Purpose**: Create a new task
- **Request Body**: 
  ```json
  {
    "userId": 1,
    "title": "Task title",
    "description": "Task description",
    "status": "todo",
    "priority": "medium",
    "due_date": "2024-01-01T00:00:00Z",
    "category": "Work"
  }
  ```
- **Response**: Created task object
- **Status Codes**: 201 Created

#### `PATCH /api/tasks/:id`
- **Purpose**: Update an existing task
- **Request Body**: Partial task object (any fields to update)
- **Response**: Updated task object
- **Status Codes**: 200 OK, 400 Bad Request

#### `DELETE /api/tasks/:id`
- **Purpose**: Delete a task
- **Status Codes**: 204 No Content

**Task Model:**
```typescript
{
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**Dependencies:**
- `express` - Router creation
- `./db` - Database query interface

---

### 4. Categories Router Module (`categories.ts`)

**Purpose**: RESTful API endpoints for category management

**Responsibilities:**
- Category CRUD operations
- User-scoped category management
- Category uniqueness enforcement

**API Endpoints:**

#### `GET /api/categories`
- **Purpose**: Retrieve all categories for a user
- **Query Parameters**: `userId` (default: 1)
- **Response**: Array of category objects
- **Status Codes**: 200 OK

#### `POST /api/categories`
- **Purpose**: Create a new category
- **Request Body**: 
  ```json
  {
    "userId": 1,
    "name": "Category Name"
  }
  ```
- **Response**: Created category object
- **Status Codes**: 201 Created

#### `DELETE /api/categories/:id`
- **Purpose**: Delete a category
- **Status Codes**: 204 No Content

**Category Model:**
```typescript
{
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}
```

**Dependencies:**
- `express` - Router creation
- `./db` - Database query interface

---

## Frontend Modules

### 1. Application Core Module (`App.tsx`)

**Purpose**: Application root component and provider setup

**Responsibilities:**
- Application routing configuration
- Global state management providers
- UI provider setup (Toast, Tooltip)
- React Query client configuration

**Key Components:**
- `QueryClientProvider` - Server state management
- `BrowserRouter` - Client-side routing
- `TooltipProvider` - Tooltip context
- `Toaster` components - Toast notifications

**Dependencies:**
- `@tanstack/react-query` - Data fetching
- `react-router-dom` - Routing
- `@/components/ui/*` - UI components

---

### 2. Pages Module

#### 2.1 Index Page (`pages/Index.tsx`)

**Purpose**: Main entry point and authentication routing

**Responsibilities:**
- Authentication state management
- Session validation
- Backend health check
- Conditional rendering (AuthForm vs Dashboard)

**Features:**
- Supabase authentication integration
- Loading state management
- Automatic session restoration

**Dependencies:**
- `@/integrations/supabase/client` - Authentication
- `@/lib/api` - API health check
- `@/components/AuthForm` - Login component
- `@/components/Dashboard` - Main application

---

#### 2.2 NotFound Page (`pages/NotFound.tsx`)

**Purpose**: 404 error handling

**Responsibilities:**
- Display not found message
- Navigation back to home

---

### 3. Components Module

#### 3.1 Dashboard Component (`components/Dashboard.tsx`)

**Purpose**: Main application interface for task management

**Responsibilities:**
- Task list display and management
- Task filtering and sorting
- Task creation and editing
- Bulk operations
- View mode switching (List, Calendar, Gantt)
- Analytics display

**Features:**
- **Task Management**: CRUD operations
- **Filtering**: Search, status, priority, category filters
- **Sorting**: Multiple sort options (created, due date, priority)
- **Bulk Operations**: Multi-select, bulk complete, bulk delete
- **View Modes**: List view, Calendar view, Gantt view
- **Analytics**: Task completion statistics, overdue count
- **Theme Toggle**: Dark/Light mode
- **Celebration Effects**: Confetti on task completion

**State Management:**
- Task list state
- Filter states (search, status, priority, category)
- Selected tasks for bulk operations
- Dialog open/close states
- View mode state

**Dependencies:**
- `@/lib/api` - API functions
- `@/components/TaskCard` - Task display component
- `@/components/TaskDialog` - Task creation/editing
- `@/components/TaskFilters` - Filter controls
- `@/components/ConfettiBurst` - Celebration effect

---

#### 3.2 TaskCard Component (`components/TaskCard.tsx`)

**Purpose**: Individual task display card

**Responsibilities:**
- Task information display
- Task status visualization
- Inline editing
- Task actions (edit, delete, complete)
- Selection state management

**Features:**
- Priority badge display
- Status indicator
- Due date display
- Category tag
- Inline title/description editing
- Quick action buttons

---

#### 3.3 TaskDialog Component (`components/TaskDialog.tsx`)

**Purpose**: Task creation and editing form

**Responsibilities:**
- Task form rendering
- Form validation
- Data submission
- Field management (title, description, status, priority, due date, category)

**Features:**
- React Hook Form integration
- Zod validation
- Date picker for due dates
- Category selection
- Priority and status selection

**Dependencies:**
- `react-hook-form` - Form management
- `zod` - Schema validation
- `@hookform/resolvers` - Form validation integration

---

#### 3.4 TaskFilters Component (`components/TaskFilters.tsx`)

**Purpose**: Task filtering and sorting controls

**Responsibilities:**
- Search input
- Status filter dropdown
- Priority filter dropdown
- Category filter dropdown
- Sort options

**Features:**
- Real-time search filtering
- Multi-criteria filtering
- Sort by: created date, due date, priority

---

#### 3.5 AuthForm Component (`components/AuthForm.tsx`)

**Purpose**: User authentication interface

**Responsibilities:**
- Login form display
- Sign-up form display
- Authentication submission
- Form validation

**Dependencies:**
- `@/integrations/supabase/client` - Authentication service

---

#### 3.6 ConfettiBurst Component (`components/ConfettiBurst.tsx`)

**Purpose**: Celebration animation on task completion

**Responsibilities:**
- Trigger confetti animation
- Animation timing control

---

#### 3.7 UI Components Module (`components/ui/`)

**Purpose**: Reusable UI component library (shadcn/ui)

**Components:**
- **Layout**: Button, Card, Separator, Container
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Overlays**: Dialog, Alert Dialog, Popover, Tooltip, Toast
- **Navigation**: Tabs, Accordion, Breadcrumb, Menu
- **Data Display**: Badge, Avatar, Table, Chart
- **Feedback**: Alert, Progress, Skeleton
- **Utilities**: Scroll Area, Calendar, Command Palette

**Design System:**
- Tailwind CSS based
- Dark mode support
- Accessible (ARIA compliant)
- Customizable via CSS variables

---

### 4. Services Module (`lib/`)

#### 4.1 API Service (`lib/api.ts`)

**Purpose**: Backend API communication layer

**Responsibilities:**
- HTTP request abstraction
- API endpoint definitions
- Request/response type definitions
- Error handling

**Functions:**

##### `healthcheck(): Promise<boolean>`
- Checks backend API availability
- Returns boolean indicating health status

##### `getTasks(): Promise<ApiTask[]>`
- Fetches all tasks for the current user
- Returns array of task objects

##### `createTask(payload: Partial<ApiTask>): Promise<ApiTask>`
- Creates a new task
- Returns created task object

##### `updateTask(id: number, payload: Partial<ApiTask>): Promise<ApiTask>`
- Updates an existing task
- Returns updated task object

##### `deleteTask(id: number): Promise<void>`
- Deletes a task by ID

**Type Definitions:**
```typescript
type ApiTask = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  category?: string | null;
}
```

---

#### 4.2 Utils Service (`lib/utils.ts`)

**Purpose**: Utility functions and helpers

**Responsibilities:**
- Common utility functions
- Class name merging (clsx + tailwind-merge)
- Helper functions for common operations

---

### 5. Hooks Module (`hooks/`)

#### 5.1 useToast Hook (`hooks/use-toast.ts`)

**Purpose**: Toast notification management

**Responsibilities:**
- Toast state management
- Toast display control
- Toast variant handling

---

#### 5.2 useMobile Hook (`hooks/use-mobile.tsx`)

**Purpose**: Responsive design detection

**Responsibilities:**
- Screen size detection
- Mobile/desktop breakpoint detection

---

### 6. Integrations Module (`integrations/`)

#### 6.1 Supabase Integration (`integrations/supabase/`)

**Purpose**: Supabase client configuration

**Components:**
- `client.ts` - Supabase client initialization
- `types.ts` - TypeScript type definitions

**Note**: Currently configured but using SQL backend for data operations

---

## Database Modules

### 1. Schema Definition (`database/schema.sql`)

**Purpose**: Database schema definition for PostgreSQL

**Tables:**

#### Users Table
```sql
CREATE TABLE users (
  id              BIGSERIAL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(120),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Categories Table
```sql
CREATE TABLE categories (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(80) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_unique_per_user UNIQUE (user_id, name)
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(160) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'todo',
  priority        VARCHAR(20) NOT NULL DEFAULT 'medium',
  category        VARCHAR(80),
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Constraints:**
- Status: `todo`, `in_progress`, `done`, `completed`
- Priority: `low`, `medium`, `high`, `urgent`
- Foreign key constraints with CASCADE delete
- Unique constraints (email, user_id + category name)

**Indexes:**
- `idx_tasks_user_id` - User-based task queries
- `idx_tasks_status` - Status filtering
- `idx_tasks_priority` - Priority sorting
- `idx_tasks_due_date` - Due date queries
- `idx_categories_user_id` - User-based category queries

**Triggers:**
- `trg_tasks_updated_at` - Auto-update `updated_at` timestamp on task updates

**Views:**
- `user_task_status_counts` - Task counts per status per user

---

### 2. Initialization Script (`database/init.sql`)

**Purpose**: Database initialization for Docker containers

**Responsibilities:**
- Schema creation
- Initial data seeding
- Permission setup

---

### 3. Seed Data (`database/seed.sql`)

**Purpose**: Sample data for development and testing

**Content:**
- Demo user account
- Sample categories
- Sample tasks with various statuses and priorities

---

## Integration & Infrastructure

### 1. Docker Module

#### 1.1 Docker Compose (`docker-compose.yml`)

**Purpose**: Multi-container orchestration

**Services:**
- **Database**: PostgreSQL 15 Alpine
- **Backend**: Node.js 20 Alpine
- **Frontend**: Nginx Alpine

**Networks:**
- `taskflow-network` - Bridge network for service communication

**Volumes:**
- `postgres_data` - Persistent database storage

---

#### 1.2 Backend Dockerfile (`backend/Dockerfile`)

**Purpose**: Backend container image definition

**Stages:**
- **Builder**: Install dependencies and build TypeScript
- **Production**: Runtime image with compiled code

**Features:**
- Multi-stage build for optimization
- Native module compilation support
- Health check configuration

---

#### 1.3 Frontend Dockerfile (`frontend/Dockerfile`)

**Purpose**: Frontend container image definition

**Stages:**
- **Builder**: Install dependencies and build React application
- **Production**: Nginx serving static files

**Features:**
- Multi-stage build
- Nginx configuration for SPA routing
- API proxy configuration

---

#### 1.4 Nginx Configuration (`frontend/nginx.conf`)

**Purpose**: Web server configuration

**Features:**
- SPA routing support (fallback to index.html)
- API proxy to backend service
- Header configuration for proxying

---

## Module Dependencies

### Backend Dependency Graph

```
server.ts
├── express
├── cors
├── dotenv
├── tasks.ts
│   ├── express
│   └── db.ts
│       ├── pg (PostgreSQL)
│       └── better-sqlite3 (SQLite)
└── categories.ts
    ├── express
    └── db.ts
```

### Frontend Dependency Graph

```
App.tsx
├── @tanstack/react-query
├── react-router-dom
└── pages/Index.tsx
    ├── @/integrations/supabase
    ├── @/lib/api
    └── components/Dashboard.tsx
        ├── @/lib/api
        ├── components/TaskCard.tsx
        ├── components/TaskDialog.tsx
        ├── components/TaskFilters.tsx
        └── components/ConfettiBurst.tsx
```

---

## Data Flow

### Task Creation Flow

```
1. User Input (TaskDialog)
   ↓
2. Form Validation (Zod schema)
   ↓
3. API Call (lib/api.ts → createTask)
   ↓
4. HTTP Request (POST /api/tasks)
   ↓
5. Backend Router (tasks.ts)
   ↓
6. Database Query (db.ts → query)
   ↓
7. Database Insert (PostgreSQL/SQLite)
   ↓
8. Response (Task object)
   ↓
9. UI Update (Dashboard refresh)
```

### Task Retrieval Flow

```
1. Component Mount (Dashboard)
   ↓
2. API Call (lib/api.ts → getTasks)
   ↓
3. HTTP Request (GET /api/tasks)
   ↓
4. Backend Router (tasks.ts)
   ↓
5. Database Query (db.ts → query)
   ↓
6. SQL SELECT (PostgreSQL/SQLite)
   ↓
7. Response (Array of tasks)
   ↓
8. State Update (React state)
   ↓
9. UI Render (TaskCard components)
```

---

## API Design

### Base URL
- Development: `http://localhost:4000/api`
- Production: Configured via environment variables

### Endpoint Structure

```
/api
├── /health          (GET)    - Health check
├── /tasks           (GET)    - List tasks
│                     (POST)   - Create task
├── /tasks/:id       (PATCH)  - Update task
│                     (DELETE) - Delete task
└── /categories      (GET)    - List categories
                      (POST)   - Create category
    /categories/:id  (DELETE) - Delete category
```

### Request/Response Format

**Request Headers:**
```
Content-Type: application/json
```

**Response Format:**
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Task title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "category": "Work",
  "due_date": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Error Handling

**Error Response Format:**
```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Module Communication Patterns

### 1. Request-Response Pattern
- Frontend → Backend: HTTP REST API
- Backend → Database: SQL queries

### 2. State Management Pattern
- **Client State**: React useState/useReducer
- **Server State**: React Query (TanStack Query)
- **Form State**: React Hook Form

### 3. Error Handling Pattern
- **API Errors**: Try-catch with toast notifications
- **Validation Errors**: Zod schema validation
- **Network Errors**: Fetch error handling

---

## Future Module Extensions

### Potential Additions:
1. **Authentication Module**: JWT-based authentication
2. **Notification Module**: Real-time notifications (WebSocket)
3. **File Upload Module**: Task attachment support
4. **Search Module**: Full-text search with Elasticsearch
5. **Analytics Module**: Advanced task analytics and reporting
6. **Collaboration Module**: Team task sharing and comments
7. **Export Module**: Task export (PDF, CSV, JSON)
8. **Import Module**: Task import from external sources

---

## Module Testing Strategy

### Unit Testing
- Individual component testing
- Utility function testing
- API endpoint testing

### Integration Testing
- API integration tests
- Database integration tests
- Component integration tests

### End-to-End Testing
- User workflow testing
- Cross-browser testing

---

## Conclusion

This modular design provides:
- **Clear separation of concerns** across all layers
- **Scalable architecture** supporting future enhancements
- **Type-safe development** with TypeScript throughout
- **Flexible deployment** with Docker containerization
- **Maintainable codebase** with well-defined module boundaries

Each module is designed to be independently testable, maintainable, and extensible, following modern software engineering best practices.

