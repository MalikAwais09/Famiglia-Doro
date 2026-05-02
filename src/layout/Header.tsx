import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useWallet } from '@/context/WalletContext';
import { useNotifications } from '@/context/NotificationContext';
import { WalletDropdown } from '@/components/wallet/WalletDropdown';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils/dateUtils';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { profile } = useAuth();
  const userName = profile?.name;
  const { role, isCreator, isElite } = useRole();
  const { balance } = useWallet();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 bg-[#0E0E0F]/80 backdrop-blur-sm border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden text-[#9CA3AF] hover:text-white"><Menu size={20} /></button>
        <div className="hidden sm:flex items-center gap-2 bg-[#161618] rounded-md px-3 h-9">
          <Search size={16} className="text-[#6B7280]" />
          <input placeholder="Search..." className="bg-transparent text-sm text-white placeholder:text-[#6B7280] outline-none w-40 lg:w-64" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {(isCreator || isElite) && (
          <Badge variant="gold" className="hidden sm:inline-flex">
            {role === 'creatorPro' ? 'Creator Pro' : 'Elite Host'}
          </Badge>
        )}
        <WalletDropdown balance={balance} />
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative text-[#9CA3AF] hover:text-white transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />}
          </button>
          {notifOpen && <NotificationsDropdown onClose={() => setNotifOpen(false)} />}
        </div>
        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(!profileOpen)} className="w-8 h-8 rounded-full gold-border overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="" className="w-full h-full" />
          </button>
          {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
        </div>
      </div>
    </header>
  );
}

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  return (
    <div className="absolute right-0 top-10 w-80 bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
        <span className="text-sm font-semibold">Notifications</span>
        <button
          onClick={() => {
            void markAllAsRead().then(() => onClose());
          }}
          className="text-xs text-yellow-500 hover:underline"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {notifications.slice(0, 5).map(n => (
          <button
            key={n.id}
            onClick={() => {
              void markAsRead(n.id).then(() => onClose());
            }}
            className={`w-full text-left px-4 py-3 border-b border-[rgba(255,255,255,0.05)] hover:bg-[#222225] transition-colors ${!n.read ? 'bg-[#161618]' : ''}`}
          >
            <p className="text-sm font-medium">{n.title}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{n.message}</p>
            {n.createdAt && (
              <p className="text-[10px] text-[#6B7280] mt-1">{formatRelativeTime(n.createdAt)}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { profile, signOut } = useAuth();
  const userName = profile?.name;
  const navigate = (path: string) => { onClose(); window.location.href = path; };
  return (
    <div className="absolute right-0 top-10 w-48 bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-xl z-50">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
        <p className="text-sm font-medium truncate">{userName || 'User'}</p>
      </div>
      <button onClick={() => navigate('/settings')} className="w-full text-left px-4 py-2 text-sm text-[#9CA3AF] hover:text-white hover:bg-[#222225] transition-colors">Settings</button>
      <button onClick={() => { onClose(); signOut(); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#222225] transition-colors">Sign Out</button>
    </div>
  );
}
