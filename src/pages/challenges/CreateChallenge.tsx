import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { CATEGORIES, SCORING_SYSTEMS, PREDEFINED_RULES, LOCATION_FORMATS } from '@/lib/constants';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { createChallenge, uploadCoverImage } from '@/lib/supabase/challenges';
import { localDateTimeInputToUtcIso } from '@/lib/utils/dateUtils';
import type { CreateChallengePayload, ChallengeFormat, PrizeType, LocationFormat, ScoringSystem } from '@/lib/supabase/types';

const STEPS = ['Details', 'Format', 'Prize', 'Schedule', 'Rules'];



export function CreateChallenge() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [form, setForm] = useState({
    title: '', category: 'Art & Design', customCategory: '', description: '',
    eventType: 'group' as const, scoringSystem: 'bo3' as const,
    timeLimitEnabled: false, timeLimitHours: 1, timeLimitMinutes: 0,
    uploadTimeLimitEnabled: false, uploadTimeLimitMinutes: 5, uploadTimeLimitSeconds: 0,
    twoStepEnabled: false, entryRoundDuration: '', judgingMethod: 'community' as const,
    prizeType: 'cash' as const, prizeDescription: '', entryFee: 10,
    locationFormat: 'virtual' as const, sponsorshipEnabled: false,
    registrationDeadline: '', challengeStart: '', challengeEnd: '',
    rules: PREDEFINED_RULES.slice(0, 3), customRules: '',
    ageRestrictionEnabled: false, minAge: 18, maxAge: 100,
    inviteCode: '', visibility: 'invite_only' as const, restrictedUsers: '',
  });
  const [loading, setLoading] = useState(false);
  const [promoImageName, setPromoImageName] = useState('');
  const [trailerVideoName, setTrailerVideoName] = useState('');
  const [flyerName, setFlyerName] = useState('');
  const [pdfName, setPdfName] = useState('');
  const promoImageFileRef = useRef<File | null>(null);

  const update = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleRule = (rule: string) => {
    update('rules', form.rules.includes(rule) ? form.rules.filter(r => r !== rule) : [...form.rules, rule]);
  };

  const projectedJackpot = form.entryFee * 0.85;

  const canNext = () => {
    if (step === 0) return form.title.length >= 5 && form.description.length >= 10;
    if (step === 1) return true;
    if (step === 2) return form.prizeType === 'bragging' || (form.prizeDescription.length > 0 && form.entryFee > 0);
    if (step === 3) return form.registrationDeadline && form.challengeStart && form.challengeEnd;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const cat = form.category === 'Other' ? form.customCategory || 'Other' : form.category;

      // Map local form values to DB column values
      const formatMap: Record<string, ChallengeFormat> = { '1v1': '1v1', group: 'group', tournament: 'tournament' };
      const prizeMap: Record<string, PrizeType> = { cash: 'cash', digital: 'digital', physical: 'physical', bragging: 'bragging_rights' };
      const scoringMap: Record<string, ScoringSystem> = { bo3: 'best_of_3', bo5: 'best_of_5', bo7: 'best_of_7', single: '1_rounder', points: 'points_based' };
      const locationMap: Record<string, LocationFormat> = { virtual: 'virtual', inperson: 'in_person' };

      const allRules = form.customRules.trim()
        ? [...form.rules, form.customRules.trim()]
        : form.rules;

      const payload: CreateChallengePayload = {
        title: form.title,
        description: form.description,
        category: cat,
        format: formatMap[form.eventType] ?? 'group',
        prize_type: prizeMap[form.prizeType] ?? 'bragging_rights',
        prize_description: form.prizeDescription || undefined,
        entry_fee: form.prizeType === 'bragging' ? 0 : form.entryFee,
        max_participants: form.eventType === 'tournament' ? 8 : 50,
        scoring_system: scoringMap[form.scoringSystem] ?? 'best_of_3',
        is_private: isPrivate,
        invite_code: form.inviteCode || undefined,
        sponsorship_enabled: form.sponsorshipEnabled,
        has_two_step: form.twoStepEnabled,
        judge_method: form.twoStepEnabled
          ? form.judgingMethod === 'community' ? 'community_vote'
          : form.judgingMethod === 'creator' ? 'creator_decision' : 'hybrid'
          : undefined,
        location_format: locationMap[form.locationFormat] ?? 'virtual',
        registration_deadline: localDateTimeInputToUtcIso(form.registrationDeadline),
        start_date: localDateTimeInputToUtcIso(form.challengeStart),
        end_date: localDateTimeInputToUtcIso(form.challengeEnd),
        rules: allRules,
        phase: 'entry_open',
      };

      // Wrap createChallenge in a 10-second timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 10000)
      );
      
      const created = await Promise.race([
        createChallenge(payload),
        timeoutPromise
      ]);

      // Upload cover image if user selected one
      if (promoImageFileRef.current) {
        try {
          await uploadCoverImage(created.id, promoImageFileRef.current);
        } catch {
          // Non-fatal — challenge is created, image just won't show
          toast.warning('Challenge created but cover image upload failed');
        }
      }

      toast.success('Challenge created successfully!');
      navigate('/challenges');
    } catch (err: any) {
      console.error('Challenge creation error:', err);
      const msg = err?.message || (err instanceof Error ? err.message : 'Failed to create challenge');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Section>
        <div className="max-w-2xl mx-auto">
          {/* Public/Private Toggle */}
          <div className="flex rounded-md border border-[rgba(255,255,255,0.08)] overflow-hidden mb-6">
            <button onClick={() => setIsPrivate(false)} className={`flex-1 py-2 text-sm font-medium transition-colors ${!isPrivate ? 'gold-gradient text-black' : 'bg-transparent text-[#9CA3AF]'}`}>Public Challenge</button>
            <button onClick={() => setIsPrivate(true)} className={`flex-1 py-2 text-sm font-medium transition-colors ${isPrivate ? 'gold-gradient text-black' : 'bg-transparent text-[#9CA3AF]'}`}>Private / Exclusive</button>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((s, i) => (
              <button key={i} onClick={() => i < step && setStep(i)} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'gold-gradient text-black' : 'bg-[#161618] text-[#9CA3AF] border border-[rgba(255,255,255,0.08)]'}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-xs text-[#9CA3AF] hidden sm:block">{s}</span>
              </button>
            ))}
          </div>

          <Card>
            {/* Step 1 — Details */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Challenge Details</h2>
                <Input label="Title" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Min 5 characters" error={form.title.length > 0 && form.title.length < 5 ? 'Min 5 characters' : undefined} />
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Category</label>
                  <select value={form.category} onChange={e => update('category', e.target.value)} className="w-full h-10 px-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500">
                    {[...CATEGORIES, 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {form.category === 'Other' && <Input placeholder="Create Category" value={form.customCategory} onChange={e => update('customCategory', e.target.value)} />}
                <Textarea label="Description" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Min 10 characters" />
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Promo Image</label>
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-lg p-4 text-center">
                    {promoImageName ? (
                      <div className="flex items-center justify-between"><span className="text-sm text-emerald-400">{promoImageName}</span><button onClick={() => { setPromoImageName(''); promoImageFileRef.current = null; }}><X size={14} className="text-[#9CA3AF]" /></button></div>
                    ) : (
                      <label className="cursor-pointer"><Upload size={24} className="mx-auto mb-2 text-[#6B7280]" /><p className="text-xs text-[#6B7280]">Click to upload (max 5MB)</p><input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setPromoImageName(f.name); promoImageFileRef.current = f; } }} /></label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Trailer Video</label>
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-lg p-4 text-center">
                    {trailerVideoName ? (
                      <div className="flex items-center justify-between"><span className="text-sm text-emerald-400">{trailerVideoName}</span><button onClick={() => setTrailerVideoName('')}><X size={14} className="text-[#9CA3AF]" /></button></div>
                    ) : (
                      <label className="cursor-pointer"><Upload size={24} className="mx-auto mb-2 text-[#6B7280]" /><p className="text-xs text-[#6B7280]">Click to upload video (max 50MB)</p><input type="file" accept="video/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setTrailerVideoName(e.target.files[0].name); }} /></label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Format */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Competition Format</h2>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-2">Event Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ v: '1v1', l: '1 vs 1 Battle' }, { v: 'group', l: 'Group Event' }, { v: 'tournament', l: 'Tournament (Max 50)' }].map(t => (
                      <button key={t.v} onClick={() => update('eventType', t.v)} className={`p-3 rounded-md border text-xs text-center transition-colors ${form.eventType === t.v ? 'border-yellow-600 bg-yellow-600/10' : 'border-[rgba(255,255,255,0.08)]'}`}>{t.l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Scoring System</label>
                  <select value={form.scoringSystem} onChange={e => update('scoringSystem', e.target.value)} className="w-full h-10 px-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500">
                    {SCORING_SYSTEMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <Toggle checked={form.timeLimitEnabled} onChange={v => update('timeLimitEnabled', v)} label="Add Time Limit" />
                {form.timeLimitEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Hours" type="number" value={form.timeLimitHours} onChange={e => update('timeLimitHours', Number(e.target.value))} />
                    <Input label="Minutes" type="number" value={form.timeLimitMinutes} onChange={e => update('timeLimitMinutes', Number(e.target.value))} />
                  </div>
                )}
                <Toggle checked={form.twoStepEnabled} onChange={v => update('twoStepEnabled', v)} label="2-Step Competition Format" />
                {form.twoStepEnabled && (
                  <div className="space-y-3 bg-[#161618] rounded-md p-4">
                    <Input label="Entry Round Duration" value={form.entryRoundDuration} onChange={e => update('entryRoundDuration', e.target.value)} placeholder="e.g. 3 days" />
                    <div>
                      <label className="block text-sm text-[#9CA3AF] mb-1">Judging Method</label>
                      <select value={form.judgingMethod} onChange={e => update('judgingMethod', e.target.value)} className="w-full h-10 px-3 rounded-md bg-[#0E0E0F] border border-[rgba(255,255,255,0.08)] text-sm text-white">
                        <option value="community">Community Vote</option>
                        <option value="creator">Creator Decision</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#6B7280]">Free users get 1 vote per challenge per day. Additional votes require DoroCoins.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Prize */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Prizes & Logistics</h2>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-2">Prize Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 'cash', l: 'Cash Jackpot' }, { v: 'digital', l: 'Digital Prize' }, { v: 'physical', l: 'Physical Prize' }, { v: 'bragging', l: 'Bragging Rights' }].map(t => (
                      <button key={t.v} onClick={() => update('prizeType', t.v)} className={`p-3 rounded-md border text-xs text-center transition-colors ${form.prizeType === t.v ? 'border-yellow-600 bg-yellow-600/10' : 'border-[rgba(255,255,255,0.08)]'}`}>{t.l}</button>
                    ))}
                  </div>
                </div>
                {form.prizeType === 'bragging' ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
                    <p className="text-xs text-emerald-400">This challenge awards leaderboard ranking only. No entry fee required.</p>
                  </div>
                ) : (
                  <>
                    <Input label="Prize Description" value={form.prizeDescription} onChange={e => update('prizeDescription', e.target.value)} placeholder="e.g. $1000 Cash" />
                    <Input label="Entry Fee (DoroCoins)" type="number" value={form.entryFee} onChange={e => update('entryFee', Number(e.target.value))} />
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
                      <p className="text-xs text-emerald-400">Projected Jackpot: {projectedJackpot.toFixed(0)} DC</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-2">Prize Distribution</p>
                      <div className="flex h-3 rounded-full overflow-hidden">
                        <div className="w-[50%] bg-emerald-500" />
                        <div className="w-[35%] bg-yellow-500" />
                        <div className="w-[15%] bg-gray-500" />
                      </div>
                      <div className="flex justify-between text-xs mt-1 text-[#9CA3AF]">
                        <span>Winner 50%</span><span>Creator 35%</span><span>Platform 15%</span>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Location Format</label>
                  <select value={form.locationFormat} onChange={e => update('locationFormat', e.target.value)} className="w-full h-10 px-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500">
                    {LOCATION_FORMATS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
                  <Toggle checked={form.sponsorshipEnabled} onChange={v => update('sponsorshipEnabled', v)} label="Enable Sponsorship Collaboration" />
                  {form.sponsorshipEnabled && <p className="text-xs text-blue-400 mt-2">Default 12% ROI, 3% to creator. Configurable via two-party sync.</p>}
                </div>
              </div>
            )}

            {/* Step 4 — Schedule */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Scheduling</h2>
                <Input label="Registration Deadline" type="datetime-local" value={form.registrationDeadline} onChange={e => update('registrationDeadline', e.target.value)} />
                <Input label="Challenge Start" type="datetime-local" value={form.challengeStart} onChange={e => update('challengeStart', e.target.value)} />
                <Input label="Challenge End" type="datetime-local" value={form.challengeEnd} onChange={e => update('challengeEnd', e.target.value)} />
                {form.registrationDeadline && form.challengeStart && form.registrationDeadline >= form.challengeStart && (
                  <p className="text-xs text-red-400">Registration deadline must be before start date</p>
                )}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Flyer Upload</label>
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-lg p-4 text-center">
                    {flyerName ? (
                      <div className="flex items-center justify-between"><span className="text-sm text-emerald-400">{flyerName}</span><button onClick={() => setFlyerName('')}><X size={14} className="text-[#9CA3AF]" /></button></div>
                    ) : (
                      <label className="cursor-pointer"><Upload size={20} className="mx-auto mb-1 text-[#6B7280]" /><p className="text-xs text-[#6B7280]">Upload flyer image</p><input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setFlyerName(e.target.files[0].name); }} /></label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Rules PDF</label>
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-lg p-4 text-center">
                    {pdfName ? <span className="text-sm text-emerald-400">{pdfName}</span> : (
                      <label className="cursor-pointer"><Upload size={20} className="mx-auto mb-1 text-[#6B7280]" /><p className="text-xs text-[#6B7280]">Upload rules PDF</p><input type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setPdfName(e.target.files[0].name); }} /></label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 — Rules */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Rules</h2>
                <div className="space-y-2">
                  {PREDEFINED_RULES.map((rule, i) => (
                    <label key={i} className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.rules.includes(rule)} onChange={() => toggleRule(rule)} className="mt-0.5 accent-yellow-600" />
                      <span className="text-sm text-[#9CA3AF]">{rule}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#9CA3AF]">{form.rules.length} rules selected</p>
                <Textarea label="Custom Rules (optional)" value={form.customRules} onChange={e => update('customRules', e.target.value)} placeholder="Add any additional rules..." />
                <Toggle checked={form.ageRestrictionEnabled} onChange={v => update('ageRestrictionEnabled', v)} label="Age Restriction" />
                {form.ageRestrictionEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Min Age" type="number" value={form.minAge} onChange={e => update('minAge', Number(e.target.value))} />
                    <Input label="Max Age" type="number" value={form.maxAge} onChange={e => update('maxAge', Number(e.target.value))} />
                  </div>
                )}

                {/* Private Restrictions */}
                {isPrivate && (
                  <div className="border border-yellow-600/30 bg-yellow-600/5 rounded-lg p-4 space-y-3 mt-4">
                    <h3 className="text-sm font-semibold gold-text">Private Restrictions</h3>
                    <Input label="Invite Code (optional)" value={form.inviteCode} onChange={e => update('inviteCode', e.target.value)} placeholder="e.g. VIP2026" />
                    <Toggle checked={form.ageRestrictionEnabled} onChange={v => update('ageRestrictionEnabled', v)} label="Age Restriction" />
                    {form.ageRestrictionEnabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Min Age" type="number" value={form.minAge} onChange={e => update('minAge', Number(e.target.value))} />
                        <Input label="Max Age" type="number" value={form.maxAge} onChange={e => update('maxAge', Number(e.target.value))} />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-[#9CA3AF] mb-1">Visibility</label>
                      <select value={form.visibility} onChange={e => update('visibility', e.target.value)} className="w-full h-10 px-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-sm text-white">
                        <option value="invite_only">Invite Only</option>
                        <option value="hidden">Hidden</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                    </div>
                    <Textarea label="Restrict to Specific Users (optional)" value={form.restrictedUsers} onChange={e => update('restrictedUsers', e.target.value)} placeholder="Enter usernames..." />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { if (confirm('Are you sure? Progress will be lost')) navigate('/challenges'); }}>Cancel</Button>
                {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}><ChevronLeft size={14} /> Previous</Button>}
              </div>
              {step < 4 ? (
                <Button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}>Next <ChevronRight size={14} /></Button>
              ) : (
                <Button loading={loading} onClick={handleSubmit}>Create Challenge</Button>
              )}
            </div>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
