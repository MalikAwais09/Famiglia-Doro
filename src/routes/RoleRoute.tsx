import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function RoleRoute({ children, requiredRole }: { children: ReactNode; requiredRole: UserRole }) {
  const role = (localStorage.getItem('userRole') as UserRole) || 'free';
  if (role === requiredRole || (requiredRole === 'creatorPro' && role === 'eliteHost')) return <>{children}</>;
  return <LockedFeature />;
}

export function LockedFeature() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  return (
    <Modal open={open} onClose={() => { setOpen(false); navigate(-1); }} title="Premium Feature">
      <div className="text-center py-4">
        <p className="text-[#9CA3AF] mb-4">This feature requires a Creator Pro or Elite Host subscription.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
          <Button onClick={() => { setOpen(false); navigate('/pricing'); }}>View Plans</Button>
        </div>
      </div>
    </Modal>
  );
}
