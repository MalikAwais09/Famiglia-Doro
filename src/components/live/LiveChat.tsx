import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Send } from 'lucide-react';

interface LiveChatProps {
  roomId: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

export function LiveChat({ roomId }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { session, profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const channel = supabase.channel(`live_chat:${roomId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleSend = () => {
    if (!input.trim() || !session || !profile) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      user_name: profile.name || 'Anonymous',
      avatar_url: profile.avatar_url || '',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    // Send via Realtime
    supabase.channel(`live_chat:${roomId}`).send({
      type: 'broadcast',
      event: 'chat_message',
      payload: msg,
    });

    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
        <h3 className="font-semibold text-sm">Live Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="text-xs text-[#6B7280] text-center mt-4">Welcome to the live chat!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              {msg.avatar_url ? (
                <img src={msg.avatar_url} className="w-6 h-6 rounded-full bg-[#27272a]" alt="" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#27272a]" />
              )}
              <div className="flex-1 text-xs">
                <span className="font-medium text-[#9CA3AF] block">{msg.user_name}</span>
                <span className="text-white break-words">{msg.content}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-[rgba(255,255,255,0.08)] bg-[#161618]">
        {session ? (
          <div className="flex gap-2">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Say something..." 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button variant="primary" onClick={handleSend} disabled={!input.trim()}>
              <Send size={16} />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-center text-[#9CA3AF]">Log in to chat</p>
        )}
      </div>
    </div>
  );
}
