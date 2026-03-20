import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LeaveRequests from '../LeaveRequests';
import api from '../../utils/api';

vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LeaveRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reviews a pending request as approved', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: 10,
            employeeName: 'John Employee',
            leaveTypeName: 'Annual Leave',
            startDate: '2026-04-10',
            endDate: '2026-04-12',
            reason: 'Family trip',
            status: 'pending',
          },
        ],
      },
    });

    api.put.mockResolvedValue({ data: { success: true } });

    render(<LeaveRequests />);

    expect(await screen.findByText('John Employee')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/leave-requests/10/review', {
        status: 'approved',
        comment: undefined,
      });
    });

    expect(api.get).toHaveBeenCalledWith('/leave-requests');

    await userEvent.click(screen.getByRole('button', { name: /^Approved/ }));
    expect(screen.getByText('approved')).toBeInTheDocument();
  });
});
