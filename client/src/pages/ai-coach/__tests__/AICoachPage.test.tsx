/* eslint-disable @typescript-eslint/unbound-method */
// @vitest-environment jsdom
import '../../../stores/__tests__/setup';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

import { AICoachPage } from '../AICoachPage';
import { api } from '../../../lib/api';

// Mock api methods
vi.mock('../../../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AICoachPage Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render initial chat view with AI coach welcome message', () => {
    render(<AICoachPage />);

    expect(screen.getByText(/AI Eco-Coach/i)).toBeDefined();
    expect(screen.getByText(/hello! i am carbonwise ai/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /chat assistant/i })).toBeDefined();
  });

  it('should submit user message to api and display AI response', async () => {
    vi.mocked(api.post).mockResolvedValue({ response: 'Try riding a bicycle!' });

    render(<AICoachPage />);

    const input = screen.getByPlaceholderText(/ask anything about carbon footprints/i);
    const submitBtn = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'How can I save carbon?' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText('How can I save carbon?')).toBeDefined();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/ai/chat', { message: 'How can I save carbon?' });
      expect(screen.getByText('Try riding a bicycle!')).toBeDefined();
    });
  });

  it('should switch tabs to AI recommendations', () => {
    render(<AICoachPage />);

    const recTabBtn = screen.getByRole('button', { name: /ai recommendations/i });
    fireEvent.click(recTabBtn);

    expect(screen.getByText(/select advice focus/i)).toBeDefined();
    expect(screen.getByText(/reduction advice/i)).toBeDefined();
    expect(screen.getByText(/weekly plan/i)).toBeDefined();
    expect(screen.getByText(/behavioral insights/i)).toBeDefined();
  });

  it('should generate recommendations on button click', async () => {
    const mockRecommendations = {
      recommendations: [
        {
          title: 'Switch Commute Mode',
          impact: 'high',
          description: 'Try carpooling to work.',
        },
      ],
    };

    vi.mocked(api.post).mockResolvedValue({ recommendation: mockRecommendations });

    render(<AICoachPage />);

    // Switch to recommendations tab
    fireEvent.click(screen.getByRole('button', { name: /ai recommendations/i }));

    // Trigger generate advice
    fireEvent.click(screen.getByRole('button', { name: /generate advice/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/ai/recommendations', { type: 'reduction_advice' });
      expect(screen.getByText('Switch Commute Mode')).toBeDefined();
      expect(screen.getByText('Try carpooling to work.')).toBeDefined();
    });
  });
});
