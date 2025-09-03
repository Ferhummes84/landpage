# Overview

This is a full-stack web application built with Express.js backend and React frontend for user registration and file upload functionality. The application appears to be for a company called "CLEANNET" and provides a registration form followed by a file upload interface. The system integrates with external webhooks and uses PostgreSQL with Drizzle ORM for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Comprehensive component system using Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Design System**: Custom component library with consistent styling patterns and accessibility features

## Backend Architecture
- **Framework**: Express.js with TypeScript for API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod for runtime type checking and validation
- **File Handling**: Multer for file upload processing with 10MB size limits
- **Development**: Hot reload support with tsx and Vite integration

## Data Storage
- **Database**: PostgreSQL configured through Drizzle ORM
- **Schema Design**: Three main entities - users, registrations, and uploads
- **Connection**: Uses Neon Database serverless driver for PostgreSQL connectivity
- **Migrations**: Drizzle Kit for database schema management and migrations
- **Session Storage**: connect-pg-simple for PostgreSQL-backed session storage

## Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL store
- **Data Validation**: Comprehensive validation using Zod schemas for both client and server
- **Type Safety**: Shared TypeScript types between frontend and backend

## External Dependencies

- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Webhook Integration**: External webhook endpoint at `https://n8n.automabot.net.br/webhook-test/cadastro` for registration notifications
- **UI Components**: Radix UI for accessible component primitives
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Development**: Replit-specific plugins for enhanced development experience
- **File Storage**: Local file system storage in `uploads/` directory with Multer
- **Fonts**: Google Fonts integration (Architects Daughter, DM Sans, Fira Code, Geist Mono)