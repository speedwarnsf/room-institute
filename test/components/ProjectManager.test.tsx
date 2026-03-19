/**
 * Tests for ProjectManager component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectManager } from '../../components/ProjectManager';

// Mock project storage
vi.mock('../../services/projectStorage', () => ({
  getProjects: vi.fn().mockResolvedValue([]),
  saveProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  createProject: vi.fn().mockImplementation((name: string, desc?: string) => ({
    id: 'test-id-123',
    name,
    description: desc || '',
    roomIds: [],
    styleGuide: { colors: [], materials: [], notes: '', palette: [] },
    budget: { items: [], currency: 'USD' },
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  addRoomToProject: vi.fn(),
  removeRoomFromProject: vi.fn(),
  addBudgetItem: vi.fn(),
  toggleBudgetItemPurchased: vi.fn(),
  deleteBudgetItem: vi.fn(),
}));

vi.mock('../../services/houseRoomStorage', () => ({
  getRooms: vi.fn().mockResolvedValue([]),
}));

describe('ProjectManager', () => {
  const mockOnBack = vi.fn();
  const mockOnOpenRoom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Projects heading', async () => {
    render(<ProjectManager onBack={mockOnBack} onOpenRoom={mockOnOpenRoom} />);
    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  it('shows new project button', async () => {
    render(<ProjectManager onBack={mockOnBack} onOpenRoom={mockOnOpenRoom} />);
    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectManager onBack={mockOnBack} onOpenRoom={mockOnOpenRoom} />);
    // The ArrowLeft button is the first button
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows new project form when New Project is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectManager onBack={mockOnBack} onOpenRoom={mockOnOpenRoom} />);
    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
    await user.click(screen.getByText('New Project'));
    expect(screen.getByPlaceholderText(/Project name/)).toBeInTheDocument();
  });

  it('displays empty state when no projects exist', async () => {
    render(<ProjectManager onBack={mockOnBack} onOpenRoom={mockOnOpenRoom} />);
    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });
  });

  it('renders project list when projects exist', async () => {
    const { getProjects } = await import('../../services/projectStorage');
    (getProjects as any).mockResolvedValueOnce([
      {
        id: 'p1',
        name: 'Living Room Reno',
        description: 'Full renovation',
        roomIds: ['r1'],
        styleGuide: { colors: [], materials: [], notes: '', palette: [] },
        budget: { items: [], currency: 'USD' },
        notes: '',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ]);
    render(<ProjectManager onBack={mockOnBack} onOpenRoom={mockOnOpenRoom} />);
    await waitFor(() => {
      expect(screen.getByText('Living Room Reno')).toBeInTheDocument();
    });
  });
});
