import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MyLeaves from '../MyLeaves';
import api from '../../utils/api';

vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MyLeaves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels a pending leave request', async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: [{ leaveTypeId: 1, leaveType: 'Annual Leave', availableDays: 12 }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: [
            {
              id: 101,
              leaveTypeName: 'Annual Leave',
              startDate: '2026-04-10',
              endDate: '2026-04-12',
              reason: 'Personal reason',
              status: 'pending',
            },
          ],
        },
      });

    api.delete.mockResolvedValue({ data: { success: true } });

    render(<MyLeaves />);

    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/leave-requests/101/cancel');
    });

    expect(screen.getByText('cancelled')).toBeInTheDocument();
  });
});
