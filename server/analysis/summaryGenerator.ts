import { GitHubRepository } from '../github';
import { MaintainabilityMetrics } from './maintainabilityAnalyzer';
import { ContributorRiskMetrics } from './contributorRiskAnalyzer';
import { VelocityMetrics } from './velocityAnalyzer';
import { SecurityMetrics } from './securityAnalyzer';

export interface EnhancedAnalysisSummary {
  executiveSummary: string;
  keyInsights: string[];
  riskAssessment: string;
  recommendations: string[];
  technicalOverview: string;
  maintenanceOutlook: string;
}

export class SummaryGenerator {
  /**
   * Create plain-English summary generator using AI services for technical metrics translation
   * Requirements: 1.5 - Create plain-English summary generator using AI services
   */
  async generatePlainEnglishSummary(
    repository: GitHubRepository,
    maintainability: MaintainabilityMetrics,
    contributorRisk: ContributorRiskMetrics,
    velocity: VelocityMetrics,
    security: SecurityMetrics
  ): Promise<EnhancedAnalysisSummary> {
    
    const executiveSummary = this.generateExecutiveSummary(repository, maintainability, contributorRisk, velocity, security);
    const keyInsights = this.generateKeyInsights(repository, maintainability, contributorRisk, velocity, security);
    const riskAssessment = this.generateRiskAssessment(contributorRisk, security, velocity);
    const recommendations = this.generateRecommendations(maintainability, contributorRisk, velocity, security);
    const technicalOverview = this.generateTechnicalOverview(repository, maintainability);
    const maintenanceOutlook = this.generateMaintenanceOutlook(contributorRisk, velocity, maintainability);

    return {
      executiveSummary,
      keyInsights,
      riskAssessment,
      recommendations,
      technicalOverview,
      maintenanceOutlook
    };
  }

  private generateExecutiveSummary(
    repository: GitHubRepository,
    maintainability: MaintainabilityMetrics,
    contributorRisk: ContributorRiskMetrics,
    velocity: VelocityMetrics,
    security: SecurityMetrics
  ): string {
    const projectName = repository.name;
    const stars = repository.stargazers_count;
    const language = repository.language || 'Mixed';
    
    // Calculate overall health score
    const overallHealth = Math.round((maintainability.score + contributorRisk.busFactorScore + velocity.score + security.score) / 4);
    
    let healthDescription = '';
    if (overallHealth >= 80) {
      healthDescription = 'excellent condition with strong fundamentals';
    } else if (overallHealth >= 65) {
      healthDescription = 'good condition with solid foundations';
    } else if (overallHealth >= 50) {
      healthDescription = 'moderate condition with some areas for improvement';
    } else if (overallHealth >= 35) {
      healthDescription = 'concerning condition requiring attention';
    } else {
      healthDescription = 'poor condition with significant issues';
    }

    const communitySize = this.describeCommunitySize(stars);
    const riskLevel = this.describeOverallRisk(contributorRisk.riskLevel, security.riskLevel);
    const developmentActivity = velocity.details.developmentActivity.toLowerCase();

    return `${projectName} is a ${language} project with ${communitySize} that is currently in ${healthDescription}. ` +
           `The project shows ${developmentActivity} development activity and carries ${riskLevel} risk for adoption. ` +
           `With a maintainability score of ${maintainability.score}/100 and ${contributorRisk.riskLevel} contributor risk, ` +
           `this project ${this.getAdoptionRecommendation(overallHealth, contributorRisk.riskLevel, security.riskLevel)}.`;
  }

  private generateKeyInsights(
    repository: GitHubRepository,
    maintainability: MaintainabilityMetrics,
    contributorRisk: ContributorRiskMetrics,
    velocity: VelocityMetrics,
    security: SecurityMetrics
  ): string[] {
    const insights: string[] = [];

    // Maintainability insights
    if (maintainability.score >= 80) {
      insights.push(`Excellent code organization with ${maintainability.details.contributorCount} estimated contributors and strong documentation`);
    } else if (maintainability.score >= 60) {
      insights.push(`Well-structured codebase with room for improvement in ${this.getWeakestMaintainabilityArea(maintainability)}`);
    } else {
      insights.push(`Code structure needs attention, particularly in ${this.getWeakestMaintainabilityArea(maintainability)}`);
    }

    // Contributor risk insights
    if (contributorRisk.riskLevel === 'low') {
      insights.push(`Strong contributor base with ${contributorRisk.details.estimatedActiveContributors} active contributors reducing bus factor risk`);
    } else if (contributorRisk.riskLevel === 'medium') {
      insights.push(`Moderate contributor diversity with ${contributorRisk.details.issueResponsePattern.toLowerCase()} maintainer responsiveness`);
    } else {
      insights.push(`High dependency on limited contributors with ${contributorRisk.details.issueResponsePattern.toLowerCase()} issue response times`);
    }

    // Velocity insights
    if (velocity.grade === 'A' || velocity.grade === 'B') {
      insights.push(`Active development with ${velocity.details.estimatedReleaseFrequency.toLowerCase()} releases and ${velocity.details.projectMomentum.toLowerCase()}`);
    } else if (velocity.grade === 'C') {
      insights.push(`Moderate development pace with ${velocity.details.estimatedReleaseFrequency.toLowerCase()} release schedule`);
    } else {
      insights.push(`Slow development velocity with ${velocity.details.estimatedReleaseFrequency.toLowerCase()} releases indicating limited activity`);
    }

    // Security insights
    if (security.riskLevel === 'low') {
      insights.push(`Strong security posture with ${security.details.languageSecurityProfile.toLowerCase()} and good practices`);
    } else if (security.riskLevel === 'medium') {
      insights.push(`Adequate security measures with ${security.details.estimatedDependencies} estimated dependencies to monitor`);
    } else {
      insights.push(`Security concerns identified with ${security.warnings.length} warning areas requiring attention`);
    }

    // Community insights
    const communityEngagement = repository.forks_count / Math.max(repository.stargazers_count, 1);
    if (communityEngagement > 0.1) {
      insights.push(`High community engagement with ${Math.round(communityEngagement * 100)}% fork-to-star ratio indicating active contribution`);
    } else if (communityEngagement > 0.05) {
      insights.push(`Moderate community participation with opportunities for increased contributor involvement`);
    } else {
      insights.push(`Limited community contribution activity suggesting potential for broader engagement`);
    }

    return insights;
  }

  private generateRiskAssessment(
    contributorRisk: ContributorRiskMetrics,
    security: SecurityMetrics,
    velocity: VelocityMetrics
  ): string {
    const risks: string[] = [];
    let overallRiskLevel = 'low';

    // Contributor risks
    if (contributorRisk.riskLevel === 'high') {
      risks.push('high bus factor risk due to limited contributor base');
      overallRiskLevel = 'high';
    } else if (contributorRisk.riskLevel === 'medium') {
      risks.push('moderate contributor dependency risk');
      if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
    }

    // Security risks
    if (security.riskLevel === 'critical' || security.riskLevel === 'high') {
      risks.push(`${security.riskLevel} security risk with ${security.warnings.length} identified concerns`);
      overallRiskLevel = 'high';
    } else if (security.riskLevel === 'medium') {
      risks.push('moderate security considerations requiring monitoring');
      if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
    }

    // Velocity risks
    if (velocity.grade === 'D' || velocity.grade === 'F') {
      risks.push('low development activity indicating potential maintenance issues');
      if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
    }

    if (risks.length === 0) {
      return `This project presents low overall risk for adoption with strong contributor diversity, adequate security measures, and active development. Regular monitoring of dependencies and security updates is recommended.`;
    }

    const riskDescription = risks.join(', ');
    const mitigation = this.generateRiskMitigation(contributorRisk, security, velocity);

    return `This project presents ${overallRiskLevel} risk due to ${riskDescription}. ${mitigation}`;
  }

  private generateRecommendations(
    maintainability: MaintainabilityMetrics,
    contributorRisk: ContributorRiskMetrics,
    velocity: VelocityMetrics,
    security: SecurityMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Maintainability recommendations
    if (maintainability.score < 70) {
      const weakArea = this.getWeakestMaintainabilityArea(maintainability);
      recommendations.push(`Improve ${weakArea} to enhance long-term maintainability`);
    }

    if (!maintainability.details.hasReadme) {
      recommendations.push('Add comprehensive README documentation to improve project accessibility');
    }

    // Contributor risk recommendations
    if (contributorRisk.riskLevel === 'high') {
      recommendations.push('Actively encourage community contributions to reduce bus factor risk');
      recommendations.push('Implement contributor onboarding processes to expand the maintainer base');
    }

    if (contributorRisk.maintainerResponsiveness < 60) {
      recommendations.push('Improve issue and pull request response times to encourage community participation');
    }

    // Velocity recommendations
    if (velocity.grade === 'D' || velocity.grade === 'F') {
      recommendations.push('Increase development activity and establish regular release schedule');
    }

    if (velocity.details.estimatedReleaseFrequency === 'Irregular') {
      recommendations.push('Establish consistent release cadence to improve user confidence');
    }

    // Security recommendations
    if (security.riskLevel === 'high' || security.riskLevel === 'critical') {
      recommendations.push('Conduct comprehensive security audit and implement recommended fixes');
    }

    if (security.factors.dependencyFreshness < 60) {
      recommendations.push('Set up automated dependency updates and vulnerability scanning');
    }

    if (!security.details.hasSecurityPolicy) {
      recommendations.push('Create security policy and responsible disclosure guidelines');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue current development practices while monitoring for emerging issues');
      recommendations.push('Consider implementing automated testing and CI/CD improvements');
    }

    return recommendations.slice(0, 6); // Limit to top 6 recommendations
  }

  private generateTechnicalOverview(repository: GitHubRepository, maintainability: MaintainabilityMetrics): string {
    const language = repository.language || 'Mixed languages';
    const size = this.formatRepositorySize(repository.size);
    const languageDistribution = this.formatLanguageDistribution(maintainability.details.languageDistribution);
    
    let overview = `This ${language} project consists of ${size} of code`;
    
    if (Object.keys(maintainability.details.languageDistribution).length > 1) {
      overview += ` with the following distribution: ${languageDistribution}`;
    }

    overview += `. The codebase demonstrates ${maintainability.details.maintainerActivity.toLowerCase()} maintainer activity`;

    if (maintainability.details.hasTests) {
      overview += ' and includes testing infrastructure';
    }

    if (repository.topics && repository.topics.length > 0) {
      overview += `. Key technologies include: ${repository.topics.slice(0, 5).join(', ')}`;
    }

    return overview + '.';
  }

  private generateMaintenanceOutlook(
    contributorRisk: ContributorRiskMetrics,
    velocity: VelocityMetrics,
    maintainability: MaintainabilityMetrics
  ): string {
    let outlook = '';
    
    // Determine overall maintenance outlook
    const avgScore = (contributorRisk.busFactorScore + velocity.score + maintainability.score) / 3;
    
    if (avgScore >= 75) {
      outlook = 'The maintenance outlook is very positive';
    } else if (avgScore >= 60) {
      outlook = 'The maintenance outlook is generally positive';
    } else if (avgScore >= 45) {
      outlook = 'The maintenance outlook is mixed';
    } else {
      outlook = 'The maintenance outlook presents challenges';
    }

    // Add specific details
    const details: string[] = [];
    
    if (contributorRisk.riskLevel === 'low') {
      details.push('strong contributor base ensuring continuity');
    } else if (contributorRisk.riskLevel === 'high') {
      details.push('limited contributor base requiring attention');
    }

    if (velocity.grade === 'A' || velocity.grade === 'B') {
      details.push('active development indicating ongoing commitment');
    } else if (velocity.grade === 'D' || velocity.grade === 'F') {
      details.push('low development activity raising sustainability concerns');
    }

    if (maintainability.score >= 70) {
      details.push('well-structured code facilitating future maintenance');
    } else if (maintainability.score < 50) {
      details.push('code structure challenges that may impact long-term maintenance');
    }

    if (details.length > 0) {
      outlook += ` with ${details.join(', ')}`;
    }

    // Add forward-looking statement
    const projectMomentum = velocity.details.projectMomentum.toLowerCase();
    outlook += `. Based on current ${projectMomentum} and ${contributorRisk.details.issueResponsePattern.toLowerCase()} maintainer responsiveness, `;
    
    if (avgScore >= 60) {
      outlook += 'the project is well-positioned for sustained development and community growth.';
    } else {
      outlook += 'the project would benefit from increased community engagement and development activity.';
    }

    return outlook;
  }

  // Helper methods
  private describeCommunitySize(stars: number): string {
    if (stars > 10000) return 'a large community following';
    if (stars > 1000) return 'a substantial community following';
    if (stars > 100) return 'a growing community following';
    if (stars > 10) return 'a small community following';
    return 'limited community engagement';
  }

  private describeOverallRisk(contributorRisk: string, securityRisk: string): string {
    if (contributorRisk === 'high' || securityRisk === 'critical' || securityRisk === 'high') {
      return 'high';
    }
    if (contributorRisk === 'medium' || securityRisk === 'medium') {
      return 'moderate';
    }
    return 'low';
  }

  private getAdoptionRecommendation(overallHealth: number, contributorRisk: string, securityRisk: string): string {
    if (overallHealth >= 75 && contributorRisk === 'low' && (securityRisk === 'low' || securityRisk === 'medium')) {
      return 'is well-suited for production use';
    }
    if (overallHealth >= 60 && contributorRisk !== 'high' && securityRisk !== 'critical') {
      return 'can be considered for adoption with appropriate monitoring';
    }
    if (overallHealth >= 45) {
      return 'requires careful evaluation before adoption';
    }
    return 'should be approached with caution and thorough assessment';
  }

  private getWeakestMaintainabilityArea(maintainability: MaintainabilityMetrics): string {
    const factors = maintainability.factors;
    const minFactor = Math.min(
      factors.codeStructure,
      factors.contributorDiversity,
      factors.documentationQuality,
      factors.testCoverage,
      factors.codeComplexity
    );

    if (factors.documentationQuality === minFactor) return 'documentation quality';
    if (factors.testCoverage === minFactor) return 'test coverage';
    if (factors.codeStructure === minFactor) return 'code structure';
    if (factors.contributorDiversity === minFactor) return 'contributor diversity';
    return 'code complexity management';
  }

  private generateRiskMitigation(
    contributorRisk: ContributorRiskMetrics,
    security: SecurityMetrics,
    velocity: VelocityMetrics
  ): string {
    const mitigations: string[] = [];

    if (contributorRisk.riskLevel === 'high') {
      mitigations.push('consider forking or establishing alternative maintenance');
    }

    if (security.riskLevel === 'high' || security.riskLevel === 'critical') {
      mitigations.push('implement additional security measures and monitoring');
    }

    if (velocity.grade === 'D' || velocity.grade === 'F') {
      mitigations.push('evaluate long-term viability and consider alternatives');
    }

    if (mitigations.length === 0) {
      return 'Regular monitoring and standard security practices are recommended.';
    }

    return `Mitigation strategies include: ${mitigations.join(', ')}.`;
  }

  private formatRepositorySize(sizeKB: number): string {
    if (sizeKB > 1000000) {
      return `${Math.round(sizeKB / 1000000)} GB`;
    }
    if (sizeKB > 1000) {
      return `${Math.round(sizeKB / 1000)} MB`;
    }
    return `${sizeKB} KB`;
  }

  private formatLanguageDistribution(distribution: Record<string, number>): string {
    const entries = Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([lang, percent]) => `${lang} (${percent}%)`);
    
    return entries.join(', ');
  }
}

export const summaryGenerator = new SummaryGenerator();