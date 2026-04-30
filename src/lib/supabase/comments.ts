import { supabase } from './client';

export interface Comment {
  id: string;
  challenge_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url: string | null;
  };
}

export async function getComments(challengeId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:profiles (
        name,
        avatar_url
      )
    `)
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Comment[];
}

export async function postComment(challengeId: string, content: string): Promise<Comment> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      challenge_id: challengeId,
      user_id: session.user.id,
      content
    })
    .select(`
      *,
      user:profiles (
        name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;
  return data as Comment;
}
