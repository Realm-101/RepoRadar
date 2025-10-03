import { AppError, ErrorCodes } from '@shared/errors';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  private: boolean;
  html_url: string;
  clone_url: string;
  topics: string[];
}

export interface RepositoryLanguages {
  [language: string]: number;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';

  /**
   * Handle GitHub API errors and convert to AppError
   */
  private async handleGitHubError(response: Response, context: string): Promise<never> {
    const status = response.status;
    
    // Rate limit error
    if (status === 403 || status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : undefined;
      
      throw new AppError(
        ErrorCodes.RATE_LIMIT_EXCEEDED.code,
        `GitHub API rate limit exceeded during ${context}`,
        ErrorCodes.RATE_LIMIT_EXCEEDED.userMessage,
        ErrorCodes.RATE_LIMIT_EXCEEDED.statusCode,
        ErrorCodes.RATE_LIMIT_EXCEEDED.recoveryAction,
        resetDate ? { 
          resetTime: resetDate.toISOString(),
          resetTimeFormatted: resetDate.toLocaleString()
        } : undefined
      );
    }
    
    // Not found error
    if (status === 404) {
      throw new AppError(
        ErrorCodes.NOT_FOUND.code,
        `GitHub resource not found during ${context}`,
        'Repository not found. It may be private or does not exist.',
        ErrorCodes.NOT_FOUND.statusCode,
        'Verify the repository exists and is publicly accessible'
      );
    }
    
    // Unauthorized error
    if (status === 401) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED.code,
        `GitHub API authentication failed during ${context}`,
        ErrorCodes.UNAUTHORIZED.userMessage,
        ErrorCodes.UNAUTHORIZED.statusCode,
        ErrorCodes.UNAUTHORIZED.recoveryAction
      );
    }
    
    // Forbidden error (different from rate limit)
    if (status === 403) {
      throw new AppError(
        ErrorCodes.FORBIDDEN.code,
        `GitHub API access forbidden during ${context}`,
        'Access to this repository is forbidden.',
        ErrorCodes.FORBIDDEN.statusCode,
        'Check if the repository is private or requires authentication'
      );
    }
    
    // Generic external API error
    throw new AppError(
      ErrorCodes.EXTERNAL_API_ERROR.code,
      `GitHub API error ${status} during ${context}`,
      ErrorCodes.EXTERNAL_API_ERROR.userMessage,
      ErrorCodes.EXTERNAL_API_ERROR.statusCode,
      ErrorCodes.EXTERNAL_API_ERROR.recoveryAction,
      { githubStatus: status }
    );
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: unknown, context: string): never {
    console.error(`Network error during ${context}:`, error);
    const err = error as { code?: string; message?: string };
    
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      throw new AppError(
        ErrorCodes.CONNECTION_TIMEOUT.code,
        `Connection timeout during ${context}`,
        ErrorCodes.CONNECTION_TIMEOUT.userMessage,
        ErrorCodes.CONNECTION_TIMEOUT.statusCode,
        ErrorCodes.CONNECTION_TIMEOUT.recoveryAction
      );
    }
    
    throw new AppError(
      ErrorCodes.NETWORK_ERROR.code,
      `Network error during ${context}: ${err.message || 'Unknown error'}`,
      ErrorCodes.NETWORK_ERROR.userMessage,
      ErrorCodes.NETWORK_ERROR.statusCode,
      ErrorCodes.NETWORK_ERROR.recoveryAction
    );
  }

  async searchRepositories(
    query: string,
    sort: 'stars' | 'forks' | 'updated' = 'stars',
    limit = 10
  ): Promise<GitHubRepository[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${limit}`
      );
      
      if (!response.ok) {
        await this.handleGitHubError(response, 'repository search');
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.handleNetworkError(error, 'repository search');
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository | null> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Repository not found is expected in some cases
        }
        await this.handleGitHubError(response, 'repository fetch');
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.handleNetworkError(error, 'repository fetch');
    }
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<RepositoryLanguages> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/languages`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {}; // No languages data available
        }
        await this.handleGitHubError(response, 'repository languages fetch');
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error fetching repository languages:', error);
      return {}; // Return empty object for non-critical errors
    }
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/readme`, {
        headers: {
          'Accept': 'application/vnd.github.v3.raw'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No README available
        }
        await this.handleGitHubError(response, 'repository README fetch');
      }
      
      return await response.text();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error fetching repository README:', error);
      return null; // Return null for non-critical errors
    }
  }

  async getRepositoryWithDetails(owner: string, repo: string): Promise<{
    repository: GitHubRepository;
    languages: RepositoryLanguages;
    readme?: string;
  } | null> {
    try {
      const [repository, languages, readme] = await Promise.all([
        this.getRepository(owner, repo),
        this.getRepositoryLanguages(owner, repo),
        this.getRepositoryReadme(owner, repo)
      ]);

      if (!repository) {
        return null;
      }

      return {
        repository,
        languages,
        readme: readme || undefined
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.handleNetworkError(error, 'repository details fetch');
    }
  }

  parseRepositoryUrl(url: string): { owner: string; repo: string } | null {
    // Handle both full URLs and owner/repo format
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /^([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '')
        };
      }
    }

    return null;
  }
}

export const githubService = new GitHubService();