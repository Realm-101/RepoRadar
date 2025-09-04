import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileDown, FileText } from "lucide-react";
import { getScoreHealthIndicator, getMetricHealthIndicator, getOverallHealth } from "@/utils/health-indicators";
import { exportToPDF, exportToCSV } from "@/utils/export-utils";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResultsProps {
  analysis: {
    originality: number;
    completeness: number;
    marketability: number;
    monetization: number;
    usefulness: number;
    overallScore: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    scoreExplanations?: {
      [key: string]: string;
    };
  };
  repository?: {
    name: string;
    full_name: string;
    description?: string;
    language?: string;
    stargazers_count?: number;
    forks_count?: number;
  };
}

export default function AnalysisResults({ analysis, repository }: AnalysisResultsProps) {
  const { toast } = useToast();

  const handleExportPDF = async () => {
    try {
      const exportData = {
        id: 'temp-id',
        repositoryId: repository?.full_name || 'unknown',
        originality: analysis.originality,
        completeness: analysis.completeness,
        marketability: analysis.marketability,
        monetization: analysis.monetization,
        usefulness: analysis.usefulness,
        overallScore: analysis.overallScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
        createdAt: new Date().toISOString(),
        repository,
        // For backward compatibility
        originality_score: analysis.originality * 10,
        completeness_score: analysis.completeness * 10,
        marketability_score: analysis.marketability * 10,
        monetization_score: analysis.monetization * 10,
        usefulness_score: analysis.usefulness * 10,
        overall_score: analysis.overallScore,
        key_findings: analysis.strengths,
      };
      
      await exportToPDF(exportData, 'analysis-results');
      toast({
        title: "Export Successful",
        description: "Analysis results exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analysis results",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    try {
      const exportData = {
        id: 'temp-id',
        repositoryId: repository?.full_name || 'unknown',
        originality: analysis.originality,
        completeness: analysis.completeness,
        marketability: analysis.marketability,
        monetization: analysis.monetization,
        usefulness: analysis.usefulness,
        overallScore: analysis.overallScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
        createdAt: new Date().toISOString(),
        repository,
        // For backward compatibility
        originality_score: analysis.originality * 10,
        completeness_score: analysis.completeness * 10,
        marketability_score: analysis.marketability * 10,
        monetization_score: analysis.monetization * 10,
        usefulness_score: analysis.usefulness * 10,
        overall_score: analysis.overallScore,
        key_findings: analysis.strengths,
      };
      
      exportToCSV(exportData);
      toast({
        title: "Export Successful",
        description: "Analysis results exported as CSV",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analysis results",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-400';
    if (score >= 7) return 'text-primary';
    if (score >= 5) return 'text-accent';
    return 'text-gray-400';
  };

  const getProgressWidth = (score: number) => {
    return `${(score / 10) * 100}%`;
  };

  const getScoreGradient = (metric: string) => {
    switch (metric) {
      case 'originality':
        return 'from-primary to-secondary';
      case 'completeness':
        return 'from-green-400 to-blue-500';
      case 'marketability':
        return 'from-accent to-primary';
      case 'monetization':
        return 'from-purple-400 to-pink-500';
      case 'usefulness':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-primary to-secondary';
    }
  };

  return (
    <Card className="bg-card border border-border mb-8" id="analysis-results">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">AI Analysis Results</h2>
          <div className="flex gap-2" data-tour="export-buttons">
            <Button
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary"
              data-testid="button-export-pdf"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
              data-testid="button-export-csv"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Summary</h3>
          <div className="bg-dark rounded-lg p-6 border border-border">
            <p className="text-gray-300 leading-relaxed" data-testid="text-analysis-summary">
              {analysis.summary}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" data-tour="metrics-display">
          {/* Scores */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Detailed Scores</h3>
            
            <div className="space-y-4">
              {[
                { label: 'Originality', score: analysis.originality, key: 'originality' },
                { label: 'Completeness', score: analysis.completeness, key: 'completeness' },
                { label: 'Marketability', score: analysis.marketability, key: 'marketability' },
              ].map(({ label, score, key }) => (
                <div key={key} className="bg-dark rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getMetricHealthIndicator(key, score * 10)}</span>
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${getScoreColor(score)}`} data-testid={`score-${key}`}>
                        {score.toFixed(1)}
                      </span>
                      <span className={`text-sm ${getScoreHealthIndicator(score * 10).color}`}>
                        {getScoreHealthIndicator(score * 10).label}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full bg-gradient-to-r ${getScoreGradient(key)} rounded-full transition-all duration-1000`}
                      style={{ width: getProgressWidth(score) }}
                    ></div>
                  </div>
                  {analysis.scoreExplanations?.[key] && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      {analysis.scoreExplanations[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Additional Metrics</h3>
            
            <div className="space-y-4">
              {[
                { label: 'Monetization Potential', score: analysis.monetization, key: 'monetization' },
                { label: 'Overall Usefulness', score: analysis.usefulness, key: 'usefulness' },
              ].map(({ label, score, key }) => (
                <div key={key} className="bg-dark rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getMetricHealthIndicator(key, score * 10)}</span>
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${getScoreColor(score)}`} data-testid={`score-${key}`}>
                        {score.toFixed(1)}
                      </span>
                      <span className={`text-sm ${getScoreHealthIndicator(score * 10).color}`}>
                        {getScoreHealthIndicator(score * 10).label}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full bg-gradient-to-r ${getScoreGradient(key)} rounded-full transition-all duration-1000`}
                      style={{ width: getProgressWidth(score) }}
                    ></div>
                  </div>
                  {analysis.scoreExplanations?.[key] && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      {analysis.scoreExplanations[key]}
                    </p>
                  )}
                </div>
              ))}

              <div className="bg-dark rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl">{getScoreHealthIndicator(analysis.overallScore * 10).emoji}</span>
                    <span className="font-medium">Overall Score</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl font-bold gradient-text" data-testid="score-overall">
                      {analysis.overallScore.toFixed(1)}
                    </span>
                    <span className={`text-sm ${getScoreHealthIndicator(analysis.overallScore * 10).color}`}>
                      {getScoreHealthIndicator(analysis.overallScore * 10).label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {analysis.overallScore >= 9 ? 'Exceptional repository with outstanding potential' :
                   analysis.overallScore >= 7 ? 'High-quality repository with strong potential' :
                   analysis.overallScore >= 5 ? 'Good repository with moderate potential' :
                   'Repository needs improvement in key areas'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths, Weaknesses, and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Strengths */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">
              <i className="fas fa-check-circle mr-2"></i>
              Strengths
            </h3>
            <div className="space-y-3">
              {analysis.strengths.map((strength: any, index: number) => (
                <div 
                  key={index}
                  className="bg-dark rounded-lg p-3 border-l-4 border-green-400"
                  data-testid={`strength-${index}`}
                >
                  <p className="text-sm text-gray-300 font-medium">
                    {typeof strength === 'string' ? strength : strength.point}
                  </p>
                  {typeof strength === 'object' && strength.reason && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {strength.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-red-400">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Areas for Improvement
            </h3>
            <div className="space-y-3">
              {analysis.weaknesses.map((weakness: any, index: number) => (
                <div 
                  key={index}
                  className="bg-dark rounded-lg p-3 border-l-4 border-red-400"
                  data-testid={`weakness-${index}`}
                >
                  <p className="text-sm text-gray-300 font-medium">
                    {typeof weakness === 'string' ? weakness : weakness.point}
                  </p>
                  {typeof weakness === 'object' && weakness.reason && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {weakness.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">
              <i className="fas fa-lightbulb mr-2"></i>
              Recommendations
            </h3>
            <div className="space-y-3">
              {analysis.recommendations.map((recommendation: any, index: number) => (
                <div 
                  key={index}
                  className="bg-dark rounded-lg p-3 border-l-4 border-primary"
                  data-testid={`recommendation-${index}`}
                >
                  <p className="text-sm text-gray-300 font-medium">
                    {typeof recommendation === 'string' ? recommendation : recommendation.suggestion}
                  </p>
                  {typeof recommendation === 'object' && recommendation.reason && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      <strong>Why:</strong> {recommendation.reason}
                    </p>
                  )}
                  {typeof recommendation === 'object' && recommendation.impact && (
                    <p className="text-xs text-green-400 mt-1 italic">
                      <strong>Impact:</strong> {recommendation.impact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
