import { useLocation, useNavigate } from 'react-router-dom';
import { X, LayoutDashboard, Rss, Swords, Radio, Trophy, Crown, Medal, ClipboardList, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Rss, label: 'Feed', path: '/feed' },
  { icon: Swords, label: 'Challenges', path: '/challenges' },
  { icon: Radio, label: 'Live Events', path: '/live-events' },
  { icon: Trophy, label: 'Leaderboards', path: '/leaderboards' },
  { icon: Crown, label: 'Tournaments', path: '/tournaments' },
  { icon: Medal, label: 'Winners', path: '/winners' },
  { icon: ClipboardList, label: 'My Entries', path: '/my-entries' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, signOut } = useAuth();
  const { isCreator } = useRole();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-64 bg-[#0E0E0F] border-r border-[rgba(255,255,255,0.08)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/drefcs4o2/image/upload/v1775267495/logo-gold_chstxw.jpg" alt="Logo" className="w-8 h-8 rounded-full border border-yellow-600" />
            <span className="text-sm font-bold gold-text">Famiglia D'Oro</span>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF]"><X size={20} /></button>
        </div>
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); onClose(); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  active ? 'bg-yellow-600/10 text-yellow-500' : 'text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.03)]'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
          {!isCreator && (
            <button onClick={() => { navigate('/pricing'); onClose(); }} className="w-full gold-gradient text-black text-xs font-semibold h-9 rounded-md flex items-center justify-center gap-1">
              <Crown size={14} /> Upgrade to Premium
            </button>
          )}
          <div className="flex items-center gap-2">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="" className="w-8 h-8 rounded-full" />
            <span className="text-sm flex-1 truncate">{userName || 'User'}</span>
            <button onClick={() => { signOut(); onClose(); }} className="text-xs text-red-400">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
