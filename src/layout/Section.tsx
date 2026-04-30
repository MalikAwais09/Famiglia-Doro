import type { ReactNode } from 'react';
export function Section({ children }: { children: ReactNode }) {
  return <div className="py-6 md:py-8">{children}</div>;
}
