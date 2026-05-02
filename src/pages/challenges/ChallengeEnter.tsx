import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useWallet } from '@/context/WalletContext';
import { AgreementModal } from '@/components/agreements/AgreementModal';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { getChallengeById } from '@/lib/supabase/challenges';
import { enterChallenge, getMyEntry } from '@/lib/supabase/entries';
import { supabase } from '@/lib/supabase/client';
import type { Challenge } from '@/lib/supabase/types';

export function ChallengeEnter() {
  const params = useParams();
  const navigate = useNavigate();
  const challengeId = params.id || '';
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const { balance, refreshBalance } = useWallet();
  const [termsOpen, setTermsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'dorocoin' | 'card' | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setPageLoading(true);
      try {
        const data = await getChallengeById(challengeId);
        if (!data) {
          toast.error('Challenge not found');
          navigate('/challenges');
          return;
        }

        // Timing check
        const now = new Date();
        const deadline = data.registration_deadline ? new Date(data.registration_deadline) : null;
        if (deadline && now > deadline) {
          toast.error('Registration for this challenge has closed');
          navigate(`/challenges/${challengeId}`);
          return;
        }

        setChallenge(data);

        const entry = await getMyEntry(challengeId);
        setHasEntered(!!entry);
      } catch (err) {
        console.error('Error in ChallengeEnter load:', err);
        toast.error('Failed to load challenge details');
      } finally {
        setPageLoading(false);
      }
    }
    if (challengeId) {
      console.log('ChallengeEnter: loading data for', challengeId);
      load();
    }
  }, [challengeId, navigate]);

  if (pageLoading) return <Container><Section><p className="text-center text-[#9CA3AF] py-8">Loading...</p></Section></Container>;
  if (!challenge) return <Container><Section><p className="text-center text-[#9CA3AF] py-8">Challenge not found</p></Section></Container>;

  const isFree = challenge?.prize_type === 'bragging_rights' || challenge?.entry_fee === 0;
  const totalPool = challenge ? challenge.entry_fee * (challenge.current_participants || 0) : 0;

  if (hasEntered) {
    return (
      <Container><Section>
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">Already Entered</h1>
          <p className="text-[#9CA3AF] mb-6">You have already entered this challenge.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => navigate(`/challenges/${challengeId}`)}>View Challenge</Button>
            <Button onClick={() => navigate('/my-entries')}>My Entries</Button>
          </div>
        </div>
      </Section></Container>
    );
  }

  const handleFreeEntry = async () => {
    setLoading(true);
    try {
      const entry = await enterChallenge(challengeId);
      console.log('Entry successful:', entry);
      toast.success('Successfully entered challenge!');
      
      navigate(`/challenges/${challengeId}/entry-success`, { 
        state: { 
          entry: {
            id: entry.id,
            challengeTitle: challenge?.title,
            entryFee: challenge?.entry_fee,
            enteredAt: entry.created_at
          },
          paymentMethod: isFree ? 'free' : 'dorocoin'
        }
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to enter challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleDoroCoinPay = async () => {
    setLoading(true);
    try {
      const entry = await enterChallenge(challengeId);
      await refreshBalance(); // update global balance state
      toast.success('Entry submitted successfully');
      navigate(`/challenges/${challengeId}/entry-success`, { state: { entry, paymentMethod: 'dorocoin', breakdown: { winner: challenge.entry_fee * 0.5, creator: challenge.entry_fee * 0.35, platform: challenge.entry_fee * 0.15 } } });
    } catch (err: any) {
      if (err.required) {
        toast.error(`Insufficient DoroCoins. You need ${err.required} DC, but you only have ${err.balance} DC.`);
      } else {
        toast.error(err.message || 'Failed to enter challenge');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCardPay = () => {
    // Card payments not yet wired to real stripe in this frontend flow
    setLoading(true);
    setTimeout(() => {
      toast.error('Card payments not enabled yet. Please use DoroCoins.');
      setLoading(false);
    }, 900);
  };

  return (
    <Container><Section>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Enter Challenge</h1>
        <Card className="overflow-hidden p-0">
          <img src={challenge?.cover_image_url || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600'} alt="" className="w-full h-40 object-cover" />
          <div className="p-4">
            <Badge className="mb-2">{challenge?.category}</Badge>
            <h2 className="text-lg font-semibold">{challenge?.title}</h2>
            <p className="text-sm text-[#9CA3AF] mt-1 mb-4">{challenge?.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <span className="text-xs text-[#9CA3AF]">Participants</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Users size={14} /> {challenge?.current_participants ?? 0}{challenge?.max_participants ? `/${challenge.max_participants}` : ''}
              </span>
            </div>
          </div>
        </Card>

        {!isFree && (
          <Card>
            <h3 className="text-sm font-semibold mb-3">Prize Distribution</h3>
            <div className="flex h-3 rounded-full overflow-hidden mb-2">
              <div className="w-[50%] bg-emerald-500" /><div className="w-[35%] bg-yellow-500" /><div className="w-[15%] bg-gray-500" />
            </div>
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Winner 50%</span><span>Creator 35%</span><span>Platform 15%</span>
            </div>
          </Card>
        )}

        <Button 
          fullWidth 
          onClick={() => {
            console.log('Main button clicked. isFree:', isFree);
            if (isFree) handleFreeEntry(); 
            else {
              console.log('Opening terms modal');
              setTermsOpen(true);
            }
          }} 
          loading={loading}
        >
          {isFree ? 'Enter Free Challenge' : `Enter Now (${challenge?.entry_fee ?? 0} DC)`}
        </Button>

        <AgreementModal open={termsOpen} onClose={() => { console.log('Terms closed'); setTermsOpen(false); }} title="Challenge Entry Agreement"
          onAgree={() => { 
            console.log('Terms agreed. isFree:', isFree);
            setTermsOpen(false); 
            if (isFree) handleFreeEntry(); 
            else {
              console.log('Opening payment modal');
              setPaymentOpen(true);
            }
          }}>
          <p className="mb-2">By entering this challenge, you agree to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Comply with all platform rules</li>
            <li>Submit original work</li>
            <li>Accept judging criteria</li>
            <li>Understand submission may be public</li>
            <li>Accept prize distribution terms (50/35/15)</li>
            {!isFree && <li>Entry fee is non-refundable</li>}
          </ul>
        </AgreementModal>

        {/* Payment Modal */}
        {paymentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setPaymentOpen(false)} />
            <div className="relative w-full max-w-sm bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 space-y-4">
              <h3 className="text-base font-semibold">Payment</h3>
              {!payMethod ? (
                <div className="space-y-3">
                  <Button fullWidth onClick={() => setPayMethod('dorocoin')}>Pay with DoroCoin (Balance: {balance})</Button>
                  <Button fullWidth variant="secondary" onClick={() => setPayMethod('card')}>Pay with Card</Button>
                </div>
              ) : payMethod === 'dorocoin' ? (
                <div className="space-y-3">
                  <p className="text-sm">Current balance: <span className="font-bold">{balance} DC</span></p>
                  {balance < (challenge?.entry_fee ?? 0) && <p className="text-xs text-red-400">Insufficient balance. Need {(challenge?.entry_fee ?? 0) - balance} more DC.</p>}
                  <Button fullWidth loading={loading} disabled={balance < (challenge?.entry_fee ?? 0)} onClick={handleDoroCoinPay}>Pay {challenge?.entry_fee ?? 0} DoroCoins</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input placeholder="Cardholder Name" />
                  <Input placeholder="1234 5678 9012 3456" />
                  <div className="grid grid-cols-2 gap-2"><Input placeholder="MM/YY" /><Input placeholder="CVV" type="password" /></div>
                  <p className="text-xs text-[#6B7280]">This is a mock checkout for demonstration purposes.</p>
                  <Button fullWidth loading={loading} onClick={handleCardPay}>Pay ${challenge?.entry_fee ?? 0}</Button>
                </div>
              )}
              <Button variant="ghost" fullWidth onClick={() => { setPaymentOpen(false); setPayMethod(null); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </Section></Container>
  );
}
