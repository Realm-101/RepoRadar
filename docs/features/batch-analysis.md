---
title: "Batch Analysis"
description: "Analyze multiple repositories at once"
category: "features"
order: 5
lastUpdated: "2025-01-10"
tags: ["batch", "features", "pro"]
---

# Batch Analysis

Analyze multiple repositories simultaneously (Pro and Enterprise plans).

## Overview

Batch analysis allows you to:
- Analyze up to 50 repositories at once
- Track progress in real-time
- Compare results side-by-side
- Export batch results

## How to Use

### 1. Prepare Repository List

Create a list of repository URLs:
```
https://github.com/facebook/react
https://github.com/vuejs/vue
https://github.com/angular/angular
```

### 2. Start Batch Analysis

1. Navigate to the Batch Analysis page
2. Paste your repository URLs (one per line)
3. Click "Start Batch Analysis"
4. Monitor progress in real-time

### 3. View Results

- Results appear as each analysis completes
- Compare metrics across repositories
- Sort and filter results
- Export as PDF or CSV

## Features

### Progress Tracking

- Real-time progress bar
- Individual repository status
- Estimated completion time
- Error handling for failed analyses

### Comparison View

- Side-by-side metric comparison
- Sortable columns
- Visual indicators for top performers
- Quick filtering options

### Bulk Export

- Export all results at once
- Choose PDF or CSV format
- Include or exclude specific metrics
- Custom report templates (Enterprise)

## Limitations

### Free Tier
- Not available

### Pro Tier
- Up to 10 repositories per batch
- 5 batches per day
- Standard priority

### Enterprise Tier
- Up to 50 repositories per batch
- Unlimited batches
- Priority processing
- Custom batch sizes available

## Use Cases

### Technology Evaluation

Compare multiple libraries or frameworks:
- Evaluate alternatives
- Make informed decisions
- Document selection process

### Portfolio Analysis

Analyze your organization's repositories:
- Assess project health
- Identify improvement areas
- Track progress over time

### Market Research

Study competitors and trends:
- Competitive analysis
- Market positioning
- Trend identification

## Best Practices

- Group related repositories for meaningful comparisons
- Use consistent naming conventions
- Schedule regular batch analyses for tracking
- Export results for offline analysis
- Tag batches for easy retrieval

## API Access

Automate batch analysis via API (Enterprise):

```bash
curl -X POST https://api.reporadar.com/v1/batch-analysis \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "repositories": [
      "https://github.com/facebook/react",
      "https://github.com/vuejs/vue"
    ]
  }'
```

## Next Steps

- Upgrade to [Pro or Enterprise](./subscription.md)
- Learn about [API Access](../api-reference/index.md)
- Explore [Analytics Dashboard](./analytics-dashboard.md)
