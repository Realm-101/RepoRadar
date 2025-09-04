# RepoRadar

## Overview

RepoRadar is a full-stack web application that provides AI-powered analysis of GitHub repositories. The platform helps users discover, analyze, and compare repositories based on key metrics including originality, completeness, marketability, monetization potential, and usefulness. Built with a modern React frontend and Express.js backend, it leverages Google's Gemini 2.5 Pro AI model to provide comprehensive repository insights.

## Recent Changes (July 2025)

### Features 12-15 Completed (July 16, 2025)
- **Feature 12: API Access & Developer Tools**
  - Built comprehensive Developer API page with API key management
  - Implemented RESTful API endpoints for programmatic access
  - Created webhook configuration system
  - Added detailed API documentation with code examples
  - Enabled rate limiting based on subscription tiers

- **Feature 13: Advanced Analytics Dashboard**  
  - Created sophisticated analytics visualization with multiple chart types
  - Implemented time series analysis and trend predictions
  - Added language distribution and performance metrics
  - Built AI-powered insights generation
  - Created activity heatmaps and correlation analysis
  - Added export functionality for analytics data

- **Feature 14: Integration Hub**
  - Developed comprehensive integration platform supporting 8+ services
  - Built connectors for GitHub, GitLab, Slack, Discord, Jira, and CI/CD tools
  - Implemented secure OAuth and webhook-based integrations
  - Created categorized integration management interface
  - Added real-time integration activity monitoring

- **Feature 15: AI-Powered Code Review**
  - Built AI code review system with comprehensive analysis
  - Implemented security vulnerability detection
  - Added code quality metrics and complexity analysis  
  - Created issue categorization with severity levels
  - Built suggestions for improvements and best practices
  - Added support for both repository and snippet analysis

## Recent Changes (July 2025)
- Fixed routing issue where analyzing repositories redirected to home page
- Implemented "Find Similar" functionality with AI-powered similarity matching
- Added direct repository ID passing to avoid re-analysis of existing repos
- Made all analysis features available to both authenticated and non-authenticated users
- Enhanced error handling and debugging for better user experience
- Added comprehensive documentation section with 6 detailed sections (Overview, Analysis Metrics, Features Guide, API Reference, FAQ, Changelog)
- Implemented AI Assistant with unique holographic interface design
- Created floating AI help button with animated holographic popup
- Integrated AI assistant trained on documentation for context-aware help
- Added Docs navigation to header for easy access
- Built comprehensive monetization system with tiered subscription plans
- Implemented Stripe payment integration for Pro ($19/month) and Enterprise ($99/month) plans
- Added user subscription management with database schema updates
- Created pricing page with feature comparison and upgrade flows
- Built checkout system with Stripe Elements integration
- Added payment success page with subscription confirmation
- **Completed Intelligent User Profiles for Pro/Enterprise users:**
  - Added database schema with 7 new tables (bookmarks, tags, collections, etc.)
  - Implemented comprehensive profile management with tabbed interface
  - Built AI-powered repository recommendations using Gemini 2.5 Pro
  - Created bookmarks system for quick repository access
  - Added custom tags for repository categorization
  - Implemented collections for organizing related repositories
  - Built preferences system for personalized experience
  - Added activity tracking for better recommendations
  - Protected all profile features with subscription tier checks
- **Enhanced Analysis Display (July 2025):**
  - Added detailed explanations for all metrics with reasoning
  - Implemented WHY explanations for scores with supporting evidence
  - Added impact analysis for weaknesses and recommendations
  - Created expected outcomes for all recommendations
  - Built backwards-compatible enhanced analytics display
  - **Fixed all TypeScript compilation errors in PDF export functionality**
- **Implemented Advanced Search Functionality:**
  - Added comprehensive filtering system with language, stars, date range filters
  - Created advanced sorting options (best match, stars, forks, updated, created)
  - Implemented license filtering and topic-based search
  - Added toggles for archived/forked repositories and open issues
  - Built collapsible filter panel with intuitive UI
  - Created star range slider with min/max controls
- **Created Batch Analysis Feature:**
  - Built batch processing for analyzing multiple repositories simultaneously
  - Added CSV and PDF export functionality for batch results
  - Implemented progress tracking with real-time status updates
  - Created queue management with add/remove capabilities
  - Added tier-based limitations (3 repos for free users, unlimited for Pro)
  - Built comprehensive statistics dashboard for batch operations
- **Updated Comprehensive Documentation (July 2025):**
  - Enhanced overview section with new advanced search and batch analysis features
  - Added detailed features guide sections for advanced search and batch analysis
  - Updated API reference with new endpoints for batch operations and enhanced search
  - Created version 2.3.0 changelog entry documenting all recent improvements
  - Integrated navigation links for batch analysis in header
- **Completed Feature 7: Export Functionality (July 2025):**
  - Created comprehensive export utilities supporting PDF and CSV formats
  - Implemented export for individual analysis results with full metrics
  - Added batch export capability for multiple analysis results
  - Fixed all TypeScript compilation errors related to scoreExplanations
  - Updated batch analysis page to use new centralized export utilities
  - Added export buttons to analysis results component with proper error handling
- **Implemented Interactive Onboarding Tour (Feature 8 - July 2025):**
  - Added 5-step guided tour covering essential features
  - Auto-starts for new users with localStorage tracking
  - Restart option available in profile preferences
  - Smart targeting with fallback for missing elements
- **Added Micro-interactions (Feature 9 - July 2025):**
  - Button scaling and ripple effects on all interactive elements
  - Input focus animations with subtle shadow effects
  - Pulse animation on notification badges
  - Card lift effects with fade-in transitions
  - Created skeleton loader components for loading states
  - Added various animations: bounce, shake, spin, slide-in
- **Improved Navigation UX (July 2025):**
  - Replaced flat navigation with organized dropdown menus
  - Grouped related features under "Discover", "Workspace", and "Resources"
  - Added descriptive icons and explanations for each menu item
  - Enhanced mobile responsiveness with collapsible navigation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interfaces
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API endpoints with structured error handling
- **Session Management**: Express sessions with PostgreSQL storage for persistent user state
- **File Structure**: Monorepo structure with shared schema between client and server

### Authentication System
- **Provider**: Replit OIDC (OpenID Connect) for seamless authentication
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless deployment
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Centralized schema definitions in shared directory
- **Migration Strategy**: Drizzle Kit for database schema migrations
- **Connection Pooling**: Neon serverless connection pooling for optimal performance

### AI Integration
- **AI Provider**: Google Gemini 2.5 Pro for repository analysis
- **Analysis Metrics**: Five-factor scoring system (originality, completeness, marketability, monetization, usefulness)
- **Response Format**: Structured JSON responses with comprehensive insights
- **Rate Limiting**: Built-in request management for API efficiency

### External Service Integrations
- **GitHub API**: Repository data fetching, search functionality, and language analysis
- **Authentication**: Optional GitHub token for increased API rate limits
- **Data Enrichment**: Real-time repository statistics and metadata retrieval

### Development Workflow
- **Development Server**: Concurrent client and server development with Vite HMR
- **Type Safety**: Shared TypeScript definitions between frontend and backend
- **Code Quality**: ESLint and TypeScript strict mode for code consistency
- **Asset Management**: Vite-based asset optimization and bundling

### Deployment Architecture
- **Build Process**: Separate client (Vite) and server (esbuild) build pipelines
- **Production Server**: Node.js with compiled TypeScript for optimal performance
- **Static Assets**: Client build served from Express with proper caching headers
- **Environment Configuration**: Environment-based configuration for different deployment stages

## External Dependencies

### Core AI Services
- **Google Gemini API**: Repository analysis and AI-powered insights generation
- **GitHub API v3**: Repository search, metadata retrieval, and language statistics

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

### Authentication Services
- **Replit OIDC**: OpenID Connect authentication provider for user management

### UI and Design Libraries
- **Radix UI**: Headless, accessible UI component library
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Consistent icon library for UI elements

### Development and Build Tools
- **Vite**: Frontend build tool with HMR and optimization
- **esbuild**: Fast TypeScript/JavaScript bundler for server builds
- **TanStack Query**: Server state management and caching solution

### Session and Security
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Passport.js**: Authentication middleware with OIDC strategy support