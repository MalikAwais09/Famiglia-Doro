import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_PRICING_TIERS } from '@/lib/mock/data';
import { useRole } from '@/context/RoleContext';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Pricing() {
  const navigate = useNavigate();
  const { role, upgradeRole } = useRole();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleUpgrade = (tier: typeof MOCK_PRICING_TIERS[0]) => {
    if (tier.role === role) return;
    setLoadingTier(tier.role);
    setTimeout(() => {
      upgradeRole(tier.role);
      toast.success(`Upgraded to ${tier.name}`);
      navigate('/dashboard');
      setLoadingTier(null);
    }, 500);
  };

  return (
    <Container><Section>
      <PageHeader title="Pricing" subtitle="Choose the plan that fits your ambitions" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {MOCK_PRICING_TIERS.map(tier => {
          const isCurrent = tier.role === role;
          return (
            <Card key={tier.role} className={`relative flex flex-col ${tier.recommended ? 'border-yellow-600/30' : ''} ${isCurrent ? 'ring-1 ring-yellow-500' : ''}`}>
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="gold">Recommended</Badge>
                </div>
              )}
              <div className="text-center mb-4 pt-2">
                {tier.badge && <Badge variant="gold" className="mb-2">{tier.badge}</Badge>}
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="text-2xl font-bold mt-2 gold-text">{tier.price}</p>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                    <Check size={14} className="text-emerald-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="secondary" fullWidth disabled>Current Plan</Button>
              ) : tier.role === 'free' ? null : (
                <Button fullWidth loading={loadingTier === tier.role} onClick={() => handleUpgrade(tier)}>
                  {tier.priceNumber > (MOCK_PRICING_TIERS.find(t => t.role === role)?.priceNumber || 0) ? 'Upgrade' : 'Downgrade'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </Section></Container>
  );
}
