import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_LIVE_EVENTS } from '@/lib/mock/data';
import { useRole } from '@/context/RoleContext';
import { getTimeUntil } from '@/lib/utils';
import { Eye, Lock, Bell } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getStorage } from '@/lib/storage';

export function LiveEvents() {
  const navigate = useNavigate();
  const { isElite } = useRole();
  const events = MOCK_LIVE_EVENTS;

  return (
    <Container><Section>
      <PageHeader title="Live Events" subtitle="Watch live competitions and events" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(ev => {
          const locked = ev.isPremiumOnly && !isElite;
          const reminders = getStorage<Record<string, string>>('reminders', {});
          const hasReminder = !!reminders[ev.id];

          return (
            <Card key={ev.id} className="overflow-hidden p-0">
              <div className="relative">
                <img src={ev.thumbnail} alt="" className="w-full h-40 object-cover" loading="lazy" />
                {ev.status === 'live' && <Badge variant="error" className="absolute top-2 left-2">LIVE</Badge>}
                {locked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Lock size={32} className="text-[#9CA3AF]" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-[#9CA3AF] mb-1">{ev.category}</p>
                <p className="font-semibold mb-1">{ev.title}</p>
                <p className="text-xs text-[#9CA3AF] line-clamp-2 mb-3">{ev.description}</p>
                <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mb-3">
                  <span>{getTimeUntil(ev.startTime)}</span>
                  {ev.viewerCount > 0 && <span className="flex items-center gap-1"><Eye size={12} />{ev.viewerCount}</span>}
                </div>
                <div className="flex gap-2">
                  <Button fullWidth onClick={() => locked ? navigate('/pricing') : navigate(`/live-events/${ev.id}/watch`)}>
                    {locked ? 'Upgrade to Watch' : 'Watch Now'}
                  </Button>
                  {ev.status === 'upcoming' && (
                    <Button variant="secondary" onClick={() => {
                      if (!hasReminder) {
                        const r = getStorage<Record<string, string>>('reminders', {});
                        r[ev.id] = ev.startTime;
                        localStorage.setItem('fdoro_reminders', JSON.stringify(r));
                        toast.success(`Reminder set for ${ev.title}`);
                        const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${new Date(ev.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(ev.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
                        window.open(calUrl, '_blank');
                      }
                    }} disabled={hasReminder}>
                      <Bell size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section></Container>
  );
}
