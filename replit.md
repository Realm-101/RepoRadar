# Overview

RepoRadar is a full-stack web application that provides AI-powered analysis of GitHub repositories. The platform helps users discover, analyze, and compare repositories based on key metrics including originality, completeness, marketability, monetization potential, and usefulness. Built with modern web technologies, it leverages Google's Gemini 2.5 Pro AI for comprehensive repository insights and includes features like advanced analytics, code review, integrations, and developer tools.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with support for both authenticated and public routes
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS styling
- **State Management**: React Query for server state management and caching
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes
- **Icons**: Font Awesome and Lucide React icons
- **Charts**: Recharts for data visualization including radar charts, bar charts, and line charts

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit OIDC authentication with session management
- **File Upload**: Static file serving for assets
- **API Design**: RESTful API with structured error handling and logging middleware

## AI Integration
- **Primary AI**: Google Gemini 2.5 Pro for repository analysis and AI assistant functionality
- **Analysis Engine**: Comprehensive repository evaluation across 5 key metrics with detailed scoring explanations
- **AI Assistant**: Context-aware help system with holographic UI design
- **Code Review**: AI-powered code analysis with security vulnerability detection

## Data Storage
- **Primary Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle with automatic migrations and type-safe queries
- **Session Storage**: PostgreSQL-backed session store with configurable TTL
- **Schema**: Comprehensive database schema supporting users, repositories, analyses, collections, teams, and more

## Authentication & Authorization
- **Provider**: Replit OIDC with OpenID Connect
- **Session Management**: Express sessions with secure HTTP-only cookies
- **Access Control**: Route-level authentication middleware with graceful fallback for public features
- **User Management**: Profile management with subscription tiers and API key generation

## External Dependencies

- **GitHub API**: Repository data fetching and search functionality
- **Google Gemini AI**: Advanced AI analysis and natural language processing
- **Stripe**: Payment processing for Pro and Enterprise subscriptions with webhook handling
- **PayPal**: Alternative payment processing option
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Auth**: OIDC authentication provider with session management
- **Chart Libraries**: Recharts for data visualization and analytics dashboards
- **Email Services**: Integration capabilities for notifications and webhooks