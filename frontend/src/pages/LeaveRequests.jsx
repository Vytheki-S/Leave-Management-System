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

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return '-';
  }
  return `${startDate} to ${endDate}`;
}

function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [reviewModal, setReviewModal] = useState({
    request: null,
    status: 'approved',
    comment: '',
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/leave-requests');
      setRequests(unwrapData(response) || []);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load leave requests'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = async (requestId, status, comment) => {
    setActioningId(requestId);
    try {
      await api.put(`/leave-requests/${requestId}/review`, {
        status,
        comment: comment || undefined,
      });
      setRequests((prev) =>
        prev.map((item) => (String(item.id) === String(requestId) ? { ...item, status } : item))
      );
      toast.success(`Request ${status}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, `Failed to ${status} request`));
    } finally {
      setActioningId(null);
    }
  };

  const openReviewModal = (request, status) => {
    setReviewModal({
      request,
      status,
      comment: '',
    });
  };

  const closeReviewModal = () => {
    setReviewModal({ request: null, status: 'approved', comment: '' });
  };

  const confirmReview = async () => {
    if (!reviewModal.request) {
      return;
    }

    await updateStatus(reviewModal.request.id, reviewModal.status, reviewModal.comment);
    closeReviewModal();
  };

  const statusCounts = useMemo(() => {
    const counts = { all: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    requests.forEach((item) => {
      const normalized = String(item.status || '').toLowerCase();
      if (counts[normalized] !== undefined) {
        counts[normalized] += 1;
      }
      counts.all += 1;
    });
    return counts;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (activeFilter === 'all') {
      return requests;
    }
    return requests.filter((item) => String(item.status || '').toLowerCase() === activeFilter);
  }, [activeFilter, requests]);

  if (loading) {
    return <section className="grid min-h-[40vh] place-items-center text-slate-500">Loading leave requests...</section>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">Leave Requests</h1>
        <p className="page-subtitle">Review and moderate all submitted leave requests.</p>
      </header>

      <div className="app-card p-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeFilter === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-dark-card2 text-text-secondary hover:text-text-green'
              }`}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label} ({statusCounts[filter.value] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <div className="app-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                  No leave requests found.
                </td>
              </tr>
            )}
            {filteredRequests.map((request) => (
              <tr key={request.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium text-slate-800">{request.employeeName || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{request.leaveTypeName || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateRange(request.startDate, request.endDate)}</td>
                <td className="px-4 py-3 text-slate-600">{request.days || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{request.reason}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => openReviewModal(request, 'approved')}
                      disabled={request.status !== 'pending' || actioningId === request.id}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => openReviewModal(request, 'rejected')}
                      disabled={request.status !== 'pending' || actioningId === request.id}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewModal.request && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
          <div className="app-card w-full max-w-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary">
              {reviewModal.status === 'approved' ? 'Approve request' : 'Reject request'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">Review this summary before confirming.</p>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-muted">Employee</dt>
                <dd className="font-medium text-text-primary">{reviewModal.request.employeeName || '-'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Leave type</dt>
                <dd className="font-medium text-text-primary">{reviewModal.request.leaveTypeName || '-'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Dates</dt>
                <dd className="font-medium text-text-primary">
                  {formatDateRange(reviewModal.request.startDate, reviewModal.request.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Days</dt>
                <dd className="font-medium text-text-primary">{reviewModal.request.days || '-'}</dd>
              </div>
            </dl>

            <p className="mt-3 rounded-lg bg-dark-card2 px-3 py-2 text-sm text-text-secondary">
              {reviewModal.request.reason || 'No reason provided.'}
            </p>

            <label className="mt-4 block text-sm font-medium text-text-secondary" htmlFor="review-comment">
              Comment (optional)
            </label>
            <textarea
              id="review-comment"
              className="form-input mt-2 min-h-24"
              value={reviewModal.comment}
              onChange={(event) =>
                setReviewModal((prev) => ({
                  ...prev,
                  comment: event.target.value,
                }))
              }
              placeholder="Share the review decision context"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={closeReviewModal}>
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmReview}
                disabled={actioningId === reviewModal.request.id}
              >
                {actioningId === reviewModal.request.id
                  ? 'Saving...'
                  : reviewModal.status === 'approved'
                  ? 'Confirm approval'
                  : 'Confirm rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default LeaveRequests;
