import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import api from '../utils/api';
import { extractErrorMessage, unwrapData } from '../utils/apiResponse';
import StatusBadge from '../components/StatusBadge';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

function clampPercentage(value) {
  return Math.max(0, Math.min(100, value));
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return '-';
  }
  return `${startDate} to ${endDate}`;
}

function MyLeaves() {
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelModalRequest, setCancelModalRequest] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [balancesResponse, leavesResponse] = await Promise.all([
        api.get('/leave-balances'),
        api.get('/leave-requests'),
      ]);
      setBalances(unwrapData(balancesResponse) || []);
      setHistory(unwrapData(leavesResponse) || []);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load leaves'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cancelRequest = async (id) => {
    setCancelingId(id);
    try {
      await api.delete(`/leave-requests/${id}/cancel`);
      setHistory((prev) =>
        prev.map((item) =>
          String(item.id) === String(id) ? { ...item, status: 'cancelled' } : item
        )
      );
      toast.success('Leave request cancelled');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to cancel leave request'));
    } finally {
      setCancelingId(null);
    }
  };

  const filteredHistory = useMemo(() => {
    if (statusFilter === 'all') {
      return history;
    }
    return history.filter((item) => String(item.status).toLowerCase() === statusFilter);
  }, [history, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: history.length, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    history.forEach((item) => {
      const normalized = String(item.status || '').toLowerCase();
      if (counts[normalized] !== undefined) {
        counts[normalized] += 1;
      }
    });
    return counts;
  }, [history]);

  const confirmCancel = async () => {
    if (!cancelModalRequest) {
      return;
    }

    await cancelRequest(cancelModalRequest.id);
    setCancelModalRequest(null);
  };

  if (loading) {
    return <section className="grid min-h-[40vh] place-items-center text-slate-500">Loading leave data...</section>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">My Leaves</h1>
        <p className="page-subtitle">Track balances and monitor your request history.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {balances.map((item) => (
          <div key={item.leaveTypeId} className="app-card bg-gradient-to-r from-dark-card to-[#1d2230] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base text-text-muted">{item.leaveType || 'Leave Type'}</p>
                <p className="mt-2 flex items-end gap-2 text-text-primary">
                  <span className="text-[2.15rem] font-semibold leading-none">{item.availableDays}</span>
                  <span className="pb-1 text-lg text-text-muted">days</span>
                </p>
              </div>
              <span className="text-sm text-[#8aa1c5]">
                {item.usedDays || 0}/{item.totalDays || 0} used
              </span>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-dark-card2">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${clampPercentage(
                    item.totalDays > 0 ? ((item.usedDays || 0) / item.totalDays) * 100 : 0
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
        {balances.length === 0 && (
          <div className="app-card p-4 sm:col-span-3">
            <p className="text-sm text-slate-500">No leave balances available.</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                statusFilter === filter.value
                  ? 'bg-primary text-white shadow-[0_0_18px_rgba(22,163,74,0.3)]'
                  : 'bg-dark-card2 text-text-secondary hover:text-text-green'
              }`}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label} ({statusCounts[filter.value] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <div className="app-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-card2 text-left text-text-muted">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date Range</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  No leave history found.
                </td>
              </tr>
            )}
            {filteredHistory.map((item) => (
              <tr key={item.id} className="border-t border-dark-border">
                <td className="px-4 py-3 font-medium text-text-primary">{item.leaveTypeName || '-'}</td>
                <td className="px-4 py-3 text-[#8aa1c5]">{formatDateRange(item.startDate, item.endDate)}</td>
                <td className="px-4 py-3 font-semibold text-text-primary">{item.days || '-'}</td>
                <td className="px-4 py-3 text-text-secondary">{item.reason}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-xl border border-dark-border2 bg-dark-card px-4 py-1.5 text-sm text-text-primary transition hover:border-primary disabled:opacity-50"
                    disabled={item.status !== 'pending' || cancelingId === item.id}
                    onClick={() => setCancelModalRequest(item)}
                  >
                    {cancelingId === item.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cancelModalRequest && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
          <div className="app-card w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary">Cancel leave request</h2>
            <p className="mt-1 text-sm text-text-muted">This request will be marked as cancelled and cannot be re-opened.</p>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-muted">Leave type</dt>
                <dd className="font-medium text-text-primary">{cancelModalRequest.leaveTypeName || '-'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Dates</dt>
                <dd className="font-medium text-text-primary">
                  {formatDateRange(cancelModalRequest.startDate, cancelModalRequest.endDate)}
                </dd>
              </div>
            </dl>

            <p className="mt-3 rounded-lg bg-dark-card2 px-3 py-2 text-sm text-text-secondary">
              {cancelModalRequest.reason || 'No reason provided.'}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setCancelModalRequest(null)}>
                Keep request
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmCancel}
                disabled={cancelingId === cancelModalRequest.id}
              >
                {cancelingId === cancelModalRequest.id ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default MyLeaves;
