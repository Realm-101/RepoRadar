# RepoRadar Quick Reference

Quick answers to common questions and tasks.

## Quick Start

### Analyze a Repository
```
1. Paste GitHub URL in search bar
2. Click "Analyze" or press Enter
3. Wait 10-30 seconds
4. Review results
```

### Batch Analysis
```
1. Discover → Batch Analysis
2. Add repository URLs
3. Click "Start Batch Analysis"
4. Export results when done
```

### Find Similar Repositories
```
1. Open any analysis
2. Click "Find Similar"
3. Choose "By Metrics" or "By Functionality"
4. Explore results
```

## The 5 Metrics

| Metric | What It Measures | Score Range |
|--------|------------------|-------------|
| **Originality** | Innovation and uniqueness | 0-100 |
| **Completeness** | Documentation, tests, maturity | 0-100 |
| **Marketability** | Adoption potential, community | 0-100 |
| **Monetization** | Revenue generation potential | 0-100 |
| **Usefulness** | Practical value, problem-solving | 0-100 |

### Score Interpretation

- **90-100**: Exceptional
- **80-89**: Excellent
- **70-79**: Good
- **60-69**: Above Average
- **50-59**: Average
- **40-49**: Below Average
- **30-39**: Poor
- **0-29**: Very Poor

## Navigation

### Discover Menu
- **Advanced Search**: Find repos with 15+ filters
- **Batch Analysis**: Analyze multiple repos
- **Compare**: Side-by-side comparison
- **Discover Trending**: Popular repositories

### Workspace Menu (Pro)
- **Collections**: Organize repositories
- **Profile**: Account settings
- **Recent Analyses**: Analysis history
- **Bookmarks**: Saved repositories

### Resources Menu
- **Documentation**: Guides and help
- **Pricing**: Subscription plans
- **API Reference**: Developer docs
- **FAQ**: Common questions

## Subscription Tiers

### Free
- 10 analyses/month
- Basic search
- 3 repos per batch
- PDF/CSV export

### Pro ($9.99/month)
- Unlimited analyses
- Advanced search
- Unlimited batch
- Collections & bookmarks
- AI recommendations
- Analytics dashboard

### Enterprise (Custom)
- API access
- Webhooks
- Team features
- Custom integrations
- SLA guarantee

## Common Tasks

### Export Results

**PDF:**
```
1. Open analysis
2. Click "Export"
3. Select "PDF"
4. Download
```

**CSV:**
```
1. Open analysis
2. Click "Export"
3. Select "CSV"
4. Open in Excel/Sheets
```

### Create Collection (Pro)

```
1. Workspace → Collections
2. Click "New Collection"
3. Name your collection
4. Add repositories
5. Organize and tag
```

### Use Advanced Search

```
1. Discover → Advanced Search
2. Set filters:
   - Language
   - Star count
   - Topics
   - Date range
   - License
3. Click "Search"
4. Analyze results
```

### Compare Repositories

```
1. Discover → Compare
2. Add 2-4 repository URLs
3. Click "Compare"
4. Review side-by-side
5. Export comparison
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + B` | Toggle bookmarks |
| `Ctrl/Cmd + N` | New analysis |
| `Ctrl/Cmd + Enter` | Start batch |
| `Ctrl/Cmd + E` | Export results |
| `Esc` | Close modals |

## URL Formats

All these work:
- `https://github.com/owner/repo`
- `github.com/owner/repo`
- `owner/repo`

## Troubleshooting

### Analysis Stuck
```
1. Wait 30-60 seconds
2. Refresh page
3. Try again
4. Check GitHub Status
```

### Can't Sign In
```
1. Enable third-party cookies
2. Try incognito mode
3. Disable extensions
4. Try different browser
```

### No Search Results
```
1. Remove some filters
2. Broaden star range
3. Expand date range
4. Check for typos
```

### Rate Limit Error
```
1. Wait for reset (time shown)
2. Upgrade to Pro
3. Use batch analysis
```

## API Quick Start

### Authentication
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://reporadar.com/api/analyze
```

### Analyze Repository
```bash
curl -X POST https://reporadar.com/api/analyze \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"repository": "owner/repo"}'
```

### Batch Analysis
```bash
curl -X POST https://reporadar.com/api/batch-analysis \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"repositories": ["owner/repo1", "owner/repo2"]}'
```

## Self-Hosting

### Requirements
- Node.js 18+
- PostgreSQL
- Gemini API key

### Quick Setup
```bash
# Clone and install
git clone <repo-url>
cd reporadar
npm install

# Configure
cp .env.example .env
# Edit .env with your keys

# Setup database
npm run db:push

# Start
npm run dev
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_key
GITHUB_TOKEN=optional
REDIS_URL=optional
NODE_ENV=development
PORT=5000
```

## Common Filters

### By Language
```
JavaScript, TypeScript, Python, Java, Go, 
Rust, C++, Ruby, PHP, Swift, Kotlin, etc.
```

### By Stars
```
0-100: Small projects
100-1000: Growing projects
1000-10000: Popular projects
10000+: Very popular
```

### By License
```
MIT, Apache-2.0, GPL-3.0, BSD-3-Clause,
ISC, LGPL-3.0, MPL-2.0, etc.
```

### By Topics
```
react, typescript, machine-learning,
api, cli, framework, library, etc.
```

## Best Practices

### For Analysis
1. Analyze before adopting libraries
2. Compare multiple alternatives
3. Read detailed explanations
4. Check recent activity
5. Verify license compatibility

### For Search
1. Start broad, then narrow
2. Combine multiple filters
3. Check last update date
4. Verify star count trends
5. Read descriptions carefully

### For Organization
1. Use collections for projects
2. Tag repositories clearly
3. Add notes for context
4. Export regularly
5. Review periodically

## Getting Help

### Instant Help
- **AI Assistant**: Bottom-right corner (24/7)

### Documentation
- [Getting Started](./getting-started/index.md)
- [Features](./features/index.md)
- [FAQ](./faq/index.md)
- [Troubleshooting](./troubleshooting/index.md)

### Support
- **Email**: support@reporadar.com
- **Response**: 24-48h (Free), 4-8h (Pro), 1-2h (Enterprise)

### Community
- GitHub Issues
- Discord Server
- Community Forum

## Useful Links

- [Installation Guide](./getting-started/installation.md)
- [Quick Start](./getting-started/quick-start.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Performance Configuration](./PERFORMANCE_CONFIGURATION.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

## Tips & Tricks

### Discover Hidden Gems
```
1. Advanced Search
2. Set stars: 100-1000
3. Updated: Last 3 months
4. Sort by: Recent activity
5. Find quality projects before they're popular
```

### Monitor Competitors
```
1. Create "Competitors" collection
2. Add all competitor repos
3. Analyze regularly
4. Track metric changes
5. Export comparison reports
```

### Build Tech Stack
```
1. Analyze your current tools
2. Find similar by functionality
3. Compare alternatives
4. Evaluate based on needs
5. Make informed decisions
```

### Evaluate Dependencies
```
1. List all dependencies
2. Batch analyze them
3. Check maintenance status
4. Verify license compatibility
5. Identify risks
```

---

**Need more details?** Check the [full documentation](./getting-started/index.md) or ask the AI Assistant!
