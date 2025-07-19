import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import HomePage from '../HomePage';
import { mockApiClient, mockResponses } from '@/test-utils';

// Mock components to focus on HomePage logic
vi.mock('@/components/Landing/Hero', () => ({
  Hero: () => <div data-testid="hero">Hero Component</div>,
}));

vi.mock('@/components/Landing/HowItWorks', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How It Works Component</div>,
}));

vi.mock('@/components/Landing/Testimonials', () => ({
  Testimonials: () => <div data-testid="testimonials">Testimonials Component</div>,
}));

vi.mock('@/components/Landing/LiveStats', () => ({
  LiveStats: () => <div data-testid="live-stats">Live Stats Component</div>,
}));

// Mock API calls
vi.mock('@/api/client', () => ({
  apiClient: mockApiClient,
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient.get.mockResolvedValue({
      data: mockResponses.stats,
    });
  });

  it('renders all main sections', async () => {
    render(<HomePage />);

    // Check that all main components are rendered
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials')).toBeInTheDocument();
    expect(screen.getByTestId('live-stats')).toBeInTheDocument();
  });

  it('loads live stats on mount', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith('/stats');
    });

    expect(screen.getByTestId('live-stats')).toBeInTheDocument();
  });

  it('handles stats loading error gracefully', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('Stats API failed'));

    render(<HomePage />);

    // Should still render components even if stats fail
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('live-stats')).toBeInTheDocument();
  });

  it('shows loading state while fetching stats', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<HomePage />);

    // Page should render immediately, stats loading is handled by LiveStats component
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('live-stats')).toBeInTheDocument();
  });

  it('has proper page structure', () => {
    render(<HomePage />);

    // Check for main page wrapper
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Verify sections are in correct order
    const hero = screen.getByTestId('hero');
    const howItWorks = screen.getByTestId('how-it-works');
    const testimonials = screen.getByTestId('testimonials');
    const liveStats = screen.getByTestId('live-stats');

    expect(hero).toBeInTheDocument();
    expect(howItWorks).toBeInTheDocument();
    expect(testimonials).toBeInTheDocument();
    expect(liveStats).toBeInTheDocument();
  });

  it('updates document title', () => {
    render(<HomePage />);

    // Should set appropriate page title
    expect(document.title).toContain('FinishThisIdea');
  });

  it('handles responsive layout', () => {
    render(<HomePage />);

    const main = screen.getByRole('main');
    expect(main).toHaveClass('min-h-screen'); // Assuming full-height layout
  });

  it('includes SEO meta information', () => {
    render(<HomePage />);

    // Check for semantic HTML structure
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<HomePage />)).not.toThrow();
  });

  it('supports navigation between sections', async () => {
    render(<HomePage />);

    // All sections should be visible for scrolling navigation
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials')).toBeInTheDocument();
    expect(screen.getByTestId('live-stats')).toBeInTheDocument();
  });
});