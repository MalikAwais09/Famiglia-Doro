import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MOCK_CHALLENGES } from '@/lib/mock/data';
import { getStorage } from '@/lib/storage';
import type { Challenge } from '@/types';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { ChallengeCreatorAgreement } from '@/components/agreements/ChallengeCreatorAgreement';
import { toast } from 'sonner';

export function ChallengeSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const allChallenges: Challenge[] = [...MOCK_CHALLENGES, ...getStorage<Challenge[]>('challenges', [])];
  const challenge = allChallenges.find(c => c.id === id);
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <Container><Section>
      <div className="max-w-md mx-auto text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <CheckCircle size={64} className="mx-auto text-emerald-400 mb-4" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Challenge Created</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">{challenge?.title || 'Your challenge has been created successfully.'}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => setPublishOpen(true)}>Publish Challenge</Button>
          <Button variant="secondary" onClick={() => navigate('/challenges')}>View All Challenges</Button>
        </div>
      </div>
      <ChallengeCreatorAgreement
        isOpen={publishOpen}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() => {
          toast.success('Challenge published');
          setPublishOpen(false);
          navigate(`/challenges/${id}`);
        }}
      />
    </Section></Container>
  );
}
