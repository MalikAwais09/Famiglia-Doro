import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Users, Trophy, Activity, Heart, Coins, FileText, ShieldCheck, RefreshCcw } from 'lucide-react';
import { getDashboardStats } from '@/lib/supabase/admin';

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-[#9CA3AF]">{label}</p>
          {loading ? (
            <div className="h-7 w-24 rounded bg-[#161618] animate-pulse" />
          ) : (
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#161618] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-yellow-500">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const s = await getDashboardStats();
      setStats(s);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const minutesAgo = useMemo(() => {
    if (!lastUpdated) return null;
    const diff = Math.max(0, Date.now() - lastUpdated.getTime());
    return Math.floor(diff / 60000);
  }, [lastUpdated]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-xs text-[#6B7280]">
            {lastUpdated
              ? `Last updated: ${minutesAgo === 0 ? 'just now' : `${minutesAgo} min ago`}`
              : '—'}
          </p>
        </div>
        <Button variant="secondary" onClick={load} loading={loading} icon={<RefreshCcw size={14} />}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />} label="Total Users" value={stats?.totalUsers ?? 0} loading={loading} />
        <StatCard icon={<Trophy size={18} />} label="Total Challenges" value={stats?.totalChallenges ?? 0} loading={loading} />
        <StatCard icon={<Activity size={18} />} label="Active Challenges" value={stats?.activeChallenges ?? 0} loading={loading} />
        <StatCard icon={<Heart size={18} />} label="Total Votes" value={stats?.totalVotes ?? 0} loading={loading} />

        <StatCard icon={<Users size={18} />} label="New Users Today" value={stats?.newUsersToday ?? 0} loading={loading} />
        <StatCard icon={<Coins size={18} />} label="DoroCoins Circulated" value={stats?.totalDorocoinsCirculated ?? 0} loading={loading} />
        <StatCard icon={<FileText size={18} />} label="Total Submissions" value={stats?.totalSubmissions ?? 0} loading={loading} />
        <StatCard icon={<ShieldCheck size={18} />} label="Agreements Logged" value={stats?.totalAgreementsLogged ?? 0} loading={loading} />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <Loader2 className="animate-spin" size={14} /> Fetching latest stats…
        </div>
      )}
    </div>
  );
}

