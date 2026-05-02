import { useParams } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getLiveEventById, subscribeToLiveEvent } from '@/lib/supabase/liveEvents';
import type { LiveEventWithCreator } from '@/lib/supabase/liveEvents';
import { getStorage } from '@/lib/storage';
import { Bell, Share2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export function LiveEventWatch() {
  const { id } = useParams();
  const [event, setEvent] = useState<LiveEventWithCreator | null | undefined>(undefined);
  const [hasReminder, setHasReminder] = useState(() => {
    const r = getStorage<Record<string, string>>('reminders', {});
    return !!r[id || ''];
  });

  const load = useCallback(async () => {
    if (!id) {
      setEvent(null);
      return;
    }
    try {
      const ev = await getLiveEventById(id);
      setEvent(ev);
    } catch {
      setEvent(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!id) return;

    const channel = subscribeToLiveEvent(id, () => {
      load();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  if (event === undefined) {
    return (
      <Container>
        <Section>
          <p className="text-center text-[#9CA3AF] py-8">Loading…</p>
        </Section>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container>
        <Section>
          <p className="text-center text-[#9CA3AF] py-8">Event not found</p>
        </Section>
      </Container>
    );
  }

  const videoSrc =
    event.status === 'live' && event.stream_url ? event.stream_url : '';
  const categoryLabel = '';
  const hostName = event.creator?.name ?? 'Host';
  const startTime = event.starts_at ?? new Date().toISOString();
  const endTime = new Date(new Date(startTime).getTime() + 2 * 3600000).toISOString();

  const handleReminder = () => {
    const r = getStorage<Record<string, string>>('reminders', {});
    r[event.id] = startTime;
    localStorage.setItem('fdoro_reminders', JSON.stringify(r));
    setHasReminder(true);
    toast.success(`Reminder set for ${event.title}`);
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${new Date(startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    window.open(calUrl, '_blank');
  };

  return (
    <Container>
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            {videoSrc ? (
              <iframe
                src={videoSrc}
                title={event.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-[#6B7280]">
                {event.status === 'live' ? 'Stream unavailable' : 'Stream opens when the event is live'}
              </div>
            )}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {event.status === 'live' && <Badge variant="error">LIVE</Badge>}
                {categoryLabel ? <Badge>{categoryLabel}</Badge> : null}
              </div>
              <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
              <p className="text-sm text-[#9CA3AF]">{event.description}</p>
              <p className="text-xs text-[#6B7280] mt-2">Hosted by {hostName}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied');
                }}
              >
                <Share2 size={14} />
              </Button>
              <Button variant={hasReminder ? 'secondary' : 'primary'} onClick={handleReminder} disabled={hasReminder}>
                <Bell size={14} /> {hasReminder ? 'Reminder Set' : 'Set Reminder'}
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </Container>
  );
}
