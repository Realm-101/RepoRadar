import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Notifications } from "@/components/notifications";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import React from "react";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string; href: string; children: React.ReactNode }
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default function Header() {
  const { user, isAuthenticated } = useAuth();

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.firstName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="bg-card border-b border-border" role="banner">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          {/* Mobile Navigation */}
          <MobileNav />
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/" aria-label="RepoAnalyzer home">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <i className="fas fa-code text-white"></i>
                </div>
                <h1 className="text-2xl font-bold gradient-text">RepoAnalyzer</h1>
              </div>
            </Link>
            
            <NavigationMenu className="hidden lg:block">
              <NavigationMenuList>
                {isAuthenticated && (
                  <NavigationMenuItem>
                    <Link href="/" aria-label="Go to home page">
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                        Home
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="hover:bg-accent/50" aria-label="Discover menu">
                    <i className="fas fa-compass mr-2" aria-hidden="true"></i>
                    Discover
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/discover"
                          >
                            <i className="fas fa-rocket text-3xl mb-2"></i>
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Discover Trending
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Explore trending repositories and emerging technologies in real-time
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/search" title="Advanced Search" data-tour="advanced-search">
                        <i className="fas fa-search mr-2"></i>
                        Search with powerful filters and sorting options
                      </ListItem>
                      <ListItem href="/batch-analyze" title="Batch Analysis" data-tour="batch-analysis">
                        <i className="fas fa-layer-group mr-2"></i>
                        Analyze multiple repositories simultaneously
                      </ListItem>
                      <ListItem href="/compare" title="Compare Repos">
                        <i className="fas fa-code-compare mr-2"></i>
                        Side-by-side repository comparisons
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {isAuthenticated && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="hover:bg-accent/50" aria-label="Workspace menu">
                      <i className="fas fa-briefcase mr-2" aria-hidden="true"></i>
                      Workspace
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              href="/collections"
                            >
                              <i className="fas fa-folder-open text-3xl mb-2"></i>
                              <div className="mb-2 mt-4 text-lg font-medium">
                                Collections
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Organize repositories into custom collections
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <ListItem href="/analytics" title="Analytics Dashboard">
                          <i className="fas fa-chart-line mr-2"></i>
                          Track analysis patterns and insights
                        </ListItem>
                        <ListItem href="/advanced-analytics" title="Advanced Analytics">
                          <i className="fas fa-chart-bar mr-2"></i>
                          Deep insights and predictions
                        </ListItem>
                        <ListItem href="/teams" title="Teams">
                          <i className="fas fa-users mr-2"></i>
                          Collaborate with team members
                        </ListItem>
                        <ListItem href="/developer" title="Developer API">
                          <i className="fas fa-code mr-2"></i>
                          API keys and documentation
                        </ListItem>
                        <ListItem href="/integrations" title="Integration Hub">
                          <i className="fas fa-plug mr-2"></i>
                          Connect with external tools
                        </ListItem>
                        <ListItem href="/code-review" title="AI Code Review">
                          <i className="fas fa-robot mr-2"></i>
                          AI-powered code analysis
                        </ListItem>
                        <ListItem href="/profile" title="Profile">
                          <i className="fas fa-user mr-2"></i>
                          Manage your account and preferences
                        </ListItem>
                        <ListItem href="/bookmarks" title="Bookmarks">
                          <i className="fas fa-bookmark mr-2"></i>
                          Quick access to saved repositories
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="hover:bg-accent/50" aria-label="Resources menu">
                    <i className="fas fa-graduation-cap mr-2" aria-hidden="true"></i>
                    Resources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/docs"
                          >
                            <i className="fas fa-book text-3xl mb-2"></i>
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Documentation
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Complete guide to all features and capabilities
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/pricing" title="Pricing" data-tour="pricing-nav">
                        <i className="fas fa-tag mr-2"></i>
                        View plans and upgrade options
                      </ListItem>
                      <ListItem href="/docs#api" title="API Reference">
                        <i className="fas fa-code mr-2"></i>
                        Developer documentation
                      </ListItem>
                      <ListItem href="/docs#faq" title="FAQ">
                        <i className="fas fa-question-circle mr-2"></i>
                        Frequently asked questions
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <div data-tour="theme-toggle">
              <ThemeToggle />
            </div>
            {isAuthenticated && (
              <div data-tour="notification-bell">
                <Notifications />
              </div>
            )}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" data-tour="profile-nav">
                  <div className="flex items-center space-x-3 hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors touch-target">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={`${displayName}'s profile picture`}
                        className="w-8 h-8 rounded-lg object-cover"
                        data-testid="img-avatar"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-white font-medium">{displayName}</span>
                  </div>
                </Link>
              </div>
            ) : (
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white button-hover hover-shine button-scale touch-target focus-ring"
                data-testid="button-login"
                data-tour="profile-nav"
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}