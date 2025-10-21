import { enhancedAnalysisEngine } from '../enhancedAnalysisEngine';
import { GitHubRepository, RepositoryLanguages } from '../../github';

describe('Enhanced Analysis Engine', () => {
  const mockRepository: GitHubRepository = {
    id: 123456,
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    owner: { login: 'testuser' },
    description: 'A test repository for analysis',
    language: 'TypeScript',
    stargazers_count: 150,
    forks_count: 25,
    watchers_count: 30,
    size: 5000,
    private: false,
    html_url: 'https://github.com/testuser/test-repo',
    clone_url: 'https://github.com/testuser/test-repo.git',
    topics: ['typescript', 'testing', 'analysis']
  };

  const mockLanguages: RepositoryLanguages = {
    'TypeScript': 8500,
    'JavaScript': 1200,
    'CSS': 300
  };

  const mockReadme = `# Test Repository

This is a test repository for demonstrating the enhanced analysis engine.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`typescript
import { testFunction } from './test-repo';
\`\`\`

## Contributing

Please read our contributing guidelines.

## License

MIT License`;

  it('should perform complete enhanced analysis', async () => {
    const result = await enhancedAnalysisEngine.analyzeRepository(
      mockRepository,
      mockLanguages,
      mockReadme
    );

    // Verify all analysis components are present
    expect(result).toHaveProperty('maintainability');
    expect(result).toHaveProperty('contributorRisk');
    expect(result).toHaveProperty('velocity');
    expect(result).toHaveProperty('security');
    expect(result).toHaveProperty('enhancedSummary');
    expect(result).toHaveProperty('healthScore');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('adoptionRecommendation');

    // Verify maintainability analysis
    expect(result.maintainability.score).toBeGreaterThanOrEqual(0);
    expect(result.maintainability.score).toBeLessThanOrEqual(100);
    expect(result.maintainability.factors).toHaveProperty('codeStructure');
    expect(result.maintainability.factors).toHaveProperty('contributorDiversity');
    expect(result.maintainability.factors).toHaveProperty('documentationQuality');
    expect(result.maintainability.factors).toHaveProperty('testCoverage');
    expect(result.maintainability.factors).toHaveProperty('codeComplexity');

    // Verify contributor risk analysis
    expect(result.contributorRisk.busFactorScore).toBeGreaterThanOrEqual(0);
    expect(result.contributorRisk.busFactorScore).toBeLessThanOrEqual(100);
    expect(['low', 'medium', 'high']).toContain(result.contributorRisk.riskLevel);
    expect(result.contributorRisk.details).toHaveProperty('estimatedActiveContributors');

    // Verify velocity analysis
    expect(result.velocity.score).toBeGreaterThanOrEqual(0);
    expect(result.velocity.score).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.velocity.grade);
    expect(result.velocity.details).toHaveProperty('estimatedReleaseFrequency');

    // Verify security analysis
    expect(result.security.score).toBeGreaterThanOrEqual(0);
    expect(result.security.score).toBeLessThanOrEqual(100);
    expect(['low', 'medium', 'high', 'critical']).toContain(result.security.riskLevel);
    expect(result.security.details).toHaveProperty('estimatedDependencies');

    // Verify enhanced summary
    expect(result.enhancedSummary).toHaveProperty('executiveSummary');
    expect(result.enhancedSummary).toHaveProperty('keyInsights');
    expect(result.enhancedSummary).toHaveProperty('riskAssessment');
    expect(result.enhancedSummary).toHaveProperty('recommendations');
    expect(result.enhancedSummary).toHaveProperty('technicalOverview');
    expect(result.enhancedSummary).toHaveProperty('maintenanceOutlook');

    // Verify overall metrics
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
    expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    expect(['recommended', 'conditional', 'caution', 'not_recommended']).toContain(result.adoptionRecommendation);

    // Verify default analysis fields are present
    expect(result).toHaveProperty('originality');
    expect(result).toHaveProperty('completeness');
    expect(result).toHaveProperty('marketability');
    expect(result).toHaveProperty('monetization');
    expect(result).toHaveProperty('usefulness');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('strengths');
    expect(result).toHaveProperty('weaknesses');
    expect(result).toHaveProperty('recommendations');
  }, 10000); // Increase timeout for comprehensive analysis

  it('should handle repository with minimal data', async () => {
    const minimalRepo: GitHubRepository = {
      id: 789,
      name: 'minimal-repo',
      full_name: 'user/minimal-repo',
      owner: { login: 'user' },
      description: null,
      language: null,
      stargazers_count: 0,
      forks_count: 0,
      watchers_count: 0,
      size: 100,
      private: false,
      html_url: 'https://github.com/user/minimal-repo',
      clone_url: 'https://github.com/user/minimal-repo.git',
      topics: []
    };

    const result = await enhancedAnalysisEngine.analyzeRepository(
      minimalRepo,
      {},
      undefined
    );

    expect(result).toHaveProperty('healthScore');
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
    expect(result.riskLevel).toBeDefined();
    expect(result.adoptionRecommendation).toBeDefined();
  });

  it('should integrate with existing AI analysis', async () => {
    const existingAnalysis = {
      originality: 75,
      completeness: 80,
      marketability: 70,
      monetization: 60,
      usefulness: 85,
      overallScore: 74,
      summary: 'Existing AI analysis summary',
      strengths: [
        { point: 'Good documentation', reason: 'Comprehensive README' }
      ],
      weaknesses: [
        { point: 'Limited tests', reason: 'Few test files found' }
      ],
      recommendations: [
        { suggestion: 'Add more tests', reason: 'Improve reliability', impact: 'Higher confidence' }
      ],
      scoreExplanations: {
        originality: 'Unique approach to problem',
        completeness: 'Well documented',
        marketability: 'Good community interest',
        monetization: 'Limited commercial potential',
        usefulness: 'Solves real problems'
      }
    };

    const result = await enhancedAnalysisEngine.analyzeRepository(
      mockRepository,
      mockLanguages,
      mockReadme,
      existingAnalysis
    );

    // Should preserve original analysis
    expect(result.originality).toBe(75);
    expect(result.completeness).toBe(80);
    expect(result.summary).toBe('Existing AI analysis summary');

    // Should enhance with new insights
    expect(result.strengths.length).toBeGreaterThanOrEqual(1);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);

    // Should add enhanced analysis
    expect(result).toHaveProperty('maintainability');
    expect(result).toHaveProperty('enhancedSummary');
  });
});