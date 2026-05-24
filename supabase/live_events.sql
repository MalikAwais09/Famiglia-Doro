-- Create live_events table
CREATE TABLE IF NOT EXISTS public.live_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

-- Policies for live_events
-- Anyone can read live_events
CREATE POLICY "Anyone can view live events" ON public.live_events FOR SELECT USING (true);

-- Only authenticated premium users can insert
CREATE POLICY "Premium users can create live events" ON public.live_events 
    FOR INSERT 
    WITH CHECK (
        auth.uid() = host_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('creatorPro', 'eliteHost', 'admin')
        )
    );

-- Only host can update their events
CREATE POLICY "Host can update their own live events" ON public.live_events 
    FOR UPDATE 
    USING (auth.uid() = host_id);
