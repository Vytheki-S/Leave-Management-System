import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { extractErrorMessage, unwrapData } from '../utils/apiResponse';

function formatDate(rawDate) {
  if (!rawDate) {
    return '-';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleDateString();
}

function roleChipClass(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') {
    return 'border-[#1665344f] bg-[#1665342f] text-[#4ade80]';
  }
  if (normalized === 'manager') {
    return 'border-[#1d4ed84f] bg-[#1d4ed82f] text-[#93c5fd]';
  }
  return 'border-dark-border2 bg-dark-card2 text-text-secondary';
}

function Profile() {
  const { user, updateProfileLocal } = useAuth();
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    position: user?.position || '',
  });

  const initials = useMemo(() => {
    const name = String(user?.fullName || '').trim();
    if (!name) {
      return 'NA';
    }
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }, [user?.fullName]);

  const departmentName = useMemo(() => {
    if (!user?.departmentId) {
      return 'Unassigned';
    }
    const found = departments.find((department) => department.id === user.departmentId);
    return found?.name || 'Unassigned';
  }, [departments, user?.departmentId]);

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      position: user?.position || '',
    });
  }, [user]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(unwrapData(response) || []);
      } catch {
        setDepartments([]);
      }
    };

    loadDepartments();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);

    try {
      const response = await api.put('/profile', {
        fullName: form.fullName.trim(),
        position: form.position.trim() || undefined,
      });
      const updatedUser = unwrapData(response) || {
        ...user,
        fullName: form.fullName.trim(),
        position: form.position.trim() || null,
      };
      updateProfileLocal({ ...user, ...updatedUser });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account identity, role details, and contact information.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="app-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#1665344f] bg-gradient-to-br from-[#16653440] to-[#14532d30] text-xl font-bold text-[#4ade80]">
                {initials}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Account</p>
                <h2 className="text-2xl font-semibold text-text-primary">{user?.fullName || 'Team Member'}</h2>
                <p className="mt-1 text-sm text-text-secondary">{user?.email || '-'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${roleChipClass(user?.role)}`}
              >
                {user?.role || 'employee'}
              </span>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  user?.isActive
                    ? 'border-[#1665344f] bg-[#16a34a18] text-[#4ade80]'
                    : 'border-dark-border2 bg-dark-card2 text-text-muted'
                }`}
              >
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-dark-border bg-dark-card2 p-3">
              <p className="text-xs uppercase tracking-wide text-text-muted">Employee ID</p>
              <p className="mt-1 text-sm font-medium text-text-primary">{user?.employeeId || '-'}</p>
            </div>
            <div className="rounded-xl border border-dark-border bg-dark-card2 p-3">
              <p className="text-xs uppercase tracking-wide text-text-muted">Department</p>
              <p className="mt-1 text-sm font-medium text-text-primary">{departmentName}</p>
            </div>
            <div className="rounded-xl border border-dark-border bg-dark-card2 p-3">
              <p className="text-xs uppercase tracking-wide text-text-muted">Joined</p>
              <p className="mt-1 text-sm font-medium text-text-primary">{formatDate(user?.createdAt)}</p>
            </div>
            <div className="rounded-xl border border-dark-border bg-dark-card2 p-3">
              <p className="text-xs uppercase tracking-wide text-text-muted">Last Updated</p>
              <p className="mt-1 text-sm font-medium text-text-primary">{formatDate(user?.updatedAt)}</p>
            </div>
          </div>
        </article>

        <aside className="app-card p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-text-primary">Profile Health</h3>
          <p className="mt-1 text-sm text-text-muted">Complete and current profile details improve approvals and reporting quality.</p>

          <ul className="mt-4 space-y-3 text-sm text-text-secondary">
            <li className="rounded-xl border border-dark-border bg-dark-card2 px-3 py-2">
              Name: {form.fullName.trim() ? 'Complete' : 'Missing'}
            </li>
            <li className="rounded-xl border border-dark-border bg-dark-card2 px-3 py-2">
              Position: {form.position.trim() ? 'Complete' : 'Recommended'}
            </li>
            <li className="rounded-xl border border-dark-border bg-dark-card2 px-3 py-2">
              Account status: {user?.isActive ? 'Active' : 'Inactive'}
            </li>
          </ul>
        </aside>
      </div>

      <div className="app-card max-w-3xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-text-primary">Edit Personal Details</h2>
        <p className="mt-1 text-sm text-text-muted">Update your name and position. Email and role are managed by administrators.</p>

        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Full Name</label>
            <input
              className="form-input"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Email</label>
            <input className="form-input cursor-not-allowed opacity-80" type="email" value={user?.email || ''} disabled />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Role</label>
            <input className="form-input cursor-not-allowed opacity-80 capitalize" value={user?.role || 'employee'} disabled />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Position</label>
            <input
              className="form-input"
              value={form.position}
              onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
              placeholder="e.g. Senior Engineer"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Profile;
