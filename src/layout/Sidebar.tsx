import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Rss, Swords, Radio, Trophy, Medal, ClipboardList, Settings as SettingsIcon, Crown, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { cn } from '@/utils/cn';
import { Toggle } from '@/components/ui/Toggle';
import { useState } from 'react';

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

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const userName = profile?.name;
  const { role, isCreator } = useRole();
  const [notifsEnabled, setNotifsEnabled] = useState(() => localStorage.getItem('fdoro_notifications_enabled') !== 'false');

  const handleNotifsToggle = (v: boolean) => {
    setNotifsEnabled(v);
    localStorage.setItem('fdoro_notifications_enabled', String(v));
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[#0E0E0F] border-r border-[rgba(255,255,255,0.08)] h-screen sticky top-0">
      <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <img src="https://res.cloudinary.com/drefcs4o2/image/upload/v1775267495/logo-gold_chstxw.jpg" alt="Logo" className="w-10 h-10 rounded-full border-2 border-yellow-600 object-cover" />
          <div>
            <p className="text-sm font-bold gold-text">Famiglia D'Oro</p>
            <p className="text-xs text-[#9CA3AF]">Challenge Suite</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                active ? 'bg-yellow-600/10 text-yellow-500' : 'text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.03)] hover:text-white'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
        <Toggle checked={notifsEnabled} onChange={handleNotifsToggle} label="Notifications" />
        {!isCreator && (
          <button onClick={() => navigate('/pricing')} className="w-full gold-gradient text-black text-xs font-semibold h-9 rounded-md flex items-center justify-center gap-1">
            <Crown size={14} /> Premium
          </button>
        )}
        <div className="flex items-center gap-2 pt-1">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="" className="w-8 h-8 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{userName || 'User'}</p>
          </div>
          <button onClick={signOut} className="text-[#9CA3AF] hover:text-red-400 transition-colors"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}
