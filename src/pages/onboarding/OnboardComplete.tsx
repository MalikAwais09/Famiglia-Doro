import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Trophy, ShieldCheck, Eye, Users, Zap, Star, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function OnboardComplete() {
  const navigate = useNavigate();
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white">
      {/* Section 1 — Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Compete. Create. Win.</h1>
          <p className="text-xl md:text-2xl gold-text font-semibold mb-4">Your Skills Deserve a Stage</p>
          <p className="text-[#9CA3AF] max-w-lg mx-auto mb-8">
            The premium competition platform where creators, artists, and competitors showcase their talent, earn real rewards, and rise through the ranks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Trophy, title: 'Real Prizes', desc: 'Cash, digital, and physical rewards' },
              { icon: ShieldCheck, title: 'Fair Voting', desc: 'Community-driven transparent voting' },
              { icon: Eye, title: 'Transparent', desc: 'Clear rules and prize distribution' },
            ].map((f, i) => (
              <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 text-center">
                <f.icon size={24} className="mx-auto mb-2 text-yellow-500" />
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" onClick={() => navigate('/auth/sign-in')}>Sign In</Button>
            <Button variant="ghost" onClick={() => scrollTo('how-it-works')}>How It Works <ChevronDown size={16} /></Button>
          </div>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mt-12 text-[#9CA3AF]">
            <ChevronDown size={24} className="mx-auto" />
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2 — How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold text-center mb-12">How It Works</motion.h2>
          <div className="space-y-8">
            {[
              { num: 1, title: 'Enter or Create', desc: 'Join existing challenges or create your own' },
              { num: 2, title: 'Submit Your Work', desc: 'Upload video, image, text, or link' },
              { num: 3, title: 'Community Votes', desc: '1 free vote per challenge per day. Buy more with DoroCoins' },
              { num: 4, title: 'Winners Announced', desc: 'Top 3 win prizes: 1st 50%, 2nd 30%, 3rd 20%' },
            ].map((s, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-black font-bold shrink-0">{s.num}</div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-[#9CA3AF]">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Why Choose Us */}
      <section className="py-16 md:py-24 px-4 bg-[#161618]">
        <div className="max-w-4xl mx-auto">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold text-center mb-12">Why Choose Us</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Zap, title: 'Multiple Challenge Types', desc: '1v1 battles, group events, and tournament brackets' },
              { icon: ShieldCheck, title: 'Fair and Transparent', desc: 'Community voting with clear prize distribution' },
              { icon: Star, title: 'Real Rewards', desc: 'Cash prizes, digital goods, and physical items' },
              { icon: Globe, title: 'Global Community', desc: 'Compete with creators from around the world' },
            ].map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                className="bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
                <f.icon size={24} className="text-yellow-500 mb-3" />
                <p className="font-semibold mb-1">{f.title}</p>
                <p className="text-sm text-[#9CA3AF]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — CTA */}
      <section className="py-16 md:py-24 px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-2xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {[
              { value: '10k+', label: 'Creators' },
              { value: '$500k+', label: 'Prizes' },
              { value: '50+', label: 'Categories' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-bold gold-text">{s.value}</p>
                <p className="text-sm text-[#9CA3AF]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button variant="secondary" onClick={() => navigate('/auth/sign-in')}>Sign In</Button>
            <Button onClick={() => navigate('/auth/sign-up')}>Create Account <ArrowRight size={16} /></Button>
          </div>
          <p className="text-xs text-[#6B7280]">By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </motion.div>
      </section>
    </div>
  );
}
