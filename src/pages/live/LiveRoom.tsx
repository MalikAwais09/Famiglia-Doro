import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer, ControlBar, useRoomContext, useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
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

// Custom component to only render the host's video/screen
function HostVideo() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Find the screen share or camera track
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const trackToDisplay = screenTrack || cameraTrack;

  if (!trackToDisplay) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-[#9CA3AF]">
        Waiting for host video...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
      <VideoTrack 
        trackRef={trackToDisplay} 
        className="w-full h-full object-contain" 
      />
    </div>
  );
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
          .update({ status: 'ended' })
          .eq('id', roomId);
        
        // Broadcast instant end signal to all participants
        await supabase.channel(`live_room_control:${roomId}`).send({
          type: 'broadcast',
          event: 'room_ended',
          payload: {}
        });
        
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
  const navigate = useNavigate();
  
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://famiglia-doro-z5smjwx1.livekit.cloud';

  // Listen for host ending the room instantly
  useEffect(() => {
    const channel = supabase.channel(`live_room_control:${roomId}`);
    
    channel
      .on('broadcast', { event: 'room_ended' }, () => {
        if (!isHost) {
          toast('The host has ended the live event.', { icon: '👋' });
          navigate('/live-events');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost, navigate]);

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
    <div className="relative w-full h-[85vh] md:h-[80vh] flex flex-col md:flex-row bg-black md:rounded-xl overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.1)]">
      {/* Video Area */}
      <div className="flex-1 relative min-h-[40vh] md:min-h-0 bg-black">
        <LiveKitRoom
          video={isHost}
          audio={isHost}
          token={token}
          serverUrl={serverUrl}
          connect={true}
          data-lk-theme="default"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <HostVideo />
          <RoomAudioRenderer />
          <CustomLeaveButton isHost={isHost} roomId={roomId} />
          {isHost && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
              <ControlBar />
            </div>
          )}
        </LiveKitRoom>
      </div>

      {/* Chat Area */}
      <div className="w-full h-[45vh] md:h-auto md:w-80 border-t md:border-t-0 md:border-l border-[rgba(255,255,255,0.1)] bg-[#0E0E0F] flex flex-col relative z-40">
        <LiveChat roomId={roomId} />
      </div>
    </div>
  );
}
