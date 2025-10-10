import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/theme-context";
import { NeonAuthProvider } from "@/contexts/neon-auth-context";
import NotFound from "@/pages/not-found";
import Splash from "@/pages/splash";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Analyze from "@/pages/analyze";
import RepositoryDetail from "@/pages/repository-detail";
import Compare from "@/pages/compare";
import Profile from "@/pages/profile";
import Discover from "@/pages/discover";
import Docs from "@/pages/docs";
import Pricing from "@/pages/pricing";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import BatchAnalyze from "@/pages/batch-analyze";
import Collections from "@/pages/collections";
import Analytics from "@/pages/analytics";
import Teams from "@/pages/teams";
import Developer from "@/pages/developer";
import AdvancedAnalytics from "@/pages/advanced-analytics";
import Integrations from "@/pages/integrations";
import CodeReview from "@/pages/code-review";
import AdminDashboard from "@/pages/admin";
import SignInPage from "@/pages/handler/sign-in";
import SignUpPage from "@/pages/handler/sign-up";
import { AIAssistant } from "@/components/ai-assistant";
import OnboardingTour from "@/components/onboarding-tour";
import { SkipLink } from "@/components/skip-link";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { usePageTracking } from "@/hooks/usePageTracking";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  usePageTracking(); // Track page views automatically

  return (
    <Switch>
      {/* Splash screen - initial entry point */}
      <Route path="/" component={Splash} />
      
      {/* Auth routes */}
      <Route path="/handler/sign-in" component={SignInPage} />
      <Route path="/handler/sign-up" component={SignUpPage} />
      
      {/* Public routes - available to everyone */}
      <Route path="/landing" component={Landing} />
      <Route path="/analyze" component={Analyze} />
      <Route path="/batch-analyze" component={BatchAnalyze} />
      <Route path="/search" component={Search} />
      <Route path="/repository/:id" component={RepositoryDetail} />
      <Route path="/compare" component={Compare} />
      <Route path="/discover" component={Discover} />
      <Route path="/docs" component={Docs} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/developer" component={Developer} />
      <Route path="/advanced-analytics" component={AdvancedAnalytics} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/code-review" component={CodeReview} />
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Home page - for authenticated users */}
      {isAuthenticated && (
        <Route path="/home" component={Home} />
      )}
      
      {/* Protected routes - only for authenticated users */}
      {isAuthenticated && (
        <>
          <Route path="/profile" component={Profile} />
          <Route path="/collections" component={Collections} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/teams" component={Teams} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NeonAuthProvider>
          <TooltipProvider>
            <SkipLink />
            <KeyboardShortcutsDialog />
            <Toaster />
            <Router />
            <AIAssistant />
            <OnboardingTour />
          </TooltipProvider>
        </NeonAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
