import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import api from '../utils/api';
import { extractErrorMessage, unwrapData } from '../utils/apiResponse';

const initialState = {
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  days: 0,
  reason: '',
};

function ApplyLeave() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [daysEditedManually, setDaysEditedManually] = useState(false);

  useEffect(() => {
    const loadLeaveTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await api.get('/leave-types');
        const types = unwrapData(response) || [];
        setLeaveTypes(types);
        if (types.length > 0) {
          setForm((prev) => ({ ...prev, leaveTypeId: String(types[0].id) }));
        }
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Failed to load leave types'));
      } finally {
        setLoadingTypes(false);
      }
    };

    loadLeaveTypes();
  }, []);

  const computedDays = useMemo(() => {
    if (!form.startDate || !form.endDate) {
      return 0;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const dayMs = 24 * 60 * 60 * 1000;
    const diff = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
    return Number.isFinite(diff) && diff > 0 ? diff : 0;
  }, [form.startDate, form.endDate]);

  useEffect(() => {
    if (daysEditedManually) {
      return;
    }

    setForm((prev) => {
      if (prev.days === computedDays) {
        return prev;
      }
      return { ...prev, days: computedDays };
    });
  }, [computedDays, daysEditedManually]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'days') {
      setDaysEditedManually(true);
      const parsed = Number(value);
      setForm((prev) => ({
        ...prev,
        days: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/leave-requests', {
        leaveTypeId: Number(form.leaveTypeId),
        startDate: form.startDate,
        endDate: form.endDate,
        days: Number(form.days),
        reason: form.reason,
      });
      toast.success('Leave request submitted');
      setForm(initialState);
      setDaysEditedManually(false);
      navigate('/my-leaves');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to submit request'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTypes) {
    return <section className="grid min-h-[40vh] place-items-center text-slate-500">Loading leave types...</section>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">Apply Leave</h1>
        <p className="page-subtitle">Submit your leave request for manager approval.</p>
      </header>

      <div className="app-card max-w-2xl p-4 sm:p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Leave Type</label>
            <select name="leaveTypeId" value={form.leaveTypeId} onChange={handleChange} className="form-input" required>
              {leaveTypes.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Number of Days</label>
            <input
              type="number"
              name="days"
              value={form.days}
              onChange={handleChange}
              min={1}
              step={1}
              className="form-input"
              required
            />
            <p className="mt-1 text-xs text-text-muted">
              Auto from selected dates: {computedDays} day{computedDays === 1 ? '' : 's'}.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={4}
              className="form-input"
              placeholder="Brief reason for your leave"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !form.leaveTypeId || Number(form.days) <= 0}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ApplyLeave;
