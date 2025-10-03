import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Notifications } from "@/components/notifications";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, Home, Search, Compass, Briefcase, BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.firstName || user?.email?.split('@')[0] || 'User';

  // Close menu when route changes or screen size changes
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setExpandedSection(null);
  };

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between lg:hidden">
        <Link href="/" onClick={closeMenu} aria-label="RepoAnalyzer home">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <i className="fas fa-code text-white text-sm" aria-hidden="true"></i>
            </div>
            <h1 className="text-lg font-bold gradient-text">RepoAnalyzer</h1>
          </div>
        </Link>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {isAuthenticated && <Notifications />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="touch-target"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="p-6">
          {/* User Profile Section */}
          {isAuthenticated ? (
            <Link href="/profile" onClick={closeMenu}>
              <div className="flex items-center space-x-3 mb-6 p-3 rounded-lg hover:bg-muted transition-colors touch-target">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={`${displayName}'s profile picture`}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{displayName}</p>
                  <p className="text-xs text-muted-foreground">View Profile</p>
                </div>
              </div>
            </Link>
          ) : (
            <Button
              onClick={() => {
                closeMenu();
                window.location.href = '/api/login';
              }}
              className="w-full mb-6 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary touch-target focus-ring"
              aria-label="Sign in to your account"
            >
              Sign In
            </Button>
          )}

          {/* Navigation Links */}
          <nav className="space-y-2">
            {isAuthenticated && (
              <Link href="/" onClick={closeMenu} aria-label="Go to home page">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors touch-target focus-ring">
                  <Home className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Home</span>
                </div>
              </Link>
            )}

            {/* Discover Section */}
            <div>
              <button
                onClick={() => toggleSection('discover')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors touch-target focus-ring"
                aria-expanded={expandedSection === 'discover'}
                aria-controls="discover-menu"
                aria-label="Discover menu"
              >
                <div className="flex items-center space-x-3">
                  <Compass className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Discover</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSection === 'discover' && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
              {expandedSection === 'discover' && (
                <div id="discover-menu" className="ml-8 mt-2 space-y-1" role="menu">
                  <Link href="/discover" onClick={closeMenu}>
                    <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                      Trending Repos
                    </div>
                  </Link>
                  <Link href="/search" onClick={closeMenu}>
                    <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                      Advanced Search
                    </div>
                  </Link>
                  <Link href="/batch-analyze" onClick={closeMenu}>
                    <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                      Batch Analysis
                    </div>
                  </Link>
                  <Link href="/compare" onClick={closeMenu}>
                    <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                      Compare Repos
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Workspace Section */}
            {isAuthenticated && (
              <div>
                <button
                  onClick={() => toggleSection('workspace')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors touch-target focus-ring"
                  aria-expanded={expandedSection === 'workspace'}
                  aria-controls="workspace-menu"
                  aria-label="Workspace menu"
                >
                  <div className="flex items-center space-x-3">
                    <Briefcase className="w-5 h-5" aria-hidden="true" />
                    <span className="font-medium">Workspace</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedSection === 'workspace' && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>
                {expandedSection === 'workspace' && (
                  <div id="workspace-menu" className="ml-8 mt-2 space-y-1" role="menu">
                    <Link href="/collections" onClick={closeMenu}>
                      <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                        Collections
                      </div>
                    </Link>
                    <Link href="/analytics" onClick={closeMenu}>
                      <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                        Analytics
                      </div>
                    </Link>
                    <Link href="/advanced-analytics" onClick={closeMenu}>
                      <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                        Advanced Analytics
                      </div>
                    </Link>
                    <Link href="/teams" onClick={closeMenu}>
                      <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                        Teams
                      </div>
                    </Link>
                    <Link href="/developer" onClick={closeMenu}>
                      <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                        Developer API
                      </div>
                    </Link>
                    <Link href="/integrations" onClick={closeMenu}>
                      <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                        Integrations
                      </div>
                    </Link>
                    <Link href="/code-review" onClick={closeMenu}>
                      <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                        AI Code Review
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Resources Section */}
            <div>
              <button
                onClick={() => toggleSection('resources')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors touch-target focus-ring"
                aria-expanded={expandedSection === 'resources'}
                aria-controls="resources-menu"
                aria-label="Resources menu"
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">Resources</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSection === 'resources' && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
              {expandedSection === 'resources' && (
                <div id="resources-menu" className="ml-8 mt-2 space-y-1" role="menu">
                  <Link href="/docs" onClick={closeMenu}>
                    <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                      Documentation
                    </div>
                  </Link>
                  <Link href="/pricing" onClick={closeMenu}>
                    <div className="p-2 rounded-lg hover:bg-muted transition-colors touch-target text-sm">
                      Pricing
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
