import { NavLink } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const commonLinks = [
  { to: '/my-leaves', label: 'My Leaves' },
  { to: '/apply-leave', label: 'Apply Leave' },
  { to: '/profile', label: 'Profile' },
];

const managementLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/employees', label: 'Employees' },
  { to: '/leave-requests', label: 'Leave Requests' },
];

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const isManagement = user?.role === 'admin' || user?.role === 'manager';
  const links = isManagement ? [...commonLinks, ...managementLinks] : commonLinks;

  return (
    <>
      {isOpen && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-dark-border bg-dark-sidebar p-4 transition lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 rounded-xl border border-dark-border2 bg-dark-card p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-text-muted">Leave Management</p>
          <p className="mt-2 text-lg font-semibold">ABC Company</p>
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary/15 text-text-green ring-1 ring-primary/30'
                    : 'text-text-muted hover:bg-dark-card2 hover:text-text-secondary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
