const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:malikawais@1234@db.tinezqpfqmekcdpwihnb.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  // 1. Check constraint
  const res1 = await client.query(`
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'challenges'::regclass AND contype = 'f';
  `);
  console.log('Constraints on challenges:', res1.rows);

  // 2. Fix RLS
  await client.query(`
    DROP POLICY IF EXISTS "challenges_select" ON challenges;
    DROP POLICY IF EXISTS "Anyone can read challenges" ON challenges;
    CREATE POLICY "public_read_challenges" ON challenges FOR SELECT USING (is_deleted = false);
    
    DROP POLICY IF EXISTS "profiles_select" ON profiles;
    DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
    CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "challenge_rules_select" ON challenge_rules;
    CREATE POLICY "public_read_challenge_rules" ON challenge_rules FOR SELECT USING (true);
  `);
  console.log('RLS policies updated.');

  // 3. Create trigger
  await client.query(`
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, name, role, points, wins, challenges_count, avatar_url, dorocoin_balance, is_banned)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'free',
        0, 0, 0, null, 0, false
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  `);
  console.log('Trigger updated.');

  // 4. Backfill existing users
  await client.query(`
    INSERT INTO public.profiles (id, name, role, points, wins, challenges_count, avatar_url, dorocoin_balance, is_banned)
    SELECT
      id,
      COALESCE(raw_user_meta_data->>'name', email),
      'free', 0, 0, 0, null, 0, false
    FROM auth.users
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('Existing users backfilled.');

  await client.end();
}

run().catch(console.error);
