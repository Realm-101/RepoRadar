import { useState } from "react";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const docSections = {
  overview: {
    title: "Overview",
    icon: "fas fa-home",
    content: `
# RepoAnalyzer Documentation

## Welcome to RepoAnalyzer

RepoAnalyzer is a cutting-edge GitHub repository analysis platform that leverages Google's Gemini 2.5 Pro AI to provide comprehensive insights into code repositories. Our platform helps developers, investors, and teams make informed decisions about software projects.

## Key Features

### 🔍 Smart Repository Analysis
- **AI-Powered Evaluation**: Uses advanced machine learning to analyze repositories across 5 key metrics
- **Real-time Processing**: Get instant insights with our optimized analysis pipeline
- **Comprehensive Scoring**: Detailed breakdown of originality, completeness, marketability, monetization potential, and usefulness

### 📊 Data Visualizations
- **Interactive Charts**: Radar charts and language distribution graphs
- **Progress Tracking**: Real-time analysis progress indicators
- **Export Capabilities**: Download professional PDF reports

### 🚀 Discovery Features
- **Find Similar Repositories**: AI-powered similarity matching
- **Trending Repositories**: Discover what's hot in the GitHub ecosystem
- **Advanced Search**: Comprehensive filtering with 15+ filter options
- **Batch Analysis**: Analyze multiple repositories simultaneously

## Getting Started

1. **Sign In**: Use Replit authentication for secure access
2. **Analyze**: Enter any GitHub repository URL
3. **Explore**: Browse insights, charts, and recommendations
4. **Compare**: Analyze multiple repositories side-by-side
5. **Export**: Download reports for offline review
    `
  },
  analysis: {
    title: "Analysis Metrics",
    icon: "fas fa-chart-line",
    content: `
# Analysis Metrics Explained

## Our 5-Factor Scoring System

### 1. Originality (0-10)
**What it measures**: How unique and innovative the repository is
- Novel approaches to problem-solving
- Unique features not found in similar projects
- Creative implementation techniques
- Innovation in the problem space

**High Score Indicators**:
- Introduces new concepts or methodologies
- Solves problems in unprecedented ways
- Creates new standards or patterns

### 2. Completeness (0-10)
**What it measures**: How feature-complete and production-ready the code is
- Documentation quality
- Test coverage
- Error handling
- Configuration options
- Build and deployment setup

**High Score Indicators**:
- Comprehensive README and documentation
- Extensive test suites
- CI/CD pipeline configuration
- Clear setup instructions

### 3. Marketability (0-10)
**What it measures**: Commercial potential and market appeal
- Target audience size
- Problem significance
- Competition analysis
- Growth potential
- Community engagement

**High Score Indicators**:
- Addresses significant market need
- Strong community adoption
- Active issue discussions
- Regular updates and releases

### 4. Monetization Potential (0-10)
**What it measures**: Revenue generation possibilities
- Business model viability
- Enterprise appeal
- SaaS potential
- Licensing opportunities
- Support and consulting possibilities

**High Score Indicators**:
- Clear path to revenue
- Enterprise-friendly features
- Professional support options
- Scalable architecture

### 5. Usefulness (0-10)
**What it measures**: Practical value and real-world applicability
- Problem-solving effectiveness
- Developer experience
- Integration ease
- Performance and efficiency
- Maintenance simplicity

**High Score Indicators**:
- Solves real problems effectively
- Easy to integrate and use
- Well-maintained and updated
- Good performance characteristics

## Overall Score Calculation

The overall score is calculated as a weighted average of all five metrics, with each metric contributing equally to the final score. Scores above 8.0 indicate exceptional repositories, while scores below 5.0 suggest areas for improvement.
    `
  },
  features: {
    title: "Features Guide",
    icon: "fas fa-rocket",
    content: `
# Features Guide

## Repository Analysis

### Basic Analysis
1. Navigate to the Analyze page
2. Enter a GitHub repository URL (e.g., https://github.com/facebook/react)
3. Click "Analyze Repository"
4. View comprehensive insights and scores

### Understanding Results
- **Score Cards**: Individual metric breakdowns with detailed explanations
- **Visualizations**: Interactive charts showing metric distribution
- **AI Summary**: Natural language description of strengths and weaknesses
- **Recommendations**: Actionable suggestions for improvement

## Discovery Features

### Find Similar Repositories
After analyzing a repository, click "Find Similar" to discover:
- Repositories with similar technology stacks
- Projects solving related problems
- Alternative implementations
- Competing solutions

### Trending Repositories
- View repositories gaining traction
- Filter by time period and language
- See what's popular in different categories
- Track emerging technologies

## Comparison Tools

### Side-by-Side Comparison
1. Analyze multiple repositories
2. Navigate to Compare page
3. Select repositories to compare
4. View detailed metric comparisons
5. Export comparison reports

### Key Comparison Features
- Visual diff charts
- Strength/weakness analysis
- Technology stack comparison
- Community metrics comparison

## Export and Reporting

### PDF Reports
- Click "Export PDF" on any analysis
- Includes all metrics and visualizations
- Professional formatting for presentations
- Shareable with teams and stakeholders

### Data Export
- Export raw analysis data as JSON
- Integrate with other tools
- Build custom dashboards
- Track metrics over time

## Advanced Search & Filtering

### Comprehensive Search Filters
Our advanced search system provides powerful filtering capabilities:

**Language Filters**
- JavaScript, TypeScript, Python, Java, Go, Rust
- C++, C#, Ruby, PHP, Swift, Kotlin
- Filter for specific programming languages

**Repository Metrics**
- **Star Range**: Set minimum and maximum star counts
- **Date Range**: Filter by creation date (today, week, month, year)
- **License Types**: MIT, Apache 2.0, GPL 3.0, BSD 3-Clause, Unlicense

**Content Filters**
- **Topics**: Add specific repository topics
- **Include Archived**: Toggle archived repositories
- **Include Forked**: Toggle forked repositories  
- **Has Open Issues**: Filter repositories with active issues

**Sorting Options**
- Best Match (relevance-based)
- Most Stars
- Most Forks
- Recently Updated
- Newest First

### How to Use Advanced Search
1. Navigate to the Search page
2. Enter your search query
3. Click "Filters" to expand filter options
4. Configure desired filters
5. Search results update automatically
6. Use "Reset All Filters" to clear selections

## Batch Analysis

### Analyze Multiple Repositories
Process multiple repositories simultaneously for comprehensive analysis:

**Supported Input Formats**
- GitHub repository URLs (one per line)
- Comma-separated URLs
- Mixed format input

**Batch Processing Features**
- **Queue Management**: Add, remove, and monitor repositories
- **Progress Tracking**: Real-time status updates
- **Error Handling**: Individual repository error tracking
- **Statistics Dashboard**: Completion and failure rates

### Batch Analysis Workflow
1. Navigate to Batch Analysis page
2. Enter repository URLs in the text area
3. Click "Parse URLs" to validate and queue repositories
4. Click "Start Analysis" to begin batch processing
5. Monitor progress in real-time
6. Export results when complete

**Tier Limitations**
- **Free Users**: Up to 3 repositories per batch
- **Pro/Enterprise Users**: Unlimited batch analysis

### Export Batch Results
**CSV Export**: Includes all metrics and scores in spreadsheet format
**PDF Export**: Professional reports with comprehensive analysis details

**CSV Data Fields**:
- Repository URL
- All 5 metric scores (Originality, Completeness, etc.)
- Overall score
- AI summary

**PDF Report Includes**:
- Batch statistics
- Individual repository breakdowns
- Score summaries
- Analysis timestamps
    `
  },
  api: {
    title: "API Reference",
    icon: "fas fa-code",
    content: `
# API Reference

## Authentication

All API requests require authentication via session cookies. Ensure you're logged in through the web interface or use API tokens for programmatic access.

## Endpoints

### Analysis Endpoints

#### POST /api/analyze
Analyze a GitHub repository

**Request Body:**
\`\`\`json
{
  "url": "https://github.com/owner/repo"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "analysis-id",
  "repository": {
    "id": "repo-id",
    "name": "repo-name",
    "fullName": "owner/repo",
    "stars": 1000,
    "language": "TypeScript"
  },
  "scores": {
    "originality": 8.5,
    "completeness": 9.0,
    "marketability": 7.5,
    "monetization": 6.0,
    "usefulness": 9.5,
    "overall": 8.1
  },
  "summary": "AI-generated summary...",
  "recommendations": ["..."],
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

#### GET /api/analyses/recent
Get recent analyses

**Query Parameters:**
- \`limit\`: Number of results (default: 10)
- \`offset\`: Pagination offset (default: 0)

#### GET /api/analysis/:id
Get specific analysis by ID

#### POST /api/analyze/batch
Analyze multiple repositories in batch

**Request Body:**
\`\`\`json
{
  "urls": [
    "https://github.com/owner/repo1",
    "https://github.com/owner/repo2",
    "https://github.com/owner/repo3"
  ]
}
\`\`\`

**Response:**
\`\`\`json
{
  "batchId": "batch-uuid",
  "status": "processing",
  "progress": {
    "total": 3,
    "completed": 0,
    "failed": 0,
    "pending": 3
  },
  "results": [],
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

#### GET /api/analyze/batch/:batchId
Get batch analysis status and results

**Response:**
\`\`\`json
{
  "batchId": "batch-uuid",
  "status": "completed",
  "progress": {
    "total": 3,
    "completed": 2,
    "failed": 1,
    "pending": 0
  },
  "results": [
    { /* analysis object */ },
    { /* analysis object */ }
  ],
  "errors": [
    {
      "url": "https://github.com/invalid/repo",
      "error": "Repository not found"
    }
  ]
}
\`\`\`

### Export Endpoints

#### POST /api/export/batch/csv
Export batch results as CSV

**Request Body:**
\`\`\`json
{
  "batchId": "batch-uuid"
}
\`\`\`

**Response:** CSV file download

#### POST /api/export/batch/pdf
Export batch results as PDF

**Request Body:**
\`\`\`json
{
  "batchId": "batch-uuid"
}
\`\`\`

**Response:** PDF file download

### Repository Endpoints

#### GET /api/repositories/trending
Get trending repositories

**Query Parameters:**
- \`period\`: Time period (day, week, month)
- \`language\`: Filter by language

#### GET /api/repositories/search
Advanced repository search with comprehensive filtering

**Query Parameters:**
- \`q\`: Search query (supports GitHub search syntax)
- \`sort\`: Sort by (best-match, stars, forks, updated, created)
- \`language\`: Programming language filter
- \`license\`: License type filter
- \`stars\`: Star range filter (e.g., ">=100", "<=1000")
- \`created\`: Creation date filter (e.g., ">=2023-01-01")
- \`archived\`: Include archived repos (true/false)
- \`fork\`: Include forked repos (true/false)
- \`has_issues\`: Repos with open issues (true/false)
- \`topic\`: Filter by topics

**Example:**
\`GET /api/repositories/search?q=machine+learning&language=python&sort=stars&stars=%3E%3D1000\`

#### GET /api/repositories/:id/similar
Find similar repositories

**Query Parameters:**
- \`limit\`: Number of results (default: 10)

### User Endpoints

#### GET /api/auth/user
Get current user information

#### GET /api/user/saved
Get saved repositories

#### POST /api/user/save
Save a repository

**Request Body:**
\`\`\`json
{
  "repositoryId": "repo-id"
}
\`\`\`

## Rate Limiting

- **Authenticated Users**: 1000 requests per hour
- **Analysis Requests**: 100 per hour
- **Search Requests**: 500 per hour

## Error Codes

- \`400\`: Bad Request - Invalid parameters
- \`401\`: Unauthorized - Authentication required
- \`403\`: Forbidden - Insufficient permissions
- \`404\`: Not Found - Resource doesn't exist
- \`429\`: Too Many Requests - Rate limit exceeded
- \`500\`: Internal Server Error
    `
  },
  faq: {
    title: "FAQ",
    icon: "fas fa-question-circle",
    content: `
# Frequently Asked Questions

## General Questions

### What is RepoAnalyzer?
RepoAnalyzer is an AI-powered platform that provides comprehensive analysis of GitHub repositories, helping developers and teams make informed decisions about software projects.

### How does the AI analysis work?
We use Google's Gemini 2.5 Pro model to analyze repository code, structure, documentation, and community engagement. The AI evaluates multiple factors to provide actionable insights.

### Is my data secure?
Yes! We use industry-standard encryption and never store repository code. Analysis is performed in real-time and only metadata is retained.

## Analysis Questions

### How long does analysis take?
Most repositories are analyzed within 10-30 seconds. Larger repositories may take up to 1 minute.

### What repositories can be analyzed?
Any public GitHub repository can be analyzed. Private repositories require GitHub authentication and appropriate permissions.

### How accurate are the scores?
Our AI model has been trained on thousands of repositories and provides consistent, objective scoring. However, scores should be used as guidance alongside human judgment.

### Can I re-analyze a repository?
Yes! Repositories can be re-analyzed at any time to get updated scores based on recent changes.

## Feature Questions

### What's included in the free tier?
- Up to 10 analyses per month
- Basic visualizations
- Search and discovery features
- PDF export (watermarked)

### What are the premium features?
- Unlimited analyses
- Advanced visualizations
- Team collaboration
- API access
- Priority support
- Custom analysis templates

### How do I export reports?
Click the "Export PDF" button on any analysis page to download a professional report.

### Can I compare multiple repositories?
Yes! The comparison feature allows side-by-side analysis of up to 4 repositories simultaneously.

## Technical Questions

### Is there an API?
Yes! Premium users have access to our RESTful API for programmatic analysis and data retrieval.

### What languages are supported?
We support all programming languages recognized by GitHub, with enhanced analysis for popular languages like JavaScript, Python, Java, Go, and Rust.

### Can I integrate with CI/CD?
Yes! Our API can be integrated into CI/CD pipelines to automatically analyze code on commits or pull requests.

### Is there a rate limit?
Free users: 10 analyses per month
Premium users: 1000 analyses per month
Enterprise: Unlimited

## Troubleshooting

### Analysis failed - what should I do?
1. Verify the repository URL is correct
2. Ensure the repository is public or you have access
3. Check if GitHub is accessible
4. Try again in a few moments
5. Contact support if issues persist

### Scores seem incorrect
Our AI continuously improves. If you believe scores are inaccurate:
1. Check if the repository has recent updates
2. Review our scoring methodology
3. Provide feedback through the feedback button
4. Contact support with specific concerns

### Can't find a repository
1. Ensure correct spelling and format
2. Check if repository is public
3. Try using the full GitHub URL
4. Use advanced search filters
    `
  },
  changelog: {
    title: "Changelog",
    icon: "fas fa-history",
    content: `
# Changelog

## Version 2.4.0 - January 2025
### 🎉 Interactive Onboarding & Enhanced UX

#### New Features
- 🚀 **Interactive Onboarding Tour**: Step-by-step guide for new users
  - 5-step focused tour covering core features
  - Auto-starts for new users with localStorage tracking
  - Restart option available in profile preferences
  - Smart targeting with fallback for missing elements
- ✨ **Micro-interactions**: Smooth animations and transitions
  - Button scaling and ripple effects
  - Input focus animations with shadow effects
  - Pulse animations on notification badges
  - Card lift effects with fade-in transitions
  - Skeleton loaders for loading states
  - Bounce, shake, spin, and slide-in animations

#### Improvements
- 🎨 Enhanced visual feedback for all interactions
- 🔄 Smoother transitions between states
- 📱 Better responsive animations
- 🎯 Improved user engagement with visual cues

## Version 2.3.0 - January 2025
### 🎉 Advanced Search & Batch Analysis

#### New Features
- 🔍 **Advanced Search System**: Comprehensive filtering with 15+ filter options
  - Language, star range, date range, license filtering
  - Topic-based search and archived/forked repo toggles
  - Advanced sorting options (best match, stars, forks, updated, created)
- 📊 **Batch Analysis**: Analyze multiple repositories simultaneously
  - Queue management with add/remove capabilities
  - Real-time progress tracking and error handling
  - CSV and PDF export for batch results
  - Tier-based limitations (3 for free, unlimited for Pro)
- 📤 **Enhanced Export System**: Professional batch reporting capabilities

#### Improvements
- 🚀 Enhanced search performance with intelligent caching
- 🎯 Improved filter UI with collapsible panels and sliders
- 📈 Better progress visualization for long-running operations
- 🔧 Strengthened TypeScript type safety across PDF exports

#### Technical Updates
- Fixed all TypeScript compilation errors in PDF functionality
- Added comprehensive API endpoints for batch operations
- Enhanced error handling for repository validation
- Updated documentation with detailed feature guides

## Version 2.0.0 - January 2025
### 🎉 Major Release: Premium Features

#### New Features
- ✨ Advanced data visualizations with interactive charts
- 📊 Real-time analysis progress indicators
- 🔥 Trending repositories dashboard
- 📥 PDF export functionality
- 🤖 AI-powered help system with holographic interface
- 📚 Comprehensive documentation

#### Improvements
- 🚀 3x faster analysis processing
- 💾 Reduced memory usage by 40%
- 🎨 Redesigned UI with Linear-inspired aesthetics
- 🔍 Enhanced search capabilities
- 📱 Improved mobile responsiveness

#### Bug Fixes
- Fixed routing issues with analysis redirects
- Resolved authentication state persistence
- Corrected score calculation edge cases
- Fixed chart rendering on Safari

## Version 1.5.0 - December 2024
### Feature Update

#### New Features
- 🔄 Find Similar Repositories
- 📈 Historical analysis tracking
- 🏷️ Repository tagging system
- 💬 Comments on analyses

#### Improvements
- Better error handling
- Faster initial load times
- Improved caching strategy

## Version 1.0.0 - November 2024
### Initial Release

#### Core Features
- GitHub repository analysis
- 5-factor scoring system
- Basic visualizations
- User authentication
- Repository search
- Save favorites
- Basic comparison tools

## Upcoming Features (Roadmap)

### Q1 2025
- 🤝 Team collaboration features
- 📧 Email notifications
- 🔄 Webhook integrations
- 📊 Custom analysis templates

### Q2 2025
- 🌍 Multi-language support
- 📱 Mobile app
- 🔗 GitLab and Bitbucket support
- 🤖 AI code review suggestions

### Q3 2025
- 🏢 Enterprise features
- 📊 Advanced analytics dashboard
- 🔐 SSO integration
- 🚀 Self-hosted option

Stay tuned for more exciting updates!
    `
  }
};

export default function Docs() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-dark text-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Documentation
          </h1>
          <p className="text-gray-400 text-lg">
            Everything you need to know about RepoAnalyzer
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1 p-4">
                    {Object.entries(docSections).map(([key, section]) => (
                      <Button
                        key={key}
                        variant={activeSection === key ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection(key)}
                        data-testid={`nav-${key}`}
                      >
                        <i className={`${section.icon} mr-2`}></i>
                        {section.title}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Card className="bg-card border-border">
              <CardContent className="p-8">
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ 
                      __html: docSections[activeSection as keyof typeof docSections].content
                        .split('\n')
                        .map(line => {
                          // Convert markdown headers
                          if (line.startsWith('# ')) {
                            return `<h1 class="text-3xl font-bold mb-6 text-white">${line.substring(2)}</h1>`;
                          }
                          if (line.startsWith('## ')) {
                            return `<h2 class="text-2xl font-semibold mb-4 mt-8 text-white">${line.substring(3)}</h2>`;
                          }
                          if (line.startsWith('### ')) {
                            return `<h3 class="text-xl font-semibold mb-3 mt-6 text-gray-200">${line.substring(4)}</h3>`;
                          }
                          if (line.startsWith('#### ')) {
                            return `<h4 class="text-lg font-semibold mb-2 mt-4 text-gray-300">${line.substring(5)}</h4>`;
                          }
                          // Convert bold text
                          line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>');
                          // Convert bullet points
                          if (line.startsWith('- ')) {
                            return `<li class="ml-6 mb-2 text-gray-300">${line.substring(2)}</li>`;
                          }
                          // Convert numbered lists
                          if (/^\d+\.\s/.test(line)) {
                            return `<li class="ml-6 mb-2 text-gray-300">${line.substring(line.indexOf('.') + 2)}</li>`;
                          }
                          // Convert code blocks
                          if (line.startsWith('```')) {
                            return line === '```' ? '</pre>' : `<pre class="bg-gray-900 p-4 rounded-lg overflow-x-auto"><code class="text-green-400">`;
                          }
                          // Convert inline code
                          line = line.replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-blue-400">$1</code>');
                          // Regular paragraphs
                          if (line.trim()) {
                            return `<p class="mb-4 text-gray-300 leading-relaxed">${line}</p>`;
                          }
                          return '<br/>';
                        })
                        .join('')
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}