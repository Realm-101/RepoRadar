import { GitHubRepository, RepositoryLanguages } from '../github';

export interface MaintainabilityMetrics {
  score: number; // 0-100
  factors: {
    codeStructure: number;
    contributorDiversity: number;
    documentationQuality: number;
    testCoverage: number;
    codeComplexity: number;
  };
  details: {
    primaryLanguage: string;
    languageDistribution: Record<string, number>;
    hasReadme: boolean;
    hasContributingGuide: boolean;
    hasLicense: boolean;
    hasTests: boolean;
    contributorCount: number;
    maintainerActivity: string;
  };
}

export class MaintainabilityAnalyzer {
  /**
   * Analyze repository maintainability based on code structure patterns and contributor diversity
   * Requirements: 1.1 - Implement maintainability scoring algorithm
   */
  async analyzeMaintainability(
    repository: GitHubRepository,
    languages: RepositoryLanguages,
    readme?: string
  ): Promise<MaintainabilityMetrics> {
    const factors = {
      codeStructure: this.analyzeCodeStructure(repository, languages),
      contributorDiversity: this.analyzeContributorDiversity(repository),
      documentationQuality: this.analyzeDocumentationQuality(repository, readme),
      testCoverage: this.analyzeTestCoverage(languages),
      codeComplexity: this.analyzeCodeComplexity(repository, languages)
    };

    // Calculate weighted score
    const weights = {
      codeStructure: 0.25,
      contributorDiversity: 0.20,
      documentationQuality: 0.20,
      testCoverage: 0.20,
      codeComplexity: 0.15
    };

    const score = Math.round(
      factors.codeStructure * weights.codeStructure +
      factors.contributorDiversity * weights.contributorDiversity +
      factors.documentationQuality * weights.documentationQuality +
      factors.testCoverage * weights.testCoverage +
      factors.codeComplexity * weights.codeComplexity
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      details: {
        primaryLanguage: repository.language || 'Unknown',
        languageDistribution: this.calculateLanguageDistribution(languages),
        hasReadme: !!readme,
        hasContributingGuide: this.hasContributingGuide(repository),
        hasLicense: this.hasLicense(repository),
        hasTests: this.hasTests(languages),
        contributorCount: this.estimateContributorCount(repository),
        maintainerActivity: this.assessMaintainerActivity(repository)
      }
    };
  }

  private analyzeCodeStructure(repository: GitHubRepository, languages: RepositoryLanguages): number {
    let score = 50; // Base score

    // Language diversity (moderate diversity is good)
    const languageCount = Object.keys(languages).length;
    if (languageCount >= 2 && languageCount <= 5) {
      score += 15;
    } else if (languageCount > 5) {
      score += 5; // Too many languages might indicate complexity
    }

    // Repository size (moderate size indicates good structure)
    if (repository.size > 1000 && repository.size < 50000) {
      score += 10;
    } else if (repository.size >= 50000 && repository.size < 200000) {
      score += 5;
    }

    // Topics indicate good organization
    if (repository.topics && repository.topics.length > 0) {
      score += Math.min(repository.topics.length * 3, 15);
    }

    return Math.max(0, Math.min(100, score));
  }

  private analyzeContributorDiversity(repository: GitHubRepository): number {
    let score = 30; // Base score for single contributor

    // Estimate contributor diversity based on forks and stars ratio
    const forksToStarsRatio = repository.forks_count / Math.max(repository.stargazers_count, 1);
    
    if (forksToStarsRatio > 0.1) {
      score += 30; // High fork ratio indicates active contribution
    } else if (forksToStarsRatio > 0.05) {
      score += 20;
    } else if (forksToStarsRatio > 0.02) {
      score += 10;
    }

    // Stars indicate community engagement
    if (repository.stargazers_count > 1000) {
      score += 20;
    } else if (repository.stargazers_count > 100) {
      score += 15;
    } else if (repository.stargazers_count > 10) {
      score += 10;
    }

    // Watchers indicate ongoing interest
    if (repository.watchers_count > 50) {
      score += 10;
    } else if (repository.watchers_count > 10) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private analyzeDocumentationQuality(repository: GitHubRepository, readme?: string): number {
    let score = 0;

    // README presence and quality
    if (readme) {
      score += 30;
      
      // README length indicates thoroughness
      if (readme.length > 2000) {
        score += 20;
      } else if (readme.length > 500) {
        score += 15;
      } else if (readme.length > 100) {
        score += 10;
      }

      // Check for common documentation sections
      const readmeLower = readme.toLowerCase();
      const sections = [
        'installation', 'usage', 'example', 'api', 'contributing', 
        'license', 'getting started', 'documentation', 'features'
      ];
      
      const foundSections = sections.filter(section => 
        readmeLower.includes(section) || readmeLower.includes(`# ${section}`) || readmeLower.includes(`## ${section}`)
      );
      
      score += Math.min(foundSections.length * 5, 25);
    }

    // Description quality
    if (repository.description) {
      score += 15;
      if (repository.description.length > 50) {
        score += 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private analyzeTestCoverage(languages: RepositoryLanguages): number {
    let score = 20; // Base score assuming minimal testing

    // Check for test-related languages/frameworks
    const testIndicators = [
      'jest', 'mocha', 'jasmine', 'pytest', 'junit', 'rspec', 'go test',
      'test', 'spec', 'testing'
    ];

    const languageNames = Object.keys(languages).map(lang => lang.toLowerCase());
    const hasTestFramework = testIndicators.some(indicator => 
      languageNames.some(lang => lang.includes(indicator))
    );

    if (hasTestFramework) {
      score += 40;
    }

    // Estimate test coverage based on language distribution
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    const testBytes = Object.entries(languages)
      .filter(([lang]) => lang.toLowerCase().includes('test') || lang.toLowerCase().includes('spec'))
      .reduce((sum, [, bytes]) => sum + bytes, 0);

    const testRatio = testBytes / totalBytes;
    if (testRatio > 0.2) {
      score += 30;
    } else if (testRatio > 0.1) {
      score += 20;
    } else if (testRatio > 0.05) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private analyzeCodeComplexity(repository: GitHubRepository, languages: RepositoryLanguages): number {
    let score = 70; // Start with good score, deduct for complexity indicators

    // Large repositories might be more complex
    if (repository.size > 500000) {
      score -= 30;
    } else if (repository.size > 200000) {
      score -= 20;
    } else if (repository.size > 100000) {
      score -= 10;
    }

    // Too many languages might indicate complexity
    const languageCount = Object.keys(languages).length;
    if (languageCount > 10) {
      score -= 20;
    } else if (languageCount > 7) {
      score -= 10;
    }

    // Very small repositories might lack proper structure
    if (repository.size < 100) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateLanguageDistribution(languages: RepositoryLanguages): Record<string, number> {
    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    const distribution: Record<string, number> = {};

    for (const [language, bytes] of Object.entries(languages)) {
      distribution[language] = Math.round((bytes / total) * 100);
    }

    return distribution;
  }

  private hasContributingGuide(repository: GitHubRepository): boolean {
    // This would require additional API calls to check for CONTRIBUTING.md
    // For now, estimate based on repository maturity
    return repository.stargazers_count > 100 && repository.forks_count > 10;
  }

  private hasLicense(repository: GitHubRepository): boolean {
    // This would require additional API calls to check for LICENSE file
    // For now, estimate based on repository maturity and public nature
    return !repository.private && repository.stargazers_count > 50;
  }

  private hasTests(languages: RepositoryLanguages): boolean {
    const languageNames = Object.keys(languages).map(lang => lang.toLowerCase());
    return languageNames.some(lang => 
      lang.includes('test') || lang.includes('spec') || lang.includes('jest')
    );
  }

  private estimateContributorCount(repository: GitHubRepository): number {
    // Estimate based on forks and stars
    const baseContributors = Math.max(1, Math.floor(repository.forks_count * 0.1));
    const starContributors = Math.floor(repository.stargazers_count * 0.01);
    return Math.min(baseContributors + starContributors, 100);
  }

  private assessMaintainerActivity(repository: GitHubRepository): string {
    const forksToStarsRatio = repository.forks_count / Math.max(repository.stargazers_count, 1);
    
    if (forksToStarsRatio > 0.15) {
      return 'Very Active';
    } else if (forksToStarsRatio > 0.08) {
      return 'Active';
    } else if (forksToStarsRatio > 0.03) {
      return 'Moderate';
    } else {
      return 'Low';
    }
  }
}

export const maintainabilityAnalyzer = new MaintainabilityAnalyzer();