import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { extractErrorMessage, unwrapData } from '../utils/apiResponse';

const EMPTY_FORM = {
  employeeId: '',
  fullName: '',
  email: '',
  role: 'employee',
  departmentId: '',
  position: '',
  password: 'password123',
};

function roleBadgeClass(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') {
    return 'bg-[#1665342f] text-[#4ade80]';
  }
  if (normalized === 'manager') {
    return 'bg-[#1d4ed82f] text-[#93c5fd]';
  }
  return 'bg-[#3341554a] text-[#cbd5e1]';
}

function formatJoinDate(rawDate) {
  if (!rawDate) {
    return '-';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleDateString();
}

function EmployeeModal({
  open,
  mode,
  form,
  onClose,
  onChange,
  onSubmit,
  submitting,
  departments,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
      <div className="app-card w-full max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {mode === 'create' ? 'Add employee' : 'Edit employee'}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {mode === 'create'
            ? 'Create a new account and assign role and department.'
            : 'Update employee profile details and permissions.'}
        </p>

        <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-text-muted" htmlFor="employeeId">
              Employee ID
            </label>
            <input
              id="employeeId"
              className="form-input mt-1"
              value={form.employeeId}
              onChange={(event) => onChange('employeeId', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-text-muted" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              className="form-input mt-1"
              value={form.fullName}
              onChange={(event) => onChange('fullName', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-text-muted" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="form-input mt-1"
              type="email"
              value={form.email}
              onChange={(event) => onChange('email', event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-text-muted" htmlFor="position">
              Position
            </label>
            <input
              id="position"
              className="form-input mt-1"
              value={form.position}
              onChange={(event) => onChange('position', event.target.value)}
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              className="form-input mt-1"
              value={form.role}
              onChange={(event) => onChange('role', event.target.value)}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-text-muted" htmlFor="departmentId">
              Department
            </label>
            <select
              id="departmentId"
              className="form-input mt-1"
              value={form.departmentId}
              onChange={(event) => onChange('departmentId', event.target.value)}
            >
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {mode === 'create' && (
            <div className="sm:col-span-2">
              <label className="text-sm text-text-muted" htmlFor="password">
                Temporary Password
              </label>
              <input
                id="password"
                className="form-input mt-1"
                value={form.password}
                onChange={(event) => onChange('password', event.target.value)}
                minLength={6}
                required
              />
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'create' ? 'Create Employee' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningUserId, setActioningUserId] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const isAdmin = user?.role === 'admin';

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResponse, departmentsResponse] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
      ]);
      setEmployees(unwrapData(usersResponse) || []);
      setDepartments(unwrapData(departmentsResponse) || []);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load employees'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const activeCount = useMemo(
    () => employees.filter((employee) => employee.isActive).length,
    [employees]
  );

  const departmentMap = useMemo(
    () =>
      departments.reduce((acc, department) => {
        acc[department.id] = department.name;
        return acc;
      }, {}),
    [departments]
  );

  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateModal = () => {
    setForm({
      ...EMPTY_FORM,
      employeeId: `EMP${String(Date.now()).slice(-6)}`,
    });
    setCreateModalOpen(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setForm({
      ...EMPTY_FORM,
      employeeId: employee.employeeId || '',
      fullName: employee.fullName || '',
      email: employee.email || '',
      role: employee.role || 'employee',
      departmentId: employee.departmentId ? String(employee.departmentId) : '',
      position: employee.position || '',
    });
  };

  const closeModals = () => {
    setCreateModalOpen(false);
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/auth/register', {
        employeeId: form.employeeId,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        position: form.position || undefined,
      });
      toast.success('Employee account created');
      closeModals();
      await loadEmployees();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create employee'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingEmployee) {
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/users/${editingEmployee.id}`, {
        employeeId: form.employeeId,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        position: form.position || '',
      });
      toast.success('Employee updated');
      closeModals();
      await loadEmployees();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update employee'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmployeeActiveState = async (employee) => {
    const id = employee?.id;
    if (!id) {
      return;
    }

    if (employee.isActive && id === user?.id) {
      toast.error('You cannot deactivate your own account while signed in');
      return;
    }

    const nextActiveState = !employee.isActive;
    setActioningUserId(id);

    try {
      if (nextActiveState) {
        await api.put(`/users/${id}`, { isActive: true });
      } else {
        await api.delete(`/users/${id}/deactivate`);
      }

      setEmployees((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isActive: nextActiveState } : item))
      );
      toast.success(nextActiveState ? 'Employee activated' : 'Employee deactivated');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update employee status'));
    } finally {
      setActioningUserId('');
    }
  };

  if (loading) {
    return <section className="grid min-h-[40vh] place-items-center text-slate-500">Loading employees...</section>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">Employees</h1>
        <p className="page-subtitle">Manage your organization users and account states.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="app-card p-4">
          <p className="text-sm text-slate-500">Total Employees</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{employees.length}</p>
        </div>
        <div className="app-card p-4">
          <p className="text-sm text-slate-500">Active Employees</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{activeCount}</p>
        </div>
      </div>

      <div className="app-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Employee Directory</h2>
            <p className="text-sm text-text-muted">Edit member profile fields and keep the org chart up to date.</p>
          </div>
          {isAdmin && (
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="app-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={8}>
                  No employees found.
                </td>
              </tr>
            )}
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium text-slate-800">{employee.employeeId || '-'}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{employee.fullName}</p>
                  <p className="text-xs text-text-muted">{employee.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${roleBadgeClass(employee.role)}`}>
                    {employee.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{departmentMap[employee.departmentId] || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{employee.position || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{formatJoinDate(employee.createdAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      employee.isActive
                        ? 'bg-[#16a34a18] text-[#4ade80]'
                        : 'bg-[#2a2a2a] text-[#6b7280]'
                    }`}
                  >
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => openEditModal(employee)}
                      disabled={actioningUserId === employee.id}
                    >
                      Edit
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => toggleEmployeeActiveState(employee)}
                        disabled={actioningUserId === employee.id}
                      >
                        {actioningUserId === employee.id
                          ? 'Updating...'
                          : employee.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmployeeModal
        open={createModalOpen}
        mode="create"
        form={form}
        onClose={closeModals}
        onChange={updateFormField}
        onSubmit={handleCreateSubmit}
        submitting={submitting}
        departments={departments}
      />

      <EmployeeModal
        open={Boolean(editingEmployee)}
        mode="edit"
        form={form}
        onClose={closeModals}
        onChange={updateFormField}
        onSubmit={handleEditSubmit}
        submitting={submitting}
        departments={departments}
      />
    </section>
  );
}

export default Employees;
