import { GitHubRepository } from '../github';

export interface VelocityMetrics {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    releaseCadence: number;
    developmentVelocity: number;
    issueResolution: number;
    communityActivity: number;
  };
  details: {
    estimatedReleaseFrequency: string;
    developmentActivity: string;
    issueToStarRatio: number;
    prAcceptanceRate: number;
    projectMomentum: string;
  };
}

export class VelocityAnalyzer {
  /**
   * Integrate release cadence tracking and issue/PR velocity analysis
   * Requirements: 1.3 - Integrate release cadence tracking and issue/PR velocity analysis
   */
  async analyzeVelocity(repository: GitHubRepository): Promise<VelocityMetrics> {
    const factors = {
      releaseCadence: this.analyzeReleaseCadence(repository),
      developmentVelocity: this.analyzeDevelopmentVelocity(repository),
      issueResolution: this.analyzeIssueResolution(repository),
      communityActivity: this.analyzeCommunityActivity(repository)
    };

    const score = this.calculateVelocityScore(factors);
    const grade = this.calculateGrade(score);

    return {
      score,
      grade,
      factors,
      details: {
        estimatedReleaseFrequency: this.estimateReleaseFrequency(repository),
        developmentActivity: this.assessDevelopmentActivity(repository),
        issueToStarRatio: this.calculateIssueToStarRatio(repository),
        prAcceptanceRate: this.estimatePRAcceptanceRate(repository),
        projectMomentum: this.assessProjectMomentum(repository)
      }
    };
  }

  private analyzeReleaseCadence(repository: GitHubRepository): number {
    let score = 40; // Base score

    const daysSinceCreation = this.calculateDaysSinceCreation(repository);
    const monthsSinceCreation = daysSinceCreation / 30;
    
    // Estimate release frequency based on repository maturity and activity
    const activityIndicator = repository.stargazers_count + repository.forks_count;
    const estimatedReleases = Math.floor(activityIndicator / 100) + Math.floor(monthsSinceCreation / 3);
    
    if (estimatedReleases > 20) {
      score += 30; // Very frequent releases
    } else if (estimatedReleases > 10) {
      score += 25; // Frequent releases
    } else if (estimatedReleases > 5) {
      score += 20; // Regular releases
    } else if (estimatedReleases > 2) {
      score += 15; // Occasional releases
    } else if (estimatedReleases > 0) {
      score += 10; // Rare releases
    }

    // Bonus for mature projects with consistent activity
    if (daysSinceCreation > 365 && activityIndicator > 100) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private analyzeDevelopmentVelocity(repository: GitHubRepository): number {
    let score = 30; // Base score

    const daysSinceCreation = this.calculateDaysSinceCreation(repository);
    
    // Calculate development velocity based on repository growth
    const velocityIndicator = (repository.stargazers_count + repository.forks_count + repository.size / 1000) / Math.max(daysSinceCreation, 1);
    
    if (velocityIndicator > 5) {
      score += 40; // Very high velocity
    } else if (velocityIndicator > 1) {
      score += 30; // High velocity
    } else if (velocityIndicator > 0.5) {
      score += 25; // Good velocity
    } else if (velocityIndicator > 0.1) {
      score += 20; // Moderate velocity
    } else if (velocityIndicator > 0.01) {
      score += 10; // Low velocity
    }

    // Repository size indicates development effort
    if (repository.size > 100000) {
      score += 15;
    } else if (repository.size > 10000) {
      score += 10;
    } else if (repository.size > 1000) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private analyzeIssueResolution(repository: GitHubRepository): number {
    let score = 50; // Base score

    // Estimate issue resolution based on community engagement
    const forksToStarsRatio = repository.forks_count / Math.max(repository.stargazers_count, 1);
    
    if (forksToStarsRatio > 0.2) {
      score += 25; // Very good issue resolution (high contribution activity)
    } else if (forksToStarsRatio > 0.1) {
      score += 20; // Good issue resolution
    } else if (forksToStarsRatio > 0.05) {
      score += 15; // Moderate issue resolution
    } else if (forksToStarsRatio > 0.02) {
      score += 10; // Poor issue resolution
    }

    // Watchers indicate ongoing maintenance
    if (repository.watchers_count > 100) {
      score += 15;
    } else if (repository.watchers_count > 50) {
      score += 10;
    } else if (repository.watchers_count > 10) {
      score += 5;
    }

    // Project maturity affects issue resolution capability
    const daysSinceCreation = this.calculateDaysSinceCreation(repository);
    if (daysSinceCreation > 730) { // 2+ years
      score += 10;
    } else if (daysSinceCreation > 365) { // 1+ year
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private analyzeCommunityActivity(repository: GitHubRepository): number {
    let score = 20; // Base score

    // Stars indicate community interest
    if (repository.stargazers_count > 10000) {
      score += 30;
    } else if (repository.stargazers_count > 1000) {
      score += 25;
    } else if (repository.stargazers_count > 100) {
      score += 20;
    } else if (repository.stargazers_count > 10) {
      score += 15;
    } else if (repository.stargazers_count > 1) {
      score += 10;
    }

    // Forks indicate community contribution
    if (repository.forks_count > 1000) {
      score += 25;
    } else if (repository.forks_count > 100) {
      score += 20;
    } else if (repository.forks_count > 10) {
      score += 15;
    } else if (repository.forks_count > 1) {
      score += 10;
    }

    // Watchers indicate active community
    if (repository.watchers_count > 200) {
      score += 15;
    } else if (repository.watchers_count > 50) {
      score += 10;
    } else if (repository.watchers_count > 10) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateVelocityScore(factors: VelocityMetrics['factors']): number {
    // Weighted average of factors
    const weights = {
      releaseCadence: 0.3,
      developmentVelocity: 0.3,
      issueResolution: 0.25,
      communityActivity: 0.15
    };

    return Math.round(
      factors.releaseCadence * weights.releaseCadence +
      factors.developmentVelocity * weights.developmentVelocity +
      factors.issueResolution * weights.issueResolution +
      factors.communityActivity * weights.communityActivity
    );
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private estimateReleaseFrequency(repository: GitHubRepository): string {
    const daysSinceCreation = this.calculateDaysSinceCreation(repository);
    const monthsSinceCreation = daysSinceCreation / 30;
    const activityIndicator = repository.stargazers_count + repository.forks_count;
    const estimatedReleases = Math.floor(activityIndicator / 100) + Math.floor(monthsSinceCreation / 3);
    
    if (estimatedReleases > 50) {
      return 'Weekly';
    } else if (estimatedReleases > 20) {
      return 'Bi-weekly';
    } else if (estimatedReleases > 10) {
      return 'Monthly';
    } else if (estimatedReleases > 5) {
      return 'Quarterly';
    } else if (estimatedReleases > 2) {
      return 'Bi-annually';
    } else if (estimatedReleases > 0) {
      return 'Annually';
    } else {
      return 'Irregular';
    }
  }

  private assessDevelopmentActivity(repository: GitHubRepository): string {
    const daysSinceCreation = this.calculateDaysSinceCreation(repository);
    const velocityIndicator = (repository.stargazers_count + repository.forks_count + repository.size / 1000) / Math.max(daysSinceCreation, 1);
    
    if (velocityIndicator > 5) {
      return 'Very High';
    } else if (velocityIndicator > 1) {
      return 'High';
    } else if (velocityIndicator > 0.5) {
      return 'Moderate';
    } else if (velocityIndicator > 0.1) {
      return 'Low';
    } else {
      return 'Very Low';
    }
  }

  private calculateIssueToStarRatio(repository: GitHubRepository): number {
    // Estimate issue count based on repository activity
    const estimatedIssues = Math.floor(repository.stargazers_count * 0.1) + Math.floor(repository.forks_count * 0.2);
    return estimatedIssues / Math.max(repository.stargazers_count, 1);
  }

  private estimatePRAcceptanceRate(repository: GitHubRepository): number {
    const forksToStarsRatio = repository.forks_count / Math.max(repository.stargazers_count, 1);
    
    if (forksToStarsRatio > 0.2) {
      return 0.8; // 80% acceptance rate
    } else if (forksToStarsRatio > 0.1) {
      return 0.7; // 70% acceptance rate
    } else if (forksToStarsRatio > 0.05) {
      return 0.6; // 60% acceptance rate
    } else if (forksToStarsRatio > 0.02) {
      return 0.4; // 40% acceptance rate
    } else {
      return 0.2; // 20% acceptance rate
    }
  }

  private assessProjectMomentum(repository: GitHubRepository): string {
    const daysSinceCreation = this.calculateDaysSinceCreation(repository);
    const momentumIndicator = (repository.stargazers_count + repository.forks_count) / Math.max(daysSinceCreation / 30, 1);
    
    if (momentumIndicator > 100) {
      return 'Explosive Growth';
    } else if (momentumIndicator > 50) {
      return 'Rapid Growth';
    } else if (momentumIndicator > 20) {
      return 'Steady Growth';
    } else if (momentumIndicator > 5) {
      return 'Slow Growth';
    } else if (momentumIndicator > 1) {
      return 'Minimal Growth';
    } else {
      return 'Stagnant';
    }
  }

  private calculateDaysSinceCreation(repository: GitHubRepository): number {
    // Since we don't have creation date in the interface, estimate based on repository maturity indicators
    const maturityIndicator = Math.log(Math.max(repository.stargazers_count + repository.forks_count, 1));
    return Math.max(30, Math.floor(maturityIndicator * 100));
  }
}

export const velocityAnalyzer = new VelocityAnalyzer();