# Package Management System

## Overview

This is a full-stack web application for managing package logistics and deliveries. The system supports three distinct user roles (admin, logist, client) with role-based access control and a comprehensive package tracking workflow. Built with modern web technologies, it provides a responsive interface for managing packages from creation to delivery.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **File Uploads**: Multer for multipart/form-data handling
- **Development**: Hot module replacement with Vite middleware

### Database Schema
- **Users**: Role-based system (admin, logist, client) with Replit Auth integration
- **Logists**: Location-based service providers with delivery capabilities
- **Packages**: Complex status workflow with tracking and file attachments
- **Notifications**: Real-time user notifications system
- **Messages**: Package-specific communication channel
- **Sessions**: Secure session storage for authentication

## Key Components

### Authentication System
- **Dual Authentication**: Supports both Replit OAuth and demo login for testing
- **Demo Credentials**: admin@package.ru/123456, client@package.ru/123456, logist@package.ru/123456
- **Session Storage**: PostgreSQL-backed sessions with 1-week TTL
- **Role Management**: Three-tier system (admin, logist, client)
- **Security**: HTTP-only cookies with secure flags
- **Role Switching**: Easy switching between user roles for testing and demonstration

### Package Management
- **Status Workflow**: 15+ distinct package states from creation to delivery
- **File Handling**: Support for images, videos, and documents with 50MB limit
- **Tracking**: Unique package numbers with detailed history
- **Multi-party Communication**: Messages between clients, logists, and admins

### User Interface
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Library**: Comprehensive UI components from Radix UI
- **Real-time Updates**: Query invalidation for live data synchronization
- **Role-based Views**: Distinct interfaces for each user type

### File Management
- **Upload System**: Secure file uploads with type validation
- **Storage**: Local filesystem with UUID-based naming
- **Validation**: File type and size restrictions
- **Integration**: Attached to packages for proof and shipping documents

## Data Flow

### Authentication Flow
1. User initiates login via Replit Auth
2. OpenID Connect validates credentials
3. User session created in PostgreSQL
4. Role-based redirection to appropriate dashboard

### Package Creation Flow
1. Client selects logist and fills package details
2. Package created with "created_client" status
3. Notification sent to assigned logist
4. Admin can review and approve package

### Package Status Updates
1. Status changes trigger database updates
2. Notifications sent to relevant parties
3. Real-time UI updates via query invalidation
4. History tracking for audit purposes

### File Upload Flow
1. Client/logist uploads proof documents
2. Files validated and stored securely
3. Package status updated automatically
4. Notifications sent to stakeholders

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Headless UI components
- **bcryptjs**: Password hashing (if needed)
- **jsonwebtoken**: JWT token handling
- **multer**: File upload handling

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution
- **tailwindcss**: Utility-first CSS framework
- **@types/***: TypeScript definitions

### Authentication Dependencies
- **openid-client**: OpenID Connect client
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server to `dist/index.js`
- **Static Assets**: Served from built frontend directory

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable
- **Authentication**: Optional `REPL_ID` for OpenID (falls back to demo login)
- **Session**: Optional `SESSION_SECRET` (has fallback default)
- **File Storage**: Local filesystem with configurable upload directory
- **Production Ready**: System works without Replit-specific environment variables

### Development Setup
- **Hot Reload**: Vite dev server with Express middleware
- **Database**: Drizzle migrations for schema management
- **Authentication**: Replit Auth integration for seamless development

## Changelog
- July 08, 2025. Initial setup
- July 08, 2025. Completed migration from Replit Agent to Replit environment with PostgreSQL database setup, dependency installation, and SelectItem value fixes
- July 08, 2025. Implemented dual authentication system supporting both Replit OAuth and demo login with test credentials for easy role switching. Added logout functionality and resolved environment variable issues.
- July 08, 2025. Fixed OpenID client deployment error by making Replit OAuth conditional. System now works in production without REPL_ID/OpenID requirements, falling back to demo credentials only.
- January 11, 2025. Added comprehensive registration system for clients and logists with full form validation. Implemented all 15+ package status workflow according to ТЗ specifications. Created enhanced package management with role-based views and actions. Added FAQ page, comprehensive UI components (Progress, Accordion, Checkbox, Label), and improved package status tracking with visual progress indicators. System now fully operational with complete workflow functionality.
- January 11, 2025. Implemented detailed technical specifications per ТЗ requirements. Updated status system to simplified 11-status workflow (created, sent_to_logist, received_by_logist, logist_confirmed, info_sent_to_client, confirmed_by_client, awaiting_payment, awaiting_processing, awaiting_shipping, shipped, paid). Created comprehensive client interface with two-tab layout (logists selection and package management). Added role-based status display utilities and package creation modal with full form validation. Fixed authentication issues and database schema updates.
- January 11, 2025. Completed full migration from Replit Agent to Replit environment. Redesigned manager interface with comprehensive management capabilities including user management, notification system, and mandatory workflow actions. Redesigned logist interface with simplified single-tab view showing only relevant package information and required actions. Fixed all SelectItem value prop issues. System now fully compliant with ТЗ requirements.

## User Preferences

Preferred communication style: Simple, everyday language.