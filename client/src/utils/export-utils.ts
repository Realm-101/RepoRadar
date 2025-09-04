import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportAnalysis {
  id: string;
  repositoryId: string;
  userId?: string;
  originality: number;
  completeness: number;
  marketability: number;
  monetization: number;
  usefulness: number;
  overallScore: number;
  summary: string;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  recommendations?: string[] | null;
  createdAt: Date | string;
  repository?: {
    name: string;
    full_name: string;
    description?: string;
    language?: string;
    stargazers_count?: number;
    forks_count?: number;
  };
  // For backward compatibility with existing API responses
  originality_score?: number;
  completeness_score?: number;
  marketability_score?: number;
  monetization_score?: number;
  usefulness_score?: number;
  overall_score?: number;
  key_findings?: string[];
}

/**
 * Export analysis results as PDF
 */
export async function exportToPDF(analysis: ExportAnalysis, elementId?: string) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(99, 102, 241); // Primary color
  pdf.text('Repository Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Repository Info
  if (analysis.repository) {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(analysis.repository.name || 'Unknown Repository', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    if (analysis.repository.full_name) {
      pdf.text(`Full Name: ${analysis.repository.full_name}`, margin, yPosition);
      yPosition += 5;
    }
    if (analysis.repository.description) {
      const descLines = pdf.splitTextToSize(analysis.repository.description, pageWidth - margin * 2);
      pdf.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 5;
    }
    if (analysis.repository.language) {
      pdf.text(`Language: ${analysis.repository.language}`, margin, yPosition);
      yPosition += 5;
    }
    if (analysis.repository.stargazers_count !== undefined) {
      pdf.text(`Stars: ${analysis.repository.stargazers_count.toLocaleString()}`, margin, yPosition);
      yPosition += 5;
    }
    if (analysis.repository.forks_count !== undefined) {
      pdf.text(`Forks: ${analysis.repository.forks_count.toLocaleString()}`, margin, yPosition);
      yPosition += 10;
    }
  }

  // Analysis Date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Analysis Date: ${new Date(analysis.createdAt).toLocaleDateString()}`, margin, yPosition);
  yPosition += 10;

  // Overall Score
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Overall Score', margin, yPosition);
  yPosition += 7;

  const overallScore = analysis.overall_score || 0;
  const scoreColor = overallScore >= 80 ? [34, 197, 94] : overallScore >= 60 ? [251, 191, 36] : [239, 68, 68];
  pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.rect(margin, yPosition - 5, (overallScore / 100) * 50, 8, 'F');
  pdf.setTextColor(0, 0, 0);
  pdf.text(`${overallScore}/100`, margin + 55, yPosition);
  yPosition += 15;

  // Individual Metrics
  pdf.setFontSize(14);
  pdf.text('Individual Metrics', margin, yPosition);
  yPosition += 10;

  const metrics = [
    { name: 'Originality', value: analysis.originality_score, color: [99, 102, 241] },
    { name: 'Completeness', value: analysis.completeness_score, color: [34, 197, 94] },
    { name: 'Marketability', value: analysis.marketability_score, color: [251, 191, 36] },
    { name: 'Monetization', value: analysis.monetization_score, color: [236, 72, 153] },
    { name: 'Usefulness', value: analysis.usefulness_score, color: [59, 130, 246] }
  ];

  pdf.setFontSize(11);
  metrics.forEach(metric => {
    pdf.setTextColor(0, 0, 0);
    pdf.text(metric.name, margin, yPosition);
    
    const score = metric.value || 0;
    pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
    pdf.rect(margin + 35, yPosition - 4, (score / 100) * 40, 6, 'F');
    pdf.text(`${score}/100`, margin + 80, yPosition);
    yPosition += 8;
  });

  yPosition += 5;

  // Key Findings
  if (analysis.key_findings && analysis.key_findings.length > 0) {
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Key Findings', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    analysis.key_findings.forEach((finding: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      const lines = pdf.splitTextToSize(`• ${finding}`, pageWidth - margin * 2);
      pdf.text(lines, margin + 2, yPosition);
      yPosition += lines.length * 5 + 2;
    });
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }
    
    yPosition += 5;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Recommendations', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    analysis.recommendations.forEach((rec: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      const lines = pdf.splitTextToSize(`• ${rec}`, pageWidth - margin * 2);
      pdf.text(lines, margin + 2, yPosition);
      yPosition += lines.length * 5 + 2;
    });
  }

  // Try to capture visual element if provided
  if (elementId) {
    try {
      const element = document.getElementById(elementId);
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        pdf.addPage();
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - margin * 2));
      }
    } catch (error) {
      console.error('Error capturing visual element:', error);
    }
  }

  // Save the PDF
  const fileName = `analysis_${analysis.repository?.name || 'repository'}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}

/**
 * Export analysis results as CSV
 */
export function exportToCSV(analyses: ExportAnalysis[] | ExportAnalysis) {
  const dataArray = Array.isArray(analyses) ? analyses : [analyses];
  
  // CSV Headers
  const headers = [
    'Repository Name',
    'Full Name',
    'Description',
    'Language',
    'Stars',
    'Forks',
    'Analysis Date',
    'Overall Score',
    'Originality Score',
    'Completeness Score',
    'Marketability Score',
    'Monetization Score',
    'Usefulness Score',
    'Key Findings',
    'Recommendations',
    'Weaknesses'
  ];

  // Convert data to CSV rows
  const rows = dataArray.map(analysis => {
    return [
      analysis.repository?.name || '',
      analysis.repository?.full_name || '',
      `"${(analysis.repository?.description || '').replace(/"/g, '""')}"`,
      analysis.repository?.language || '',
      analysis.repository?.stargazers_count?.toString() || '0',
      analysis.repository?.forks_count?.toString() || '0',
      new Date(analysis.createdAt).toLocaleDateString(),
      analysis.overall_score?.toString() || '0',
      analysis.originality_score?.toString() || '0',
      analysis.completeness_score?.toString() || '0',
      analysis.marketability_score?.toString() || '0',
      analysis.monetization_score?.toString() || '0',
      analysis.usefulness_score?.toString() || '0',
      `"${(analysis.key_findings?.join('; ') || '').replace(/"/g, '""')}"`,
      `"${(analysis.recommendations?.join('; ') || '').replace(/"/g, '""')}"`,
      `"${(analysis.weaknesses?.join('; ') || '').replace(/"/g, '""')}"`
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const fileName = dataArray.length > 1 
    ? `batch_analysis_${new Date().toISOString().split('T')[0]}.csv`
    : `analysis_${dataArray[0]?.repository?.name || 'repository'}_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export batch analysis results summary
 */
export function exportBatchSummary(analyses: ExportAnalysis[]) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = margin;

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(99, 102, 241);
  pdf.text('Batch Analysis Summary', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Summary Stats
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Total Repositories Analyzed: ${analyses.length}`, margin, yPosition);
  yPosition += 8;

  const avgOverall = Math.round(
    analyses.reduce((sum, a) => sum + (a.overall_score || 0), 0) / analyses.length
  );
  pdf.text(`Average Overall Score: ${avgOverall}/100`, margin, yPosition);
  yPosition += 8;

  const date = new Date().toLocaleDateString();
  pdf.text(`Export Date: ${date}`, margin, yPosition);
  yPosition += 15;

  // Repository List
  pdf.setFontSize(14);
  pdf.text('Repository Analysis Results', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  analyses.forEach((analysis, index) => {
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setTextColor(0, 0, 0);
    pdf.text(`${index + 1}. ${analysis.repository?.name || 'Unknown'}`, margin, yPosition);
    
    const score = analysis.overall_score || 0;
    const scoreColor = score >= 80 ? [34, 197, 94] : score >= 60 ? [251, 191, 36] : [239, 68, 68];
    pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.text(`Score: ${score}/100`, margin + 80, yPosition);
    
    yPosition += 6;
    
    if (analysis.repository?.description) {
      pdf.setTextColor(100, 100, 100);
      const descLines = pdf.splitTextToSize(analysis.repository.description, pageWidth - margin * 2 - 10);
      pdf.text(descLines[0], margin + 5, yPosition);
      yPosition += 6;
    }
    
    yPosition += 2;
  });

  // Save
  const fileName = `batch_analysis_summary_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}