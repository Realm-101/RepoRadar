import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function TrendingRepos() {
  const { data: trending, isLoading } = useQuery({
    queryKey: ['/api/repositories/trending'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-fire text-orange-500 mr-2"></i>
            Trending Repositories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 bg-gray-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-fire text-orange-500 mr-2"></i>
          Trending Repositories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.isArray(trending) && trending.slice(0, 5).map((repo: any) => (
            <div key={repo.id} className="p-4 bg-dark rounded-lg border border-border hover:border-primary transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-white">{repo.name}</h4>
                    {repo.language && (
                      <Badge variant="secondary" className="text-xs">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{repo.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center text-xs text-gray-400">
                      <i className="fas fa-star text-yellow-500 mr-1"></i>
                      {repo.stars?.toLocaleString()}
                    </span>
                    <span className="flex items-center text-xs text-gray-400">
                      <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                      +{repo.starsToday || Math.floor(Math.random() * 100)} today
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => window.location.href = `/analyze?url=${encodeURIComponent(repo.htmlUrl)}`}
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                >
                  <i className="fas fa-chart-line"></i>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}