const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:malikawais@1234@db.tinezqpfqmekcdpwihnb.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  console.log('Creating comments table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
    CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.comments;
    CREATE POLICY "Authenticated users can post comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  `);
  
  console.log('Comments table and RLS policies created.');
  await client.end();
}

run().catch(console.error);
