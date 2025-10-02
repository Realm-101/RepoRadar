# RepoRadar

## Overview

RepoRadar is a high-performance, full-stack web application that provides AI-powered analysis of GitHub repositories. The platform helps users discover, analyze, and compare repositories based on key metrics including originality, completeness, marketability, monetization potential, and usefulness. Built with a modern React frontend and Express.js backend, it leverages Google's Gemini 2.5 Pro AI model to provide comprehensive repository insights.

**🚀 Performance Optimized**: RepoRadar includes comprehensive performance optimization features across database, API, and frontend layers, with intelligent caching, compression, and fallback strategies for enterprise-grade reliability.

## 🎯 Key Features

### Core Analysis Features
- **AI-Powered Repository Analysis**: Comprehensive scoring across 5 key metrics
- **Advanced Search & Filtering**: Multi-criteria search with language, stars, and date filters
- **Batch Analysis**: Process multiple repositories simultaneously with progress tracking
- **Export Functionality**: PDF and CSV export for analysis results
- **Find Similar Repositories**: AI-powered similarity matching

### User Experience Features
- **Interactive Onboarding**: Guided tour for new users
- **Micro-interactions**: Smooth animations and responsive feedback
- **Intelligent User Profiles**: Bookmarks, collections, and personalized recommendations
- **AI Assistant**: Context-aware help with holographic interface
- **Comprehensive Documentation**: Detailed guides and API reference

### Enterprise Features
- **API Access & Developer Tools**: RESTful API with rate limiting
- **Advanced Analytics Dashboard**: Time series analysis and trend predictions
- **Integration Hub**: Connect with GitHub, GitLab, Slack, Discord, Jira, and CI/CD tools
- **AI-Powered Code Review**: Security analysis and quality metrics
- **Subscription Management**: Tiered plans with Stripe integration

### Performance & Reliability
- **Database Optimization**: Connection pooling, query monitoring, and automatic indexing
- **Intelligent Caching**: Multi-layer caching with Redis support and compression
- **Response Compression**: Gzip/Brotli compression with configurable thresholds
- **GitHub API Optimization**: Request batching, rate limiting, and intelligent caching
- **Frontend Performance**: Code splitting, lazy loading, and bundle optimization
- **Fallback Strategies**: Graceful degradation for maximum reliability
- **Performance Monitoring**: Real-time metrics, alerting, and dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- GitHub token (optional, for higher rate limits)
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/reporadar.git
cd reporadar

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```### 
Production Deployment

#### Standard Deployment
```bash
# Linux/macOS
./scripts/deploy.sh --environment production --performance true

# Windows
.\scripts\deploy.ps1 -Environment production -EnablePerformanceOptimizations $true
```

#### Docker Deployment
```bash
# Deploy with performance optimizations
docker-compose -f docker/docker-compose.performance.yml up -d

# Scale for high availability
docker-compose -f docker/docker-compose.performance.yml up -d --scale reporadar=3
```

## ⚙️ Performance Configuration

RepoRadar includes a comprehensive performance configuration system. All settings can be configured through environment variables or the centralized configuration manager.

### Quick Configuration Check
```bash
# Validate current configuration
npm run config:validate

# View configuration summary
npm run config:summary

# Export configuration
npm run config:export
```

### Key Performance Settings

#### Database Performance
```bash
DB_POOL_MIN=2                    # Minimum connections
DB_POOL_MAX=10                   # Maximum connections  
DB_QUERY_MONITORING_ENABLED=true # Enable query monitoring
DB_SLOW_QUERY_THRESHOLD=1000     # Slow query threshold (ms)
DB_AUTO_CREATE_INDEXES=true      # Auto-create missing indexes
```

#### Cache Configuration
```bash
CACHE_ENABLED=true               # Enable caching
CACHE_TYPE=memory                # memory, redis, or hybrid
CACHE_MEMORY_MAX_SIZE=100        # Cache size (MB)
CACHE_COMPRESSION_ENABLED=true   # Compress cache entries
```

#### Compression Settings
```bash
COMPRESSION_ENABLED=true         # Enable response compression
COMPRESSION_ALGORITHMS=gzip,brotli # Supported algorithms
COMPRESSION_LEVEL=6              # Compression level (1-9)
COMPRESSION_THRESHOLD=1024       # Min size to compress (bytes)
```

#### GitHub API Optimization
```bash
GITHUB_OPTIMIZATION_ENABLED=true # Enable API optimizations
GITHUB_BATCH_SIZE=10             # Batch request size
GITHUB_CACHING_ENABLED=true      # Cache API responses
GITHUB_CACHE_TTL=300             # Cache TTL (seconds)
```

#### Frontend Performance
```bash
FRONTEND_CODE_SPLITTING_ENABLED=true  # Enable code splitting
FRONTEND_LAZY_LOADING_ENABLED=true    # Enable lazy loading
FRONTEND_TREE_SHAKING_ENABLED=true    # Enable tree shaking
FRONTEND_SERVICE_WORKER_ENABLED=false # Enable service worker
```

For complete configuration options, see [Performance Configuration Guide](docs/PERFORMANCE_CONFIGURATION.md).

## 📊 System Architecture

### Performance-Optimized Architecture

RepoRadar is built with performance as a core principle, featuring:

#### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state and caching
- **UI Framework**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with responsive design
- **Build Tool**: Vite with performance optimizations
- **Performance Features**:
  - Code splitting with route and component-based chunks
  - Lazy loading with intersection observer
  - Bundle optimization with tree shaking
  - Service worker caching (optional)
  - Compression and minification

#### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling
- **Session Management**: PostgreSQL-backed sessions
- **Performance Features**:
  - Connection pooling with health monitoring
  - Query performance monitoring and optimization
  - Automatic index creation and management
  - Multi-layer caching (memory/Redis)
  - Response compression (gzip/brotli)
  - GitHub API optimization with batching
  - Graceful fallback strategies

#### Database Layer
- **Primary Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM for type-safe operations
- **Performance Features**:
  - Optimized connection pooling
  - Slow query monitoring and logging
  - Automatic index creation
  - Query analysis and optimization
  - Health checks and fallback connections

#### Caching Strategy
- **Multi-Layer Caching**: Memory + Redis support
- **Intelligent Invalidation**: Time, event, and manual strategies
- **Compression**: Automatic compression for large cache entries
- **Fallback**: Direct retrieval when cache is unavailable

### AI Integration
- **AI Provider**: Google Gemini 2.5 Pro for repository analysis
- **Analysis Metrics**: Five-factor scoring system
- **Response Format**: Structured JSON with comprehensive insights
- **Rate Limiting**: Built-in request management

### External Integrations
- **GitHub API**: Repository data with optimization
- **Stripe**: Payment processing for subscriptions
- **Authentication**: Replit OIDC with Passport.js
- **Monitoring**: Performance metrics and alerting

## 🛠️ Development

### Development Workflow
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Type checking
npm run check

# Build for production
npm run build
```

### Performance Testing
```bash
# Run performance benchmarks
npm run test -- tests/PerformanceBenchmark.test.ts

# Run load testing
npm run test -- server/performance/__tests__/LoadTesting.integration.test.ts

# Run end-to-end performance tests
npm run test -- tests/EndToEnd.integration.test.ts
```

### Configuration Management
```bash
# Validate configuration
npm run config:validate

# View configuration summary  
npm run config:summary

# Export configuration as JSON
npm run config:export
```

## 📚 Documentation

- **[Performance Configuration Guide](docs/PERFORMANCE_CONFIGURATION.md)** - Comprehensive performance tuning guide
- **[Configuration System](config/README.md)** - Configuration management documentation
- **[Deployment Scripts](scripts/)** - Deployment automation documentation
- **[Docker Setup](docker/)** - Container deployment with performance optimizations

## 🔧 Environment Configuration

### Development
```bash
NODE_ENV=development
DB_POOL_MAX=5
CACHE_MEMORY_MAX_SIZE=50
COMPRESSION_LEVEL=1
METRICS_RETENTION_DAYS=7
```

### Staging
```bash
NODE_ENV=staging
DB_POOL_MAX=15
CACHE_MEMORY_MAX_SIZE=128
COMPRESSION_LEVEL=6
METRICS_RETENTION_DAYS=30
```

### Production
```bash
NODE_ENV=production
DB_POOL_MAX=30
CACHE_MEMORY_MAX_SIZE=512
COMPRESSION_LEVEL=9
METRICS_RETENTION_DAYS=90
```

## 📈 Performance Monitoring

RepoRadar includes comprehensive performance monitoring:

- **Real-time Metrics**: Database, API, and frontend performance
- **Alerting System**: Configurable thresholds with multiple channels
- **Performance Dashboard**: Visual metrics and historical data
- **Health Checks**: Automated system health monitoring
- **Fallback Tracking**: Monitor fallback usage and recovery

Access the performance dashboard at `/api/performance/dashboard` when monitoring is enabled.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and performance benchmarks
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the [docs](docs/) directory
- **Configuration Issues**: Run `npm run config:validate`
- **Performance Issues**: Check the performance dashboard
- **General Issues**: Create an issue on GitHub

---

**Built with ❤️ and optimized for ⚡ performance**