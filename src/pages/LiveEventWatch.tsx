import { useParams } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_LIVE_EVENTS } from '@/lib/mock/data';
import { getStorage } from '@/lib/storage';
import { Bell, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function LiveEventWatch() {
  const { id } = useParams();
  const event = MOCK_LIVE_EVENTS.find(e => e.id === id);
  const [hasReminder, setHasReminder] = useState(() => {
    const r = getStorage<Record<string, string>>('reminders', {});
    return !!r[id || ''];
  });

  if (!event) return <Container><Section><p className="text-center text-[#9CA3AF] py-8">Event not found</p></Section></Container>;

  const handleReminder = () => {
    const r = getStorage<Record<string, string>>('reminders', {});
    r[event.id] = event.startTime;
    localStorage.setItem('fdoro_reminders', JSON.stringify(r));
    setHasReminder(true);
    toast.success(`Reminder set for ${event.title}`);
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    window.open(calUrl, '_blank');
  };

  return (
    <Container><Section>
      <div className="max-w-4xl mx-auto">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
          <iframe src={event.videoUrl} title={event.title} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {event.status === 'live' && <Badge variant="error">LIVE</Badge>}
              <Badge>{event.category}</Badge>
            </div>
            <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
            <p className="text-sm text-[#9CA3AF]">{event.description}</p>
            <p className="text-xs text-[#6B7280] mt-2">Hosted by {event.hostName}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }}>
              <Share2 size={14} />
            </Button>
            <Button variant={hasReminder ? 'secondary' : 'primary'} onClick={handleReminder} disabled={hasReminder}>
              <Bell size={14} /> {hasReminder ? 'Reminder Set' : 'Set Reminder'}
            </Button>
          </div>
        </div>
      </div>
    </Section></Container>
  );
}
