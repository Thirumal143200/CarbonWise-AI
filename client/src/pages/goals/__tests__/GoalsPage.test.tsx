/* eslint-disable @typescript-eslint/unbound-method */
// @vitest-environment jsdom
import '../../../stores/__tests__/setup';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

import { GoalsPage } from '../GoalsPage';
import { api } from '../../../lib/api';

// Mock api methods
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('GoalsPage Component', () => {
  const mockGoals = [
    {
      id: 'goal-1',
      title: 'Reduce Commute Footprint',
      targetReductionPct: 15,
      baselineKg: 120,
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      status: 'active',
      progressPct: 40,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render loading state on initial mount', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {})); // Never resolves to keep loading

    render(<GoalsPage />);

    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText(/loading goals/i)).toBeDefined();
  });

  it('should render no goals page when goals list is empty', async () => {
    vi.mocked(api.get).mockResolvedValue({ goals: [] });

    render(<GoalsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no active goals/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /create your first goal/i })).toBeDefined();
    });
  });

  it('should render active goals list when loaded', async () => {
    vi.mocked(api.get).mockResolvedValue({ goals: mockGoals });

    render(<GoalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Reduce Commute Footprint')).toBeDefined();
      expect(screen.getByText('120 kg')).toBeDefined();
    });
  });

  it('should open new target creation modal when clicked', async () => {
    vi.mocked(api.get).mockResolvedValue({ goals: mockGoals });

    render(<GoalsPage />);

    const openModalBtn = await screen.findByRole('button', { name: /new target/i });
    fireEvent.click(openModalBtn);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByLabelText(/goal title/i)).toBeDefined();
  });
});
