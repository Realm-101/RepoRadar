-- Add enhanced analysis fields to repository_analyses table
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 - Enhanced Repository Analysis Engine

ALTER TABLE repository_analyses 
ADD COLUMN IF NOT EXISTS maintainability JSONB,
ADD COLUMN IF NOT EXISTS contributor_risk JSONB,
ADD COLUMN IF NOT EXISTS velocity JSONB,
ADD COLUMN IF NOT EXISTS security JSONB,
ADD COLUMN IF NOT EXISTS enhanced_summary JSONB,
ADD COLUMN IF NOT EXISTS health_score REAL,
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS adoption_recommendation VARCHAR(30);

-- Add indexes for the new fields to improve query performance
CREATE INDEX IF NOT EXISTS idx_repository_analyses_health_score ON repository_analyses(health_score);
CREATE INDEX IF NOT EXISTS idx_repository_analyses_risk_level ON repository_analyses(risk_level);
CREATE INDEX IF NOT EXISTS idx_repository_analyses_adoption_recommendation ON repository_analyses(adoption_recommendation);

-- Add comments for documentation
COMMENT ON COLUMN repository_analyses.maintainability IS 'Maintainability metrics including code structure, contributor diversity, documentation quality, test coverage, and code complexity';
COMMENT ON COLUMN repository_analyses.contributor_risk IS 'Contributor risk assessment with bus factor calculation and maintainer responsiveness metrics';
COMMENT ON COLUMN repository_analyses.velocity IS 'Development velocity metrics including release cadence, development velocity, issue resolution, and community activity';
COMMENT ON COLUMN repository_analyses.security IS 'Security analysis including dependency freshness, security practices, vulnerability exposure, and code quality';
COMMENT ON COLUMN repository_analyses.enhanced_summary IS 'Plain-English summary with executive summary, key insights, risk assessment, recommendations, technical overview, and maintenance outlook';
COMMENT ON COLUMN repository_analyses.health_score IS 'Overall health score (0-100) combining all enhanced metrics';
COMMENT ON COLUMN repository_analyses.risk_level IS 'Overall risk level: low, medium, high, or critical';
COMMENT ON COLUMN repository_analyses.adoption_recommendation IS 'Adoption recommendation: recommended, conditional, caution, or not_recommended';