import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/apiResponse';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: 'admin@company.com', password: 'Admin@123' });
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-dark-base via-dark-sidebar to-dark-base px-4">
      <div className="w-full max-w-md app-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-text-primary">Sign in</h1>
        <p className="mt-2 text-sm text-text-muted">Use your work account to continue.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-secondary">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="form-input"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-secondary">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-xs text-text-muted">
          Demo users: admin@company.com / Admin@123, manager@company.com / Manager@123, employee@company.com / Employee@123.
        </p>
      </div>
    </div>
  );
}

export default Login;
