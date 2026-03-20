import { useAuth } from '../context/AuthContext';

function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-dark-border bg-dark-sidebar px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-dark-border2 px-2 py-1 text-text-secondary lg:hidden"
          onClick={onMenuClick}
        >
          Menu
        </button>
        <div>
          <p className="text-sm text-text-muted">Welcome</p>
          <p className="text-base font-semibold text-text-primary">{user?.fullName || 'Team Member'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-dark-border2 bg-dark-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted sm:inline-flex">
          {user?.role || 'employee'}
        </span>
        <button type="button" onClick={logout} className="btn-secondary">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
