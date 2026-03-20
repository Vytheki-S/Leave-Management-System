import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Sidebar from '../Sidebar';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Sidebar role visibility', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('hides management links for employee role', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'employee' } });

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('My Leaves')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Employees')).not.toBeInTheDocument();
    expect(screen.queryByText('Leave Requests')).not.toBeInTheDocument();
  });

  it('shows management links for manager role', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'manager' } });

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Leave Requests')).toBeInTheDocument();
  });
});
