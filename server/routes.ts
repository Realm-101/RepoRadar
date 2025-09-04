import type { Express, Request } from "express";
import express from "express";
import Stripe from "stripe";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { githubService } from "./github";
import { analyzeRepository, findSimilarRepositories, findSimilarByFunctionality, askAI, generateAIRecommendations } from "./gemini";
import { insertRepositorySchema, insertAnalysisSchema, insertSavedRepositorySchema } from "@shared/schema";
import { stripe, createOrRetrieveStripeCustomer, createSubscription, SUBSCRIPTION_PLANS } from "./stripe";

interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
    };
    access_token: string;
    refresh_token?: string;
    expires_at: number;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // AI Assistant endpoint
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const answer = await askAI(question);
      res.json({ answer });
    } catch (error) {
      console.error("AI Assistant error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Analytics Dashboard endpoint
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getUserAnalyses(userId);
      
      // Calculate statistics
      const now = new Date();
      const thisMonth = analyses.filter((a: any) => {
        const date = new Date(a.createdAt);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      
      const lastMonth = analyses.filter((a: any) => {
        const date = new Date(a.createdAt);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
      });
      
      const avgScore = analyses.length > 0 
        ? analyses.reduce((sum: number, a: any) => sum + ((a.originality + a.completeness + a.marketability + a.monetization + a.usefulness) / 5), 0) / analyses.length
        : 0;
      
      // Language distribution
      const languageCounts: Record<string, number> = {};
      analyses.forEach((a: any) => {
        if (a.primaryLanguage) {
          languageCounts[a.primaryLanguage] = (languageCounts[a.primaryLanguage] || 0) + 1;
        }
      });
      const languages = Object.entries(languageCounts).map(([name, value]) => ({ name, value }));
      
      // Activity data (last 30 days)
      const activity = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = analyses.filter((a: any) => 
          new Date(a.createdAt).toISOString().split('T')[0] === dateStr
        ).length;
        activity.push({ date: dateStr, count });
      }
      
      // Score averages
      const scores = [
        { name: 'Originality', score: analyses.length > 0 ? analyses.reduce((sum: number, a: any) => sum + a.originality, 0) / analyses.length : 0 },
        { name: 'Completeness', score: analyses.length > 0 ? analyses.reduce((sum: number, a: any) => sum + a.completeness, 0) / analyses.length : 0 },
        { name: 'Marketability', score: analyses.length > 0 ? analyses.reduce((sum: number, a: any) => sum + a.marketability, 0) / analyses.length : 0 },
        { name: 'Monetization', score: analyses.length > 0 ? analyses.reduce((sum: number, a: any) => sum + a.monetization, 0) / analyses.length : 0 },
        { name: 'Usefulness', score: analyses.length > 0 ? analyses.reduce((sum: number, a: any) => sum + a.usefulness, 0) / analyses.length : 0 },
      ];
      
      // Monthly trends (last 6 months)
      const trends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toLocaleDateString('en', { month: 'short' });
        const monthAnalyses = analyses.filter((a: any) => {
          const aDate = new Date(a.createdAt);
          return aDate.getMonth() === date.getMonth() && aDate.getFullYear() === date.getFullYear();
        });
        
        trends.push({
          month: monthStr,
          originality: monthAnalyses.length > 0 ? monthAnalyses.reduce((sum: number, a: any) => sum + a.originality, 0) / monthAnalyses.length : 0,
          completeness: monthAnalyses.length > 0 ? monthAnalyses.reduce((sum: number, a: any) => sum + a.completeness, 0) / monthAnalyses.length : 0,
          marketability: monthAnalyses.length > 0 ? monthAnalyses.reduce((sum: number, a: any) => sum + a.marketability, 0) / monthAnalyses.length : 0,
          monetization: monthAnalyses.length > 0 ? monthAnalyses.reduce((sum: number, a: any) => sum + a.monetization, 0) / monthAnalyses.length : 0,
          usefulness: monthAnalyses.length > 0 ? monthAnalyses.reduce((sum: number, a: any) => sum + a.usefulness, 0) / monthAnalyses.length : 0,
        });
      }
      
      // Performance insights
      const performance = [
        { 
          title: 'Best Performing', 
          description: 'Your highest-scoring repository', 
          value: analyses.length > 0 ? Math.max(...analyses.map((a: any) => (a.originality + a.completeness + a.marketability + a.monetization + a.usefulness) / 5)).toFixed(1) : '0',
          unit: 'score'
        },
        { 
          title: 'Improvement Rate', 
          description: 'Score improvement over time', 
          value: '+15',
          unit: '%'
        },
        { 
          title: 'Analysis Frequency', 
          description: 'Average analyses per week', 
          value: (analyses.length / 4).toFixed(0),
          unit: 'repos'
        }
      ];
      
      res.json({
        stats: {
          totalAnalyses: analyses.length,
          thisMonth: thisMonth.length,
          growth: lastMonth.length > 0 ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100) : 0,
          avgScore,
          topLanguage: languages.length > 0 ? languages.sort((a, b) => b.value - a.value)[0].name : 'N/A',
          activeProjects: new Set(analyses.map((a: any) => a.repositoryId)).size
        },
        activity,
        languages,
        scores,
        trends,
        performance,
        recentAnalyses: analyses.slice(0, 10).map((a: any) => ({
          id: a.id,
          name: a.repositoryName,
          owner: a.repositoryOwner,
          language: a.primaryLanguage || 'Unknown',
          score: (a.originality + a.completeness + a.marketability + a.monetization + a.usefulness) / 5,
          date: a.createdAt
        }))
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Stripe subscription endpoint
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const { plan } = req.body;
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;

      if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
        return res.status(400).json({ error: "Invalid subscription plan" });
      }

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Get or create Stripe customer
      const customer = await createOrRetrieveStripeCustomer(userEmail, userId);
      
      // Update user with customer ID
      await storage.updateUserStripeCustomerId(userId, customer.id);

      // Create subscription
      const subscription = await createSubscription(customer.id, plan);

      // Update user with subscription info
      await storage.updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionTier: plan,
        subscriptionStatus: subscription.status,
        subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
      });

      // Return client secret for payment
      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent as any;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      // Note: In production, you should set STRIPE_WEBHOOK_SECRET
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        try {
          // Find user by Stripe customer ID
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (user) {
            await storage.updateUserSubscription(user.id, {
              subscriptionStatus: subscription.status,
              subscriptionEndDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
            });
          }
        } catch (error) {
          console.error('Error updating subscription status:', error);
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', failedInvoice.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Repository search and analysis
  app.get('/api/repositories/search', async (req, res) => {
    try {
      const { q: query, limit = 10 } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      // First try to search in our database
      const localResults = await storage.searchRepositories(query, Number(limit));
      
      // If we have enough local results, return them
      if (localResults.length >= Number(limit)) {
        return res.json(localResults);
      }

      // Otherwise, search GitHub
      const githubResults = await githubService.searchRepositories(query, 'stars', Number(limit));
      
      // Store new repositories in our database
      const repositories = [];
      for (const ghRepo of githubResults) {
        try {
          const languages = await githubService.getRepositoryLanguages(ghRepo.owner.login, ghRepo.name);
          
          const repoData = {
            id: ghRepo.id.toString(),
            name: ghRepo.name,
            fullName: ghRepo.full_name,
            owner: ghRepo.owner.login,
            description: ghRepo.description,
            language: ghRepo.language,
            stars: ghRepo.stargazers_count,
            forks: ghRepo.forks_count,
            watchers: ghRepo.watchers_count,
            size: ghRepo.size,
            isPrivate: ghRepo.private,
            htmlUrl: ghRepo.html_url,
            cloneUrl: ghRepo.clone_url,
            languages,
            topics: ghRepo.topics || [],
          };
          
          const repository = await storage.upsertRepository(repoData);
          repositories.push(repository);
        } catch (error) {
          console.error(`Error storing repository ${ghRepo.full_name}:`, error);
        }
      }

      res.json(repositories);
    } catch (error) {
      console.error("Error searching repositories:", error);
      res.status(500).json({ message: "Failed to search repositories" });
    }
  });

  app.post('/api/repositories/analyze', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "Repository URL is required" });
      }

      const parsed = githubService.parseRepositoryUrl(url);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid GitHub repository URL" });
      }

      const { owner, repo } = parsed;
      
      // Get repository details from GitHub
      const repoDetails = await githubService.getRepositoryWithDetails(owner, repo);
      if (!repoDetails) {
        return res.status(404).json({ message: "Repository not found" });
      }
      const { repository: ghRepo, languages, readme } = repoDetails;
      
      // Store repository in database
      const repoData = {
        id: ghRepo.id.toString(),
        name: ghRepo.name,
        fullName: ghRepo.full_name,
        owner: ghRepo.owner.login,
        description: ghRepo.description,
        language: ghRepo.language,
        stars: ghRepo.stargazers_count,
        forks: ghRepo.forks_count,
        watchers: ghRepo.watchers_count,
        size: ghRepo.size,
        isPrivate: ghRepo.private,
        htmlUrl: ghRepo.html_url,
        cloneUrl: ghRepo.clone_url,
        languages,
        topics: ghRepo.topics || [],
        lastAnalyzed: new Date(),
      };
      
      const repository = await storage.upsertRepository(repoData);

      // Check if analysis already exists
      const existingAnalysis = await storage.getAnalysis(repository.id);
      if (existingAnalysis) {
        return res.json({
          repository,
          analysis: existingAnalysis,
          similar: await storage.getSimilarRepositories(repository.id)
        });
      }

      // Analyze with Gemini
      const analysisResult = await analyzeRepository({
        name: ghRepo.name,
        description: ghRepo.description || '',
        language: ghRepo.language || 'Unknown',
        stars: ghRepo.stargazers_count,
        forks: ghRepo.forks_count,
        size: ghRepo.size,
        languages,
        topics: ghRepo.topics || [],
        readme: readme || undefined,
      });

      // Store analysis
      const analysisData = {
        repositoryId: repository.id,
        userId: (req as any).user?.claims?.sub,
        ...analysisResult,
      };
      
      const validatedAnalysisData = insertAnalysisSchema.parse(analysisData);
      const analysis = await storage.createAnalysis(validatedAnalysisData);

      // Find and store similar repositories
      try {
        const similarRepoNames = await findSimilarRepositories({
          name: ghRepo.name,
          description: ghRepo.description || '',
          language: ghRepo.language || 'Unknown',
          stars: ghRepo.stargazers_count,
          forks: ghRepo.forks_count,
          size: ghRepo.size,
          languages,
          topics: ghRepo.topics || [],
        });

        const similarRepos = [];
        for (const repoName of similarRepoNames) {
          try {
            const parsed = githubService.parseRepositoryUrl(repoName);
            if (parsed) {
              const similarRepoDetails = await githubService.getRepositoryWithDetails(parsed.owner, parsed.repo);
              if (!similarRepoDetails) continue;
              const { repository: similarGhRepo, languages: similarLanguages } = similarRepoDetails;
              
              const similarRepoData = {
                id: similarGhRepo.id.toString(),
                name: similarGhRepo.name,
                fullName: similarGhRepo.full_name,
                owner: similarGhRepo.owner.login,
                description: similarGhRepo.description,
                language: similarGhRepo.language,
                stars: similarGhRepo.stargazers_count,
                forks: similarGhRepo.forks_count,
                watchers: similarGhRepo.watchers_count,
                size: similarGhRepo.size,
                isPrivate: similarGhRepo.private,
                htmlUrl: similarGhRepo.html_url,
                cloneUrl: similarGhRepo.clone_url,
                languages: similarLanguages,
                topics: similarGhRepo.topics || [],
              };
              
              const similarRepo = await storage.upsertRepository(similarRepoData);
              similarRepos.push({
                repositoryId: similarRepo.id,
                similarity: 0.8 // Default similarity score
              });
            }
          } catch (error) {
            console.error(`Error fetching similar repo ${repoName}:`, error);
          }
        }

        if (similarRepos.length > 0) {
          await storage.createSimilarRepositories(repository.id, similarRepos);
        }
      } catch (error) {
        console.error("Error finding similar repositories:", error);
      }

      const similar = await storage.getSimilarRepositories(repository.id);

      res.json({
        repository,
        analysis,
        similar
      });
    } catch (error) {
      console.error("Error analyzing repository:", error);
      res.status(500).json({ message: "Failed to analyze repository" });
    }
  });

  // Recent repositories (must be before :id route)
  app.get('/api/repositories/recent', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const recent = await storage.getRecentRepositories(Number(limit));
      res.json(recent);
    } catch (error) {
      console.error("Error fetching recent repositories:", error);
      res.status(500).json({ message: "Failed to fetch recent repositories" });
    }
  });

  // Trending repositories
  app.get('/api/repositories/trending', async (req, res) => {
    try {
      // Get repositories analyzed in the last 24 hours with high scores
      const trending = await storage.getTrendingRepositories();
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending repositories:", error);
      res.status(500).json({ message: "Failed to fetch trending repositories" });
    }
  });

  // Find similar repositories by functionality
  app.post('/api/repositories/find-similar', async (req, res) => {
    try {
      const { 
        repositoryId, 
        functionality, 
        useCase, 
        technologies,
        minStars,
        maxAge,
        maxResults = 20
      } = req.body;

      let repository;
      let searchParams;

      if (repositoryId) {
        // Find similar to existing repository
        repository = await storage.getRepository(repositoryId);
        if (!repository) {
          return res.status(404).json({ message: "Repository not found" });
        }
        
        searchParams = {
          name: repository.name,
          description: repository.description || '',
          language: repository.language || 'Unknown',
          topics: repository.topics || [],
          functionality: functionality || repository.description,
          useCase,
          technologies: technologies || (repository.languages ? Object.keys(repository.languages) : [])
        };
      } else if (functionality || useCase || (technologies && technologies.length > 0)) {
        // Search based on provided criteria (at least one field is required)
        searchParams = {
          name: 'Custom Search',
          description: functionality || useCase || (technologies && technologies.length > 0 ? `Projects using ${technologies.join(', ')}` : ''),
          language: 'Any',
          topics: [],
          functionality: functionality || undefined,
          useCase: useCase || undefined,
          technologies: technologies || []
        };
      } else {
        return res.status(400).json({ message: "Please provide at least one search criteria (functionality, use case, or technologies)" });
      }

      // Add filters to search params
      if (minStars !== undefined) {
        (searchParams as any).minStars = minStars;
      }
      if (maxAge && maxAge !== 'any') {
        (searchParams as any).maxAge = maxAge;
      }
      
      // Use enhanced AI search
      const { repositories: similarRepoNames, reasoning, similarity_scores } = 
        await findSimilarByFunctionality(searchParams);

      // Fetch details for each similar repository
      const similarRepos = [];
      for (const repoName of similarRepoNames) {
        try {
          const parsed = githubService.parseRepositoryUrl(repoName);
          if (!parsed) continue;
          
          const repoDetails = await githubService.getRepositoryWithDetails(parsed.owner, parsed.repo);
          if (!repoDetails) continue;
          
          const { repository: ghRepo, languages } = repoDetails;
          
          // Apply filters
          if (minStars && ghRepo.stargazers_count < minStars) {
            continue;
          }
          
          if (maxAge && maxAge !== 'any') {
            const createdDate = new Date((ghRepo as any).created_at);
            const now = new Date();
            const ageMap: { [key: string]: number } = {
              '1month': 30,
              '3months': 90,
              '6months': 180,
              '1year': 365,
              '2years': 730
            };
            const maxDays = ageMap[maxAge];
            if (maxDays) {
              const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
              if (daysSinceCreated > maxDays) {
                continue;
              }
            }
          }
          
          const repoData = {
            id: ghRepo.id.toString(),
            name: ghRepo.name,
            fullName: ghRepo.full_name,
            owner: ghRepo.owner.login,
            description: ghRepo.description,
            language: ghRepo.language,
            stars: ghRepo.stargazers_count,
            forks: ghRepo.forks_count,
            watchers: ghRepo.watchers_count,
            size: ghRepo.size,
            isPrivate: ghRepo.private,
            htmlUrl: ghRepo.html_url,
            cloneUrl: ghRepo.clone_url,
            languages,
            topics: ghRepo.topics || [],
            createdAt: (ghRepo as any).created_at,
            updatedAt: (ghRepo as any).updated_at
          };
          
          const savedRepo = await storage.upsertRepository(repoData);
          
          similarRepos.push({
            repository: savedRepo,
            similarity: similarity_scores[repoName] || 50,
            name: repoName
          });
          
          // Cap results at specified maximum
          if (similarRepos.length >= maxResults) {
            break;
          }
        } catch (error) {
          console.error(`Error fetching similar repo ${repoName}:`, error);
        }
      }

      res.json({
        similar: similarRepos,
        reasoning,
        searchParams
      });
    } catch (error) {
      console.error("Error finding similar repositories:", error);
      res.status(500).json({ message: "Failed to find similar repositories" });
    }
  });

  app.get('/api/repositories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const repository = await storage.getRepository(id);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }

      const analysis = await storage.getAnalysis(id);
      const similar = await storage.getSimilarRepositories(id);
      
      let isSaved = false;
      if ((req as any).user?.claims?.sub) {
        isSaved = await storage.isRepositorySaved((req as any).user.claims.sub, id);
      }

      res.json({
        repository,
        analysis,
        similar,
        isSaved
      });
    } catch (error) {
      console.error("Error fetching repository:", error);
      res.status(500).json({ message: "Failed to fetch repository" });
    }
  });

  // Recent analyses
  app.get('/api/analyses/recent', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const analyses = await storage.getRecentAnalyses(undefined, Number(limit));
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching recent analyses:", error);
      res.status(500).json({ message: "Failed to fetch recent analyses" });
    }
  });

  // Saved repositories (protected routes)
  app.post('/api/saved-repositories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { repositoryId } = req.body;
      
      if (!repositoryId) {
        return res.status(400).json({ message: "Repository ID is required" });
      }

      const data = { userId, repositoryId };
      const validatedData = insertSavedRepositorySchema.parse(data);
      
      const savedRepo = await storage.saveRepository(validatedData.userId, validatedData.repositoryId);
      res.json(savedRepo);
    } catch (error) {
      console.error("Error saving repository:", error);
      res.status(500).json({ message: "Failed to save repository" });
    }
  });

  app.delete('/api/saved-repositories/:repositoryId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { repositoryId } = req.params;
      
      await storage.unsaveRepository(userId, repositoryId);
      res.json({ message: "Repository unsaved successfully" });
    } catch (error) {
      console.error("Error unsaving repository:", error);
      res.status(500).json({ message: "Failed to unsave repository" });
    }
  });

  app.get('/api/saved-repositories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const savedRepos = await storage.getSavedRepositories(userId);
      res.json(savedRepos);
    } catch (error) {
      console.error("Error fetching saved repositories:", error);
      res.status(500).json({ message: "Failed to fetch saved repositories" });
    }
  });

  // User Profile & Preferences Routes (Protected - Pro/Enterprise only)
  app.get('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const preferences = await storage.updateUserPreferences(userId, req.body);
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Bookmarks Routes
  app.get('/api/user/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/user/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const { repositoryId, notes } = req.body;
      const bookmark = await storage.addBookmark(userId, repositoryId, notes);
      
      // Track activity
      await storage.trackActivity(userId, 'bookmarked', repositoryId);
      
      res.json(bookmark);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/user/bookmarks/:repositoryId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      await storage.removeBookmark(userId, req.params.repositoryId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tags Routes
  app.get('/api/user/tags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const tags = await storage.getUserTags(userId);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/user/tags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const { name, color } = req.body;
      const tag = await storage.createTag(userId, name, color);
      res.json(tag);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/repositories/:repositoryId/tags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const { tagId } = req.body;
      await storage.tagRepository(req.params.repositoryId, tagId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Collections Routes  
  app.get('/api/user/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const collections = await storage.getUserCollections(userId);
      res.json(collections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/user/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const collection = await storage.createCollection(userId, req.body);
      res.json(collection);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/collections/:collectionId/items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      const { repositoryId, notes } = req.body;
      const item = await storage.addToCollection(
        parseInt(req.params.collectionId),
        repositoryId,
        notes
      );
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Recommendations Route
  app.get('/api/user/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'enterprise')) {
        return res.status(403).json({ message: "This feature is available for Pro and Enterprise users only" });
      }

      // Get user preferences and recent activity
      const preferences = await storage.getUserPreferences(userId);
      const recentActivity = await storage.getUserRecentActivity(userId);
      
      // Generate AI recommendations based on user profile
      const recommendations = await generateAIRecommendations(userId, preferences, recentActivity);
      
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Repository Tracking Endpoints
  app.post('/api/repositories/:repositoryId/track', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { repositoryId } = req.params;
      const { trackingType = 'all' } = req.body;
      
      // Check if repository exists
      const repository = await storage.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Add tracking
      const tracked = await storage.trackRepository(userId, repositoryId, trackingType);
      
      // Send initial notification
      await storage.createNotification({
        userId,
        type: 'repo_update',
        title: 'Repository Tracking Started',
        message: `You are now tracking ${repository.fullName}`,
        repositoryId,
        metadata: { trackingType }
      });
      
      res.json(tracked);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/repositories/:repositoryId/track', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { repositoryId } = req.params;
      
      await storage.untrackRepository(userId, repositoryId);
      res.json({ message: "Repository untracked successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/user/tracked-repositories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tracked = await storage.getTrackedRepositories(userId);
      res.json(tracked);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notifications Endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { unreadOnly = false } = req.query;
      
      const notifications = await storage.getUserNotifications(
        userId, 
        unreadOnly === 'true'
      );
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/notifications/:notificationId/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { notificationId } = req.params;
      
      await storage.markNotificationAsRead(parseInt(notificationId), userId);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/notifications/:notificationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { notificationId } = req.params;
      
      await storage.deleteNotification(parseInt(notificationId), userId);
      res.json({ message: "Notification deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Comments Endpoints
  app.get('/api/repositories/:repositoryId/comments', async (req, res) => {
    try {
      const { repositoryId } = req.params;
      const comments = await storage.getRepositoryComments(repositoryId);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/repositories/:repositoryId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { repositoryId } = req.params;
      const { content, parentId } = req.body;
      
      const comment = await storage.createComment({
        userId,
        repositoryId,
        content,
        parentId,
      });
      
      res.json(comment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/comments/:commentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      const { content } = req.body;
      
      const updated = await storage.updateComment(parseInt(commentId), userId, content);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/comments/:commentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      
      await storage.deleteComment(parseInt(commentId), userId);
      res.json({ message: "Comment deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/comments/:commentId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      
      await storage.likeComment(parseInt(commentId), userId);
      res.json({ message: "Comment liked" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/comments/:commentId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      
      await storage.unlikeComment(parseInt(commentId), userId);
      res.json({ message: "Like removed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Collections Endpoints
  app.get('/api/collections/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.claims.sub;
      
      // Only allow users to view their own collections for now
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "Cannot view other users' collections" });
      }
      
      const collections = await storage.getUserCollections(userId);
      res.json(collections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, color } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Collection name is required" });
      }
      
      const collection = await storage.createCollection({
        userId,
        name: name.trim(),
        description: description || null,
        color: color || '#FF6B35',
      });
      
      res.json(collection);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/collections/:collectionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { collectionId } = req.params;
      
      await storage.deleteCollection(parseInt(collectionId), userId);
      res.json({ message: "Collection deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/collections/:collectionId/repositories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { collectionId } = req.params;
      const { repositoryId } = req.body;
      
      if (!repositoryId) {
        return res.status(400).json({ message: "Repository ID is required" });
      }
      
      const item = await storage.addRepositoryToCollection(
        parseInt(collectionId),
        repositoryId,
        userId
      );
      
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/collections/:collectionId/repositories/:repositoryId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { collectionId, repositoryId } = req.params;
      
      await storage.removeRepositoryFromCollection(
        parseInt(collectionId),
        repositoryId,
        userId
      );
      
      res.json({ message: "Repository removed from collection" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Ratings Endpoints
  app.get('/api/repositories/:repositoryId/ratings', async (req, res) => {
    try {
      const { repositoryId } = req.params;
      const ratings = await storage.getRepositoryRatings(repositoryId);
      const { average, count } = await storage.getRepositoryAverageRating(repositoryId);
      
      res.json({
        ratings,
        average,
        count,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/repositories/:repositoryId/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { repositoryId } = req.params;
      const { rating, review } = req.body;
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      const newRating = await storage.createOrUpdateRating({
        userId,
        repositoryId,
        rating,
        review,
      });
      
      res.json(newRating);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/ratings/:ratingId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ratingId } = req.params;
      
      await storage.deleteRating(parseInt(ratingId), userId);
      res.json({ message: "Rating deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/ratings/:ratingId/helpful', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ratingId } = req.params;
      
      await storage.markRatingHelpful(parseInt(ratingId), userId);
      res.json({ message: "Marked as helpful" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/ratings/:ratingId/helpful', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ratingId } = req.params;
      
      await storage.unmarkRatingHelpful(parseInt(ratingId), userId);
      res.json({ message: "Removed helpful mark" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // API Key Management
  app.get('/api/developer/keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const keys = await storage.getUserApiKeys(userId);
      res.json(keys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ message: 'Failed to fetch API keys' });
    }
  });

  app.post('/api/developer/keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, permissions, expiresAt } = req.body;
      
      // Generate a secure API key
      const key = 'rk_' + Array.from({ length: 32 }, () => 
        Math.random().toString(36)[2] || '0'
      ).join('');
      
      const apiKey = await storage.createApiKey({
        userId,
        key,
        name,
        description,
        permissions: permissions || ['read'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      
      res.json(apiKey);
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  });

  app.delete('/api/developer/keys/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const keyId = parseInt(req.params.id);
      
      await storage.deleteApiKey(keyId, userId);
      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ message: 'Failed to delete API key' });
    }
  });

  app.get('/api/developer/keys/:id/usage', isAuthenticated, async (req: any, res) => {
    try {
      const keyId = parseInt(req.params.id);
      const usage = await storage.getApiUsageStats(keyId);
      res.json(usage);
    } catch (error) {
      console.error('Error fetching API usage:', error);
      res.status(500).json({ message: 'Failed to fetch API usage' });
    }
  });

  // Webhook Management
  app.get('/api/developer/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const webhooks = await storage.getUserWebhooks(userId);
      res.json(webhooks);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      res.status(500).json({ message: 'Failed to fetch webhooks' });
    }
  });

  app.post('/api/developer/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { url, events } = req.body;
      
      // Generate webhook secret
      const secret = Array.from({ length: 32 }, () => 
        Math.random().toString(36)[2] || '0'
      ).join('');
      
      const webhook = await storage.createWebhook({
        userId,
        url,
        events: events || ['repository.analyzed'],
        secret,
      });
      
      res.json(webhook);
    } catch (error) {
      console.error('Error creating webhook:', error);
      res.status(500).json({ message: 'Failed to create webhook' });
    }
  });

  app.delete('/api/developer/webhooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const webhookId = parseInt(req.params.id);
      
      await storage.deleteWebhook(webhookId, userId);
      res.json({ message: 'Webhook deleted successfully' });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({ message: 'Failed to delete webhook' });
    }
  });

  // Public API endpoints with API key authentication
  const authenticateApiKey = async (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const key = await storage.getApiKeyByKey(apiKey);
    
    if (!key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }
    
    // Check rate limit
    const usage = await storage.getApiUsageStats(key.id, 1);
    const totalRequests = usage.reduce((sum: number, u: any) => sum + u.count, 0);
    
    if (totalRequests >= (key.rateLimit || 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    // Log usage
    const startTime = Date.now();
    res.on('finish', async () => {
      await storage.logApiUsage({
        apiKeyId: key.id,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: Date.now() - startTime,
      });
      await storage.updateApiKeyLastUsed(key.id);
    });
    
    req.apiKey = key;
    next();
  };

  // Public API v1 endpoints
  app.get('/api/v1/repositories/search', authenticateApiKey, async (req: any, res) => {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!req.apiKey.permissions?.includes('read')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const repositories = await storage.searchRepositories(q as string, parseInt(limit as string));
      res.json({ data: repositories });
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/v1/repositories/:id', authenticateApiKey, async (req: any, res) => {
    try {
      if (!req.apiKey.permissions?.includes('read')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const repository = await storage.getRepository(req.params.id);
      
      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      
      res.json({ data: repository });
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/v1/repositories/:id/analysis', authenticateApiKey, async (req: any, res) => {
    try {
      if (!req.apiKey.permissions?.includes('read')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const analysis = await storage.getAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      
      res.json({ data: analysis });
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/v1/repositories/analyze', authenticateApiKey, async (req: any, res) => {
    try {
      if (!req.apiKey.permissions?.includes('write')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const { repositoryUrl } = req.body;
      
      if (!repositoryUrl) {
        return res.status(400).json({ error: 'Repository URL required' });
      }
      
      // Parse repository information
      const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid GitHub repository URL' });
      }
      
      const [, owner, name] = match;
      const fullName = `${owner}/${name}`;
      
      // Fetch repository data from GitHub
      const response = await fetch(`https://api.github.com/repos/${fullName}`);
      
      if (!response.ok) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      
      const repoData = await response.json();
      
      // Store repository
      const repository = await storage.upsertRepository({
        id: repoData.id.toString(),
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        htmlUrl: repoData.html_url,
        cloneUrl: repoData.clone_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        size: repoData.size,
        language: repoData.language,
        topics: repoData.topics || [],
        owner: repoData.owner.login,
        isPrivate: repoData.private,
        languages: {}, // Will be populated later if needed
      });
      
      // Prepare repository data for analysis
      const repoForAnalysis = {
        name: repository.name,
        description: repository.description || 'No description provided',
        language: repository.language || 'Unknown',
        stars: repository.stars || 0,
        forks: repository.forks || 0,
        size: repository.size || 0,
        languages: repository.languages as Record<string, number> || {},
        topics: repository.topics || [],
      };
      
      // Perform analysis using existing gemini service
      const geminiAnalysis = await analyzeRepository(repoForAnalysis);
      
      // Extract string arrays from enhanced format
      const strengths = Array.isArray(geminiAnalysis.strengths) && typeof geminiAnalysis.strengths[0] === 'object' 
        ? geminiAnalysis.strengths.map((s: any) => s.point || s) 
        : geminiAnalysis.strengths;
      
      const weaknesses = Array.isArray(geminiAnalysis.weaknesses) && typeof geminiAnalysis.weaknesses[0] === 'object'
        ? geminiAnalysis.weaknesses.map((w: any) => w.point || w)
        : geminiAnalysis.weaknesses;
      
      const recommendations = Array.isArray(geminiAnalysis.recommendations) && typeof geminiAnalysis.recommendations[0] === 'object'
        ? geminiAnalysis.recommendations.map((r: any) => r.suggestion || r)
        : geminiAnalysis.recommendations;
      
      const analysis = await storage.createAnalysis({
        repositoryId: repository.id,
        userId: req.apiKey.userId,
        originality: geminiAnalysis.originality,
        completeness: geminiAnalysis.completeness,
        marketability: geminiAnalysis.marketability,
        monetization: geminiAnalysis.monetization,
        usefulness: geminiAnalysis.usefulness,
        overallScore: geminiAnalysis.overallScore,
        summary: geminiAnalysis.summary,
        strengths,
        weaknesses,
        recommendations,
      });
      
      res.json({ data: { repository, analysis } });
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Teams endpoints
  app.get('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: 'Failed to fetch teams' });
    }
  });

  app.post('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Team name is required' });
      }
      
      const team = await storage.createTeam({
        name,
        description,
        ownerId: userId,
      });
      
      res.json(team);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ message: 'Failed to create team' });
    }
  });

  app.get('/api/teams/:teamId/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { teamId } = req.params;
      
      // Check if user is member of the team
      const isMember = await storage.isTeamMember(teamId, userId);
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
  });

  app.post('/api/teams/:teamId/invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { teamId } = req.params;
      const { email, role } = req.body;
      
      // Check if user has permission to invite
      const memberRole = await storage.getTeamMemberRole(teamId, userId);
      if (!memberRole || (memberRole !== 'owner' && memberRole !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const invitation = await storage.createTeamInvitation({
        teamId,
        email,
        role: role || 'member',
        invitedBy: userId,
      });
      
      res.json(invitation);
    } catch (error) {
      console.error('Error creating invitation:', error);
      res.status(500).json({ message: 'Failed to create invitation' });
    }
  });

  app.patch('/api/teams/:teamId/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { teamId, memberId } = req.params;
      const { role } = req.body;
      
      // Check if user has permission to update roles
      const memberRole = await storage.getTeamMemberRole(teamId, userId);
      if (!memberRole || (memberRole !== 'owner' && memberRole !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await storage.updateTeamMemberRole(memberId, role);
      res.json({ message: 'Role updated successfully' });
    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({ message: 'Failed to update member role' });
    }
  });

  app.delete('/api/teams/:teamId/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { teamId, memberId } = req.params;
      
      // Check if user has permission to remove members
      const memberRole = await storage.getTeamMemberRole(teamId, userId);
      if (!memberRole || memberRole !== 'owner') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await storage.removeTeamMember(memberId);
      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ message: 'Failed to remove member' });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const userConnections = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req) => {
    // Parse user ID from connection (you might need to implement auth for WebSocket)
    let userId: string | null = null;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'authenticate') {
          userId = message.userId;
          if (userId) {
            userConnections.set(userId, ws);
            ws.send(JSON.stringify({ type: 'authenticated', message: 'Connected to notification service' }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        userConnections.delete(userId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Function to send real-time notifications
  const sendRealtimeNotification = (userId: string, notification: any) => {
    const ws = userConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
    }
  };

  // Make sendRealtimeNotification available globally
  (global as any).sendRealtimeNotification = sendRealtimeNotification;

  return httpServer;
}
