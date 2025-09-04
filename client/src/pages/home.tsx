import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import EnhancedSearch from "@/components/enhanced-search";
import RepositoryCard from "@/components/repository-card";
import { isUnauthorizedError } from "@/lib/authUtils";
import { TrendingRepos } from "@/components/trending-repos";
import { CardSkeleton } from "@/components/skeleton-loader";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: recentAnalyses, isLoading: loadingAnalyses } = useQuery<any[]>({
    queryKey: ['/api/analyses/recent'],
    enabled: isAuthenticated,
  });

  const { data: trendingRepos, isLoading: loadingTrending } = useQuery<any[]>({
    queryKey: ['/api/repositories/recent'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <Header />
      
      <EnhancedSearch />

      {/* Dashboard Grid */}
      <section className="py-16 bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trending Repositories - Left Column */}
            <div className="lg:col-span-1">
              <TrendingRepos />
            </div>
            
            {/* Recent Analyses - Right Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-bold">Recent Analysis</h3>
                <button className="text-primary hover:text-secondary transition-colors font-medium" data-testid="button-view-all">
                  View All
                </button>
              </div>

              {loadingAnalyses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                      <div className="h-4 bg-gray-700 rounded mb-4"></div>
                      <div className="h-3 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentAnalyses && recentAnalyses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentAnalyses.slice(0, 4).map((analysis: any) => (
                    <RepositoryCard
                      key={analysis.id}
                      repository={analysis.repository}
                      analysis={analysis}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-chart-line text-white text-2xl"></i>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">No Recent Analysis</h4>
                  <p className="text-gray-400 mb-4">Start analyzing repositories to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
