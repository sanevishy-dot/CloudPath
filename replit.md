# Informatica Migration Tool

## Overview

This is a comprehensive web application designed to migrate PowerCenter workflows to Informatica Cloud with automated assessment and real-time repository integration. The tool provides a dashboard-driven interface for managing migration projects, analyzing PowerCenter objects, and tracking migration progress with automated assessment capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 19** with TypeScript for type-safe component development
- **Wouter** for lightweight client-side routing instead of React Router
- **Vite** as the build tool and development server for fast hot module replacement
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling and data validation
- **Tailwind CSS** with custom CSS variables for consistent theming and dark mode support
- **Radix UI** components for accessible, unstyled UI primitives

### Backend Architecture
- **Express.js** server with TypeScript for API endpoints
- **CORS** enabled for cross-origin requests
- **In-memory storage** abstraction with interface-based design for easy database swapping
- **Vite middleware integration** for development mode serving both frontend and backend
- Modular route structure with dedicated services for PowerCenter integration

### Data Management
- **Drizzle ORM** with PostgreSQL schema definitions for type-safe database operations
- **Zod schemas** for runtime data validation and TypeScript type generation
- **drizzle-zod** integration for seamless schema-to-validation pipeline
- Memory-based storage implementation with full CRUD operations for all entities

### Component Architecture
- **Atomic design principles** with reusable UI components in `/components/ui/`
- **Custom hook patterns** for toast notifications and shared logic
- **Responsive design** with mobile-first approach using Tailwind breakpoints
- **Theme system** with CSS custom properties for light/dark mode switching

### PowerCenter Integration
- **XML parsing** with xml2js for PowerCenter metadata extraction
- **Command-line integration** for pmrep utility execution
- **REST API support** for modern PowerCenter repository connections
- **Complexity analysis** engine for automated migration assessment

### State Management Strategy
- **Server state** managed by TanStack Query with automatic caching and invalidation
- **Client state** managed by React hooks and component state
- **Form state** handled by React Hook Form with Zod validation
- **Theme state** persisted to localStorage with system preference detection

## External Dependencies

### Core Frontend Libraries
- **@tanstack/react-query** - Server state management and caching
- **wouter** - Minimal client-side routing
- **react-hook-form** - Form state management
- **@hookform/resolvers** - Form validation resolvers
- **zod** - Schema validation and TypeScript type generation

### UI Component System
- **@radix-ui/react-*** - Accessible, unstyled UI primitives (dialog, select, tabs, toast, etc.)
- **lucide-react** - Icon library with consistent design
- **class-variance-authority** - Type-safe CSS class variant generation
- **tailwind-merge** - Intelligent Tailwind class merging utility

### Backend Services
- **express** - Web application framework
- **cors** - Cross-origin resource sharing middleware
- **drizzle-orm** - Type-safe ORM for database operations
- **drizzle-zod** - Integration between Drizzle and Zod schemas

### PowerCenter Integration
- **xml2js** - XML parsing for PowerCenter metadata
- **node-fetch** - HTTP client for REST API calls
- **uuid** - Unique identifier generation
- **node-cron** - Scheduled task execution for sync operations

### Development Tools
- **vite** - Build tool and development server
- **typescript** - Static type checking
- **tailwindcss** - Utility-first CSS framework
- **autoprefixer** - CSS vendor prefixing
- **@vitejs/plugin-react** - React integration for Vite

### Communication
- **ws** - WebSocket library for real-time updates
- **node-fetch** - HTTP client for external API calls

Note: The application uses Drizzle ORM with PostgreSQL schema definitions but may not have PostgreSQL configured yet. The current implementation uses in-memory storage that can be easily replaced with a PostgreSQL database connection.