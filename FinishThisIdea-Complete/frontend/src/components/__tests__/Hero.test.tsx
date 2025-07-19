import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test-utils';
import Hero from '../Landing/Hero';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Hero Component', () => {
  it('renders the main heading', () => {
    render(<Hero />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('displays the call-to-action button', () => {
    render(<Hero />);
    
    const ctaButton = screen.getByRole('button', { name: /get started/i });
    expect(ctaButton).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<Hero />);
    
    // Look for key phrases that should be in the hero description
    expect(screen.getByText(/clean.*code/i)).toBeInTheDocument();
  });

  it('handles CTA button click', async () => {
    const user = userEvent.setup();
    render(<Hero />);
    
    const ctaButton = screen.getByRole('button', { name: /get started/i });
    await user.click(ctaButton);
    
    // Verify the button is clickable and doesn't throw errors
    expect(ctaButton).toBeInTheDocument();
  });

  it('displays pricing information', () => {
    render(<Hero />);
    
    // Look for the $1 pricing
    expect(screen.getByText(/\$1/)).toBeInTheDocument();
  });

  it('shows upload file prompt', () => {
    render(<Hero />);
    
    // Look for upload-related text
    expect(screen.getByText(/upload/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Hero />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: /get started/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute('disabled');
  });

  it('renders without crashing', () => {
    expect(() => render(<Hero />)).not.toThrow();
  });
});