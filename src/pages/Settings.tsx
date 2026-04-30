import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

const TABS = ['Profile', 'Security', 'Notifications', 'Subscription', 'Legal'];

export function Settings() {
  const [activeTab, setActiveTab] = useState('Profile');
  const { userName, userEmail, updateProfile, signOut } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();

  return (
    <Container><Section>
      <PageHeader title="Settings" subtitle="Manage your account" />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-48 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${activeTab === t ? 'bg-yellow-600/10 text-yellow-500 font-medium' : 'text-[#9CA3AF] hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 max-w-lg">
          {activeTab === 'Profile' && <ProfileTab userName={userName} userEmail={userEmail} updateProfile={updateProfile} />}
          {activeTab === 'Security' && <SecurityTab />}
          {activeTab === 'Notifications' && <NotificationsTab />}
          {activeTab === 'Subscription' && <SubscriptionTab role={role} navigate={navigate} />}
          {activeTab === 'Legal' && <LegalTab />}
          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.08)]">
            <Button variant="danger" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </div>
    </Section></Container>
  );
}

function ProfileTab({ userName, userEmail, updateProfile }: { userName: string; userEmail: string; updateProfile: (n: string, e: string) => void }) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Profile</h3>
      <div className="space-y-3">
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Button onClick={() => { updateProfile(name, email); toast.success('Profile updated'); }}>Save Changes</Button>
      </div>
    </Card>
  );
}

function SecurityTab() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Account Security</h3>
      <Button variant="secondary" onClick={() => setOpen(true)}>Change Password</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Change Password">
        <div className="space-y-3">
          <Input label="Current Password" type="password" />
          <Input label="New Password" type="password" />
          <Input label="Confirm New Password" type="password" />
          <Button fullWidth onClick={() => { toast.success('Password changed (demo)'); setOpen(false); }}>Update Password</Button>
        </div>
      </Modal>
    </Card>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState(() => ({
    email: localStorage.getItem('fdoro_notif_email') !== 'false',
    push: localStorage.getItem('fdoro_notif_push') !== 'false',
    challenges: localStorage.getItem('fdoro_notif_challenges') !== 'false',
    voting: localStorage.getItem('fdoro_notif_voting') !== 'false',
  }));

  const toggle = (key: keyof typeof settings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    localStorage.setItem(`fdoro_notif_${key}`, String(next[key]));
    toast.success(`Notifications ${next[key] ? 'enabled' : 'disabled'}`);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Notifications</h3>
      <div className="space-y-4">
        <Toggle checked={settings.email} onChange={() => toggle('email')} label="Email notifications" />
        <Toggle checked={settings.push} onChange={() => toggle('push')} label="Push notifications" />
        <Toggle checked={settings.challenges} onChange={() => toggle('challenges')} label="Challenge updates" />
        <Toggle checked={settings.voting} onChange={() => toggle('voting')} label="Voting activity" />
      </div>
    </Card>
  );
}

function SubscriptionTab({ role, navigate }: { role: string; navigate: (path: string) => void }) {
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Subscription</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-[#9CA3AF]">Current plan:</span>
        <Badge variant="gold">{role === 'free' ? 'Member (Free)' : role === 'creatorPro' ? 'Creator Pro' : 'Elite Host'}</Badge>
      </div>
      <Button variant="secondary" onClick={() => navigate('/pricing')}>Manage Subscription</Button>
    </Card>
  );
}

function LegalTab() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Legal</h3>
      <div className="space-y-2">
        {['Terms of Service', 'Privacy Policy', 'Community Guidelines'].map(doc => (
          <button key={doc} onClick={() => setOpen(doc)} className="w-full text-left px-3 py-2 text-sm text-[#9CA3AF] hover:text-white hover:bg-[#222225] rounded-md transition-colors">{doc}</button>
        ))}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open || ''}>
        <div className="text-sm text-[#9CA3AF] leading-relaxed">
          <p className="mb-3">This is placeholder legal text for the {open}. In a production environment, this would contain the full legal document reviewed by legal counsel.</p>
          <p className="mb-3">All users are bound by the terms and conditions set forth herein. Use of the Famiglia D'Oro Challenge Suite platform constitutes acceptance of these terms.</p>
          <p>For questions regarding these policies, please contact legal@famigliadoro.com.</p>
        </div>
      </Modal>
    </Card>
  );
}
