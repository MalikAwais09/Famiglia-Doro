import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { ChevronLeft } from 'lucide-react';

export function LegalDocLayout({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <Container>
      <Section>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-yellow-500 hover:underline mb-6"
        >
          <ChevronLeft size={16} /> Back
        </Link>
        <article className="max-w-3xl mx-auto space-y-8 text-[#E5E7EB]">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-sm text-[#9CA3AF]">Effective date: {effectiveDate}</p>
          </header>
          <div className="prose prose-invert prose-sm max-w-none space-y-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_p]:text-[#9CA3AF] [&_li]:text-[#9CA3AF]">
            {children}
          </div>
        </article>
      </Section>
    </Container>
  );
}
