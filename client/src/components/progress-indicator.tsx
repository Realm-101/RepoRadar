import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface ProgressIndicatorProps {
  isAnalyzing: boolean;
}

export function ProgressIndicator({ isAnalyzing }: ProgressIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isAnalyzing) {
      setProgress(0);
      setStatus('');
      return;
    }

    const stages = [
      { progress: 10, status: 'Fetching repository data...', duration: 1000 },
      { progress: 25, status: 'Analyzing code structure...', duration: 2000 },
      { progress: 40, status: 'Evaluating completeness...', duration: 2000 },
      { progress: 55, status: 'Assessing marketability...', duration: 2000 },
      { progress: 70, status: 'Calculating monetization potential...', duration: 2000 },
      { progress: 85, status: 'Generating recommendations...', duration: 2000 },
      { progress: 95, status: 'Finalizing analysis...', duration: 1000 },
    ];

    let currentStage = 0;
    
    const updateProgress = () => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage].progress);
        setStatus(stages[currentStage].status);
        
        setTimeout(() => {
          currentStage++;
          updateProgress();
        }, stages[currentStage].duration);
      }
    };

    updateProgress();
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <Card className="bg-card/50 border border-border backdrop-blur-sm mt-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{status}</span>
            <span className="text-sm text-gray-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-800">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </Progress>
        </div>
      </CardContent>
    </Card>
  );
}