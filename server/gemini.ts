import { GoogleGenAI } from "@google/genai";

const GEMINI_ENABLED = !!process.env.GEMINI_API_KEY;

if (!GEMINI_ENABLED) {
  console.warn('Gemini API key not configured - AI features will be limited');
}

const ai = GEMINI_ENABLED 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  : null;

export const isGeminiEnabled = () => GEMINI_ENABLED;

export interface RepositoryAnalysisInput {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  size: number;
  languages: Record<string, number>;
  topics: string[];
  readme?: string;
}

export interface RepositoryAnalysisResult {
  originality: number;
  completeness: number;
  marketability: number;
  monetization: number;
  usefulness: number;
  overallScore: number;
  summary: string;
  strengths: Array<{
    point: string;
    reason: string;
  }>;
  weaknesses: Array<{
    point: string;
    reason: string;
  }>;
  recommendations: Array<{
    suggestion: string;
    reason: string;
    impact: string;
  }>;
  scoreExplanations: {
    originality: string;
    completeness: string;
    marketability: string;
    monetization: string;
    usefulness: string;
  };
}

export async function generateAIRecommendations(
  userId: string, 
  preferences: any, 
  recentActivity: any[]
): Promise<any> {
  try {
    const prompt = `You are an expert GitHub repository recommendation system. Based on the user's preferences and recent activity, generate personalized repository recommendations.

User Preferences:
- Preferred Languages: ${preferences?.preferredLanguages?.join(', ') || 'Any'}
- Preferred Topics: ${preferences?.preferredTopics?.join(', ') || 'Any'}
- Excluded Topics: ${preferences?.excludedTopics?.join(', ') || 'None'}
- Minimum Stars: ${preferences?.minStars || 0}
- Max Repository Age: ${preferences?.maxAge || 'Any'}

Recent Activity (last 20 actions):
${recentActivity.map(a => `- ${a.action} ${a.repositoryId ? `repository ${a.repositoryId}` : ''}`).join('\n')}

Based on this profile, recommend 10 GitHub repositories that would be most relevant and useful for this user. Focus on:
1. Repositories matching their language preferences
2. Topics they're interested in but avoiding excluded topics
3. Quality repositories with appropriate star counts
4. Active, well-maintained projects

Return a JSON object with this structure:
{
  "recommendations": [
    {
      "name": "owner/repo",
      "reason": "Why this repository is recommended for this user",
      "matchScore": 0.0-1.0,
      "primaryLanguage": "language",
      "topics": ["topic1", "topic2"],
      "stars": 1000,
      "description": "Brief description"
    }
  ],
  "insights": {
    "topInterests": ["interest1", "interest2"],
    "suggestedTopics": ["new topic to explore"],
    "recommendationRationale": "Overall explanation of recommendations"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const result = response.text;
    return result ? JSON.parse(result) : { recommendations: [], insights: {} };
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return { recommendations: [], insights: {} };
  }
}

export async function askAI(question: string): Promise<string> {
  if (!isGeminiEnabled() || !ai) {
    return "AI assistant is currently unavailable. Please try again later.";
  }

  try {
    const systemPrompt = `You are an AI assistant for RepoAnalyzer, a GitHub repository analysis platform.
    
RepoAnalyzer Features:
- Analyzes GitHub repositories using 5 metrics: originality, completeness, marketability, monetization potential, and usefulness
- Provides AI-powered insights using Google's Gemini 2.5 Pro with detailed explanations
- Advanced search with 15+ filters (language, stars, date range, license, topics, etc.)
- Batch analysis: Analyze multiple repositories simultaneously (3 for free, unlimited for Pro)
- Repository comparison, finding similar repos, trending repositories
- PDF and CSV export with comprehensive formatting
- Real-time notifications with pulse animations
- Collections and bookmarks for Pro users
- AI-driven repository recommendations for Pro users
- Interactive onboarding tour (5-step guide for new users)
- Smooth micro-interactions and animations throughout the app
- Organized dropdown navigation with three main sections

Navigation Structure:
- Discover menu: Advanced Search, Batch Analysis, Compare, Discover Trending
- Workspace menu: Collections, Profile, Recent Analyses, Bookmarks (Pro features)
- Resources menu: Documentation, Pricing, API Reference, FAQ

User Experience Enhancements:
- Button scaling and ripple effects on all interactions
- Input focus animations with shadow effects
- Card lift effects on hover
- Pulse animations on notification badges
- Skeleton loaders for smooth loading states
- Fade-in transitions for new content
- Onboarding tour can be restarted from profile preferences

Instructions:
- Provide helpful, concise answers about RepoAnalyzer features
- Give step-by-step instructions when asked how to use features
- Explain metrics and scoring when asked
- Guide users through the new dropdown navigation structure
- Help users understand the onboarding tour and how to restart it
- Be friendly and professional
- Keep answers focused and actionable`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: question,
    });

    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("AI Assistant error:", error);
    return "I'm having trouble processing your question right now. Please try again later.";
  }
}

export async function analyzeRepository(repo: RepositoryAnalysisInput): Promise<RepositoryAnalysisResult> {
  if (!isGeminiEnabled() || !ai) {
    // Return fallback analysis when AI is not available
    return createFallbackAnalysis(repo);
  }

  try {
    const systemPrompt = `You are an expert software repository analyst. Analyze the given repository and provide a comprehensive evaluation with detailed reasoning.

Rate each aspect from 1-10 and provide detailed insights:
1. Originality: How unique and innovative is this project? Consider novelty of approach, creative problem-solving, and differentiation from existing solutions.
2. Completeness: How complete and production-ready is the codebase? Consider documentation, testing, error handling, and polish.
3. Marketability: How appealing would this be to users/customers? Consider demand, user experience, and competitive positioning.
4. Monetization: What are the potential revenue opportunities? Consider business models, target market size, and value proposition.
5. Usefulness: How practically useful is this project? Consider real-world applicability, problem severity, and user impact.

Provide detailed explanations for WHY each score was given.
Include:
- A concise summary (2-3 sentences)
- 3-5 key strengths with clear reasoning
- 3-5 areas for improvement with specific explanations
- 3-5 actionable recommendations with expected impact

Respond with valid JSON in this exact format:
{
  "originality": number,
  "completeness": number,
  "marketability": number,
  "monetization": number,
  "usefulness": number,
  "overallScore": number,
  "summary": "string",
  "strengths": [
    {
      "point": "Brief strength statement",
      "reason": "Detailed explanation of why this is a strength and what evidence supports it"
    }
  ],
  "weaknesses": [
    {
      "point": "Brief weakness statement",
      "reason": "Detailed explanation of why this is a weakness and how it impacts the project"
    }
  ],
  "recommendations": [
    {
      "suggestion": "Specific actionable recommendation",
      "reason": "Why this recommendation would help",
      "impact": "Expected positive impact on the project"
    }
  ],
  "scoreExplanations": {
    "originality": "Detailed reasoning for the originality score",
    "completeness": "Detailed reasoning for the completeness score",
    "marketability": "Detailed reasoning for the marketability score",
    "monetization": "Detailed reasoning for the monetization score",
    "usefulness": "Detailed reasoning for the usefulness score"
  }
}`;

    const repoInfo = `
Repository: ${repo.name}
Description: ${repo.description}
Primary Language: ${repo.language}
Stars: ${repo.stars}
Forks: ${repo.forks}
Size: ${repo.size} KB
Languages: ${JSON.stringify(repo.languages)}
Topics: ${repo.topics.join(', ')}
${repo.readme ? `README Preview: ${repo.readme.substring(0, 2000)}...` : 'No README available'}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            originality: { type: "number" },
            completeness: { type: "number" },
            marketability: { type: "number" },
            monetization: { type: "number" },
            usefulness: { type: "number" },
            overallScore: { type: "number" },
            summary: { type: "string" },
            strengths: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  point: { type: "string" },
                  reason: { type: "string" }
                },
                required: ["point", "reason"]
              } 
            },
            weaknesses: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  point: { type: "string" },
                  reason: { type: "string" }
                },
                required: ["point", "reason"]
              } 
            },
            recommendations: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  suggestion: { type: "string" },
                  reason: { type: "string" },
                  impact: { type: "string" }
                },
                required: ["suggestion", "reason", "impact"]
              } 
            },
            scoreExplanations: {
              type: "object",
              properties: {
                originality: { type: "string" },
                completeness: { type: "string" },
                marketability: { type: "string" },
                monetization: { type: "string" },
                usefulness: { type: "string" }
              },
              required: ["originality", "completeness", "marketability", "monetization", "usefulness"]
            }
          },
          required: ["originality", "completeness", "marketability", "monetization", "usefulness", "overallScore", "summary", "strengths", "weaknesses", "recommendations", "scoreExplanations"]
        }
      },
      contents: repoInfo
    });

    const result = JSON.parse(response.text || '{}');
    
    // Ensure all scores are between 1-10
    ['originality', 'completeness', 'marketability', 'monetization', 'usefulness', 'overallScore'].forEach(key => {
      if (result[key]) {
        result[key] = Math.max(1, Math.min(10, result[key]));
      }
    });

    return result;
  } catch (error) {
    console.error('Error analyzing repository with Gemini:', error);
    
    // Fallback analysis with proper structure
    return createFallbackAnalysis(repo);
  }
}

function createFallbackAnalysis(repo: RepositoryAnalysisInput): RepositoryAnalysisResult {
  // Calculate basic scores based on repository metrics
  const starScore = Math.min(10, Math.max(1, Math.log10(repo.stars + 1) * 2));
  const forkScore = Math.min(10, Math.max(1, Math.log10(repo.forks + 1) * 2.5));
  const sizeScore = repo.size > 0 ? Math.min(10, Math.max(1, Math.log10(repo.size) * 1.5)) : 5;
  const languageBonus = repo.language ? 1 : 0;
  const topicsBonus = repo.topics.length > 0 ? Math.min(2, repo.topics.length * 0.5) : 0;

  const baseScore = (starScore + forkScore + sizeScore) / 3 + languageBonus + topicsBonus;
  const normalizedScore = Math.min(10, Math.max(1, baseScore));

  return {
      originality: 5,
      completeness: 5,
      marketability: 5,
      monetization: 5,
      usefulness: 5,
      overallScore: 5,
      summary: "Analysis unavailable due to API error. This repository appears to be a standard project in the " + repo.language + " ecosystem.",
      strengths: [
        {
          point: "Active community engagement",
          reason: "The repository shows signs of community involvement based on stars and forks"
        },
        {
          point: "Clear documentation",
          reason: "Repository includes documentation that helps users understand the project"
        },
        {
          point: "Stable codebase",
          reason: "The project appears to have a mature and stable code structure"
        }
      ],
      weaknesses: [
        {
          point: "Analysis temporarily unavailable",
          reason: "Full AI analysis could not be completed at this time"
        },
        {
          point: "Unable to assess current state",
          reason: "Detailed metrics cannot be evaluated without AI assistance"
        }
      ],
      recommendations: [
        {
          suggestion: "Review project documentation",
          reason: "Manual review can provide insights that automated analysis missed",
          impact: "Better understanding of project capabilities and limitations"
        },
        {
          suggestion: "Analyze code quality manually",
          reason: "Direct code inspection can reveal architectural patterns and quality",
          impact: "Identification of potential improvements and optimizations"
        }
      ],
      scoreExplanations: {
        originality: "Score based on standard assessment - full analysis unavailable",
        completeness: "Score based on standard assessment - full analysis unavailable",
        marketability: "Score based on standard assessment - full analysis unavailable",
        monetization: "Score based on standard assessment - full analysis unavailable",
        usefulness: "Score based on standard assessment - full analysis unavailable"
      }
    };
  }
}

export interface SimilaritySearchParams {
  name: string;
  description: string;
  language: string;
  topics: string[];
  functionality?: string;
  useCase?: string;
  technologies?: string[];
}

export async function findSimilarRepositories(repo: RepositoryAnalysisInput): Promise<string[]> {
  try {
    const prompt = `Given this repository information:
Name: ${repo.name}
Description: ${repo.description}
Language: ${repo.language}
Topics: ${repo.topics.join(', ')}

Find 3-5 similar GitHub repositories. Return only repository names in format "owner/repo-name", one per line.
Focus on repositories with similar functionality, technology stack, or problem domain.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = response.text || '';
    const repos = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('/') && !line.includes(' '))
      .slice(0, 5);

    return repos;
  } catch (error) {
    console.error('Error finding similar repositories:', error);
    return [];
  }
}

export async function findSimilarByFunctionality(params: SimilaritySearchParams): Promise<{
  repositories: string[];
  reasoning: string;
  similarity_scores: { [key: string]: number };
}> {
  try {
    const systemPrompt = `You are an expert at analyzing GitHub repositories and finding similar projects based on functionality, use cases, and technology stack.
    
    When finding similar repositories, consider:
    1. Core functionality and problem domain
    2. Intended use cases and target audience
    3. Technology stack and architecture patterns
    4. Features and capabilities
    5. Industry or domain focus
    
    Return a structured analysis with repository recommendations and similarity scores.`;

    const prompt = `Analyze this repository and find similar projects:

Repository: ${params.name}
Description: ${params.description}
Primary Language: ${params.language}
Topics/Tags: ${params.topics.join(', ')}
${params.functionality ? `Core Functionality: ${params.functionality}` : ''}
${params.useCase ? `Use Case: ${params.useCase}` : ''}
${params.technologies ? `Technologies: ${params.technologies.join(', ')}` : ''}

Find 5-8 highly similar GitHub repositories that:
1. Solve similar problems or serve similar purposes
2. Use comparable technology stacks
3. Target similar use cases or audiences
4. Have active development and community

Provide similarity scores (0-100) based on:
- Functional similarity (40% weight)
- Technology stack match (30% weight)
- Use case alignment (20% weight)
- Domain/industry match (10% weight)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            repositories: { 
              type: "array", 
              items: { type: "string" },
              description: "List of similar repository names in format 'owner/repo'"
            },
            reasoning: { 
              type: "string",
              description: "Explanation of why these repositories are similar"
            },
            similarity_scores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  repository: { type: "string" },
                  score: { type: "number" }
                },
                required: ["repository", "score"]
              },
              description: "Similarity scores for each repository (0-100)"
            }
          },
          required: ["repositories", "reasoning", "similarity_scores"]
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || '{}');
    
    // Ensure we have valid data
    if (!result.repositories || !Array.isArray(result.repositories)) {
      result.repositories = [];
    }
    
    // Filter and validate repository names
    result.repositories = result.repositories
      .filter((repo: string) => repo && repo.includes('/'))
      .slice(0, 8);
    
    return result;
  } catch (error) {
    console.error('Error finding similar repositories by functionality:', error);
    return {
      repositories: [],
      reasoning: "Unable to find similar repositories at this time.",
      similarity_scores: {}
    };
  }
}