import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Button } from '@/components/ui/Button';
import { CheckCircle } from 'lucide-react';

export function SubmissionSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Container><Section>
      <div className="max-w-md mx-auto text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <CheckCircle size={64} className="mx-auto text-emerald-400 mb-4" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Submission Uploaded</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">Your submission is now visible to all participants. Vote count starts at 0.</p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(`/challenges/${id}/voting`)}>View All Submissions and Vote</Button>
          <Button variant="secondary" onClick={() => navigate(`/challenges/${id}`)}>Back to Challenge</Button>
        </div>
      </div>
    </Section></Container>
  );
}
