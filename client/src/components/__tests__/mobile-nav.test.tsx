import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileNav } from '../mobile-nav';
import * as useMobileHook from '@/hooks/use-mobile';
import * as useAuthHook from '@/hooks/useAuth';

// Mock the hooks
vi.mock('@/hooks/use-mobile');
vi.mock('@/hooks/useAuth');
vi.mock('wouter', () => ({
  Link: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>{children}</a>
  ),
}));

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render on desktop', () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(false);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    const { container } = render(<MobileNav />);
    expect(container.firstChild).toBeNull();
  });

  it('should render mobile menu button on mobile', () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(<MobileNav />);
    const menuButton = screen.getByTestId('button-mobile-menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle menu when button is clicked', async () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(<MobileNav />);
    const menuButton = screen.getByTestId('button-mobile-menu');
    
    // Menu should be closed initially
    expect(screen.queryByRole('dialog')).not.toBeVisible();
    
    // Open menu
    fireEvent.click(menuButton);
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('translate-x-0');
    });
  });

  it('should show sign in button when not authenticated', () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(<MobileNav />);
    fireEvent.click(screen.getByTestId('button-mobile-menu'));
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should show user profile when authenticated', () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(<MobileNav />);
    fireEvent.click(screen.getByTestId('button-mobile-menu'));
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('View Profile')).toBeInTheDocument();
  });

  it('should expand and collapse sections', async () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(<MobileNav />);
    fireEvent.click(screen.getByTestId('button-mobile-menu'));
    
    // Find and click the Discover section
    const discoverButton = screen.getByText('Discover').closest('button');
    expect(discoverButton).toBeInTheDocument();
    
    fireEvent.click(discoverButton!);
    
    await waitFor(() => {
      expect(screen.getByText('Trending Repos')).toBeInTheDocument();
      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
    });
  });

  it('should have touch-friendly targets (44x44 minimum)', () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(<MobileNav />);
    const menuButton = screen.getByTestId('button-mobile-menu');
    
    expect(menuButton).toHaveClass('touch-target');
  });

  it('should prevent body scroll when menu is open', async () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(<MobileNav />);
    const menuButton = screen.getByTestId('button-mobile-menu');
    
    // Open menu
    fireEvent.click(menuButton);
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });
    
    // Close menu
    fireEvent.click(menuButton);
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  it('should close menu when clicking overlay', async () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(<MobileNav />);
    const menuButton = screen.getByTestId('button-mobile-menu');
    
    // Open menu
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('translate-x-0');
    });
    
    // Click overlay
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('translate-x-full');
    });
  });

  it('should show workspace section only when authenticated', () => {
    vi.spyOn(useMobileHook, 'useIsMobile').mockReturnValue(true);
    
    // Not authenticated
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    const { rerender } = render(<MobileNav />);
    fireEvent.click(screen.getByTestId('button-mobile-menu'));
    
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
    
    // Authenticated
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { firstName: 'John' },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    rerender(<MobileNav />);
    fireEvent.click(screen.getByTestId('button-mobile-menu'));
    
    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });
});
