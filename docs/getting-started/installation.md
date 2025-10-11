---
title: "Installation & Setup"
description: "Set up RepoRadar for development"
category: "getting-started"
order: 3
lastUpdated: "2025-01-10"
tags: ["development", "setup"]
---

# Installation & Setup

This guide is for developers who want to run RepoRadar locally or contribute to the project.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (or Neon account)
- GitHub account
- Google Gemini API key

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/reporadar.git
cd reporadar
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token
SESSION_SECRET=your_random_secret
```

### 4. Set Up Database

Push the database schema:

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Check code quality
npm run db:push          # Update database schema
```

## Troubleshooting

### Database Connection Issues

Ensure your `DATABASE_URL` is correct and the database is accessible.

### Port Already in Use

Change the port in your `.env` file:

```env
PORT=3000
```

### API Rate Limits

Add a GitHub personal access token to increase rate limits:

```env
GITHUB_TOKEN=your_token_here
```

## Next Steps

- Read the [API Documentation](../api-reference/index.md)
- Explore the [Features](../features/index.md)
- Check [Contributing Guidelines](../../README.md)
