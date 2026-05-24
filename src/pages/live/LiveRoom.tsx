import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, ControlBar, useRoomContext } from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { LiveChat } from '@/components/live/LiveChat';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface LiveRoomProps {
  roomId: string;
  isHost: boolean;
}

// Custom button inside LiveKit context to disconnect
function CustomLeaveButton({ isHost, roomId }: { isHost: boolean; roomId: string }) {
  const room = useRoomContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    if (isHost) {
      const confirmEnd = window.confirm('Are you sure you want to end this live event? This action cannot be undone.');
      if (!confirmEnd) return;

      setLoading(true);
      try {
        await supabase
          .from('live_events')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', roomId);
        
        room.disconnect();
        toast.success('Live event ended');
        navigate('/live-events');
      } catch (err) {
        console.error(err);
        toast.error('Failed to end event');
        setLoading(false);
      }
    } else {
      room.disconnect();
      navigate('/live-events');
    }
  };

  return (
    <Button 
      variant={isHost ? 'error' : 'secondary'} 
      onClick={handleLeave} 
      loading={loading}
      className="absolute top-4 right-4 z-50 shadow-lg"
    >
      <LogOut size={16} className="mr-2" />
      {isHost ? 'End Live Event' : 'Leave Event'}
    </Button>
  );
}

export function LiveRoom({ roomId, isHost }: LiveRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

  useEffect(() => {
    if (!session) return;
    
    const fetchToken = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('livekit-token', {
          body: { roomName: roomId, isHost },
        });

        if (fnError) throw fnError;
        setToken(data.token);
      } catch (err: any) {
        console.error('Failed to get token:', err);
        setError(err.message || 'Failed to connect to live room');
      }
    };

    fetchToken();
  }, [roomId, isHost, session]);

  if (error) {
    return <div className="text-red-500 text-center p-8 bg-[#161618] rounded-xl">{error}</div>;
  }

  if (!token) {
    return <div className="text-[#9CA3AF] text-center p-8">Connecting to live stream...</div>;
  }

  return (
    <div className="relative w-full h-[80vh] bg-black rounded-xl overflow-hidden shadow-2xl flex border border-[rgba(255,255,255,0.1)]">
      {/* Video Area (Left) */}
      <div className="flex-1 relative">
        <LiveKitRoom
          video={isHost}
          audio={isHost}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
          <CustomLeaveButton isHost={isHost} roomId={roomId} />
          {isHost && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
              <ControlBar />
            </div>
          )}
        </LiveKitRoom>
      </div>

      {/* Chat Area (Right) */}
      <div className="w-80 border-l border-[rgba(255,255,255,0.1)] bg-[#0E0E0F] flex flex-col relative z-40">
        <LiveChat roomId={roomId} />
      </div>
    </div>
  );
}
