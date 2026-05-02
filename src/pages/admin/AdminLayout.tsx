import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Menu, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

const LINKS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/challenges', label: 'Challenges' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/agreements', label: 'Agreements' },
  { to: '/admin/fraud', label: 'Fraud Flags' },
];

export function AdminLayout() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      toast.error('Access denied');
      navigate('/', { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const sidebarUser = useMemo(() => {
    if (!profile) return null;
    return {
      name: profile.name || 'Admin',
      avatar:
        profile.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white">
      <div className="lg:hidden sticky top-0 z-30 bg-[#0E0E0F]/90 backdrop-blur border-b border-[rgba(255,255,255,0.08)] px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setOpen((s) => !s)}
          className="text-[#9CA3AF] hover:text-white"
        >
          <Menu size={20} />
        </button>
        <p className="text-sm font-semibold">Admin Panel</p>
        <Link to="/feed" className="text-[#9CA3AF] hover:text-white">
          <ArrowLeft size={18} />
        </Link>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#111113] border-r border-[rgba(255,255,255,0.08)] flex flex-col',
            'transform transition-transform duration-200',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="px-4 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 text-sm text-yellow-500 hover:underline"
            >
              <ArrowLeft size={16} /> Back to App
            </Link>
            <div className="mt-3">
              <p className="text-lg font-bold">Admin Panel</p>
              <p className="text-xs text-[#6B7280]">Manage Famiglia D&apos;Oro</p>
            </div>
          </div>

          <nav className="p-3 space-y-1 flex-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-2 rounded-md text-sm transition-colors border',
                    isActive
                      ? 'gold-gradient text-black font-semibold border-transparent'
                      : 'border-transparent text-[#9CA3AF] hover:text-white hover:bg-[#1C1C1F]'
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {sidebarUser && (
            <div className="p-4 border-t border-[rgba(255,255,255,0.08)] flex items-center gap-3">
              <img
                src={sidebarUser.avatar}
                alt=""
                className="w-9 h-9 rounded-full bg-[#161618] border border-[rgba(255,255,255,0.08)]"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{sidebarUser.name}</p>
                <p className="text-[10px] text-[#6B7280]">admin</p>
              </div>
            </div>
          )}
        </aside>

        {/* Backdrop for mobile */}
        {open && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 lg:ml-0 px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

