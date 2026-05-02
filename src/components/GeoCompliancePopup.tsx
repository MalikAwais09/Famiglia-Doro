import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  GEO_COMPLIANCE_SESSION_KEY,
  logAgreement,
} from '@/lib/supabase/agreements';

type GeoNotice = {
  title: string;
  message: string;
  requiresAck: true;
};

function getGeoMessage(countryCode: string): GeoNotice | null {
  if (countryCode === 'US')
    return {
      title: 'Notice for U.S. Users',
      message:
        'No purchase necessary where required by law. Free entry methods are available for all challenges.',
      requiresAck: true,
    };
  if (countryCode === 'CA')
    return {
      title: 'Notice for Canadian Users',
      message:
        'A skill-testing question may be required to claim prizes in certain provinces.',
      requiresAck: true,
    };
  if (
    ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE', 'NO', 'DK', 'FI', 'AT', 'CH'].includes(
      countryCode
    )
  )
    return {
      title: 'GDPR Notice',
      message:
        'By continuing, you consent to data processing under GDPR regulations. Your data is processed in accordance with our Privacy Policy.',
      requiresAck: true,
    };
  if (
    ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IR', 'IQ', 'SY'].includes(countryCode)
  )
    return {
      title: 'Regional Notice',
      message:
        'Certain monetization features may be limited in your region due to local regulations.',
      requiresAck: true,
    };
  return null;
}

export function GeoCompliancePopup() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<GeoNotice | null>(null);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (sessionStorage.getItem(GEO_COMPLIANCE_SESSION_KEY)) return;

    let cancelled = false;

    async function detect() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = (await res.json()) as { country_code?: string };
        const cc = data.country_code || '';
        if (cancelled) return;
        const n = getGeoMessage(cc.toUpperCase());
        if (n) {
          setNotice(n);
          setOpen(true);
        } else {
          sessionStorage.setItem(GEO_COMPLIANCE_SESSION_KEY, '1');
        }
      } catch {
        sessionStorage.setItem(GEO_COMPLIANCE_SESSION_KEY, '1');
      }
    }

    void detect();

    return () => {
      cancelled = true;
    };
  }, []);

  const acknowledge = async () => {
    await logAgreement('geo_compliance');
    sessionStorage.setItem(GEO_COMPLIANCE_SESSION_KEY, '1');
    setOpen(false);
  };

  if (!notice) return null;

  return (
    <Modal open={open} onClose={acknowledge} title={notice.title}>
      <div className="space-y-4">
        <p className="text-sm text-[#9CA3AF]">{notice.message}</p>
        <Link to="/legal/privacy" className="text-xs text-yellow-500 hover:underline block">
          Privacy Policy
        </Link>
        <Button fullWidth onClick={acknowledge}>
          I Understand
        </Button>
      </div>
    </Modal>
  );
}
