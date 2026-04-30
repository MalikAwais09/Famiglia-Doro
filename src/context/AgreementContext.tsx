import { createContext, useContext, useState, type ReactNode } from 'react';
import { agreementStorage } from '@/lib/storage';
import { useAuth } from './AuthContext';
import { generateId } from '@/lib/utils';
import type { AgreementType } from '@/types';

interface AgreementContextType {
  showAgreement: (type: AgreementType) => void;
  hideAgreement: () => void;
  acceptAgreement: (type: AgreementType) => void;
  hasAccepted: (type: AgreementType) => boolean;
  currentAgreement: AgreementType | null;
}

const AgreementContext = createContext<AgreementContextType | null>(null);

export function AgreementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const userId = user?.id;
  const [currentAgreement, setCurrentAgreement] = useState<AgreementType | null>(null);

  const showAgreement = (type: AgreementType) => setCurrentAgreement(type);
  const hideAgreement = () => setCurrentAgreement(null);

  const acceptAgreement = (type: AgreementType) => {
    if (!isAuthenticated) return;
    agreementStorage.log({
      agreementType: type,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      version: '1.0',
      ip: 'mock',
    });
    hideAgreement();
  };

  const hasAccepted = (type: AgreementType): boolean => {
    return agreementStorage.hasAccepted(userId || '', type);
  };

  return (
    <AgreementContext.Provider value={{ showAgreement, hideAgreement, acceptAgreement, hasAccepted, currentAgreement }}>
      {children}
    </AgreementContext.Provider>
  );
}

export function useAgreement() {
  const ctx = useContext(AgreementContext);
  if (!ctx) throw new Error('useAgreement must be used within AgreementProvider');
  return ctx;
}
