import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/layout/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function CreateLiveEvent() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreate = async () => {
    if (!title.trim()) return toast.error('Title is required');
    if (!user) return toast.error('You must be logged in');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_events')
        .insert({
          title: title.trim(),
          created_by: user.id,
          status: 'live',
          starts_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Live event created! Redirecting to studio...');
      navigate(`/live-events/${data.id}/watch`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create live event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Section>
        <PageHeader title="Go Live" subtitle="Start a new live stream broadcast" />
        <div className="max-w-md mx-auto">
          <Card>
            <h2 className="text-xl font-bold mb-4">Live Stream Details</h2>
            <div className="space-y-4">
              <Input 
                label="Stream Title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Q&A Session, Epic Battle..." 
                maxLength={60} 
              />
              <Button loading={loading} onClick={handleCreate} fullWidth>
                Start Broadcast
              </Button>
            </div>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
