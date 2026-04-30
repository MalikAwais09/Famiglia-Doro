import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserRole } from '@/types';

interface RoleContextType {
  role: UserRole;
  isCreator: boolean;
  isElite: boolean;
  upgradeRole: (newRole: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('userRole') as UserRole) || 'free';
  });

  const upgradeRole = useCallback((newRole: UserRole) => {
    localStorage.setItem('userRole', newRole);
    setRole(newRole);
  }, []);

  return (
    <RoleContext.Provider value={{ role, isCreator: role !== 'free', isElite: role === 'eliteHost', upgradeRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
