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
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error searching GitHub repositories:', error);
      return [];
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository | null> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub repository:', error);
      return null;
    }
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<RepositoryLanguages> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/languages`);
      
      if (!response.ok) {
        return {};
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching repository languages:', error);
      return {};
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
        return null;
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error fetching repository README:', error);
      return null;
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
      console.error('Error fetching repository with details:', error);
      return null;
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