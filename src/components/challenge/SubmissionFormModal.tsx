import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

import type { SubmissionType } from '@/lib/supabase/types';
import { Video, Image, FileText, Link, File as FileIcon, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { submitWork } from '@/lib/supabase/submissions';

const SUBMISSION_TYPES: { value: SubmissionType; label: string; icon: typeof Video; desc: string }[] = [
  { value: 'video', label: 'Video', icon: Video, desc: 'YouTube or direct URL' },
  { value: 'image', label: 'Image', icon: Image, desc: 'Image URL' },
  { value: 'text', label: 'Text', icon: FileText, desc: 'Written content' },
  { value: 'link', label: 'Link', icon: Link, desc: 'External URL' },
  { value: 'file', label: 'File', icon: File, desc: 'File URL' },
];

interface SubmissionFormModalProps {
  open: boolean;
  onClose: () => void;
  challengeId: string;
  onSuccess: () => void;
}

export function SubmissionFormModal({ open, onClose, challengeId, onSuccess }: SubmissionFormModalProps) {
  const [step, setStep] = useState<'type' | 'details' | 'done'>('type');
  const [selectedType, setSelectedType] = useState<SubmissionType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectType = (type: SubmissionType) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedType || !title.trim()) return;
    if (selectedType !== 'text' && !content.trim() && !file) {
      toast.error('Please provide content or upload a file');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Uploading submission...');

    try {
      await submitWork(challengeId, {
        title: title.trim(),
        description: description.trim() || undefined,
        content_type: selectedType,
        content_url: content.trim() || undefined,
        file: file || undefined,
      });

      toast.success('Submission uploaded successfully', { id: toastId });
      setStep('done');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload submission', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'done') {
      onSuccess();
    }
    setStep('type');
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setContent('');
    setFile(null);
    setLoading(false);
    onClose();
  };

  const getContentLabel = () => {
    switch (selectedType) {
      case 'video': return 'Video URL (YouTube or direct link)';
      case 'image': return 'Image URL';
      case 'text': return 'Your submission text';
      case 'link': return 'External URL';
      case 'file': return 'File URL';
      default: return 'Content';
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Submit Your Work" maxWidth="max-w-xl">
      {/* Step 1: Choose Type */}
      {step === 'type' && (
        <div className="space-y-4">
          <p className="text-sm text-[#9CA3AF]">Choose your submission type</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SUBMISSION_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => handleSelectType(t.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#161618] hover:border-yellow-600/40 hover:bg-yellow-600/5 transition-colors text-center"
              >
                <t.icon size={24} className="text-yellow-500" />
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-[#6B7280]">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Fill Details */}
      {step === 'details' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setStep('type')} className="text-xs text-yellow-500 hover:underline">Back to types</button>
            <span className="text-xs text-[#6B7280]">—</span>
            <span className="text-xs text-[#9CA3AF]">Submitting: {selectedType && SUBMISSION_TYPES.find(t => t.value === selectedType)?.label}</span>
          </div>

          <Input
            label="Title"
            placeholder="Give your submission a title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            error={title.length > 100 ? 'Max 100 characters' : undefined}
          />

          <div>
            <Textarea
              label="Description (optional)"
              placeholder="Describe your submission..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-right text-xs text-[#6B7280] mt-1">{description.length}/500</p>
          </div>

          {selectedType === 'text' ? (
            <div>
              <Textarea
                label="Your Submission"
                placeholder="Write your submission here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
              />
            </div>
          ) : (
            <div>
              <Input
                label={getContentLabel()}
                placeholder={
                  selectedType === 'video' ? 'https://youtube.com/watch?v=...' :
                  selectedType === 'image' ? 'https://example.com/image.jpg' :
                  selectedType === 'link' ? 'https://example.com/your-project' :
                  'https://example.com/file'
                }
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              {(selectedType === 'video' || selectedType === 'image') && (
                <div className="mt-3">
                  <p className="text-xs text-[#9CA3AF] mb-2 text-center">OR upload a file directly</p>
                  <label className="flex items-center justify-center w-full h-24 border-2 border-[rgba(255,255,255,0.1)] border-dashed rounded-lg cursor-pointer hover:bg-[#161618] transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileIcon className="w-6 h-6 text-[#9CA3AF] mb-2" />
                      <p className="text-sm text-[#9CA3AF]"><span className="font-semibold">Click to upload</span></p>
                      {file && <p className="text-xs text-emerald-400 mt-1">{file.name}</p>}
                    </div>
                    <input type="file" className="hidden" accept={selectedType === 'video' ? 'video/*' : 'image/*'} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                  </label>
                </div>
              )}
            </div>
          )}

          {selectedType === 'video' && content.includes('youtube.com/watch') && (
            <div className="aspect-video rounded-md overflow-hidden bg-black">
              <iframe
                src={content.replace('watch?v=', 'embed/')}
                title="Video preview"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}

          {selectedType === 'image' && content.trim() && (
            <div className="rounded-md overflow-hidden bg-[#161618]">
              <img src={content} alt="Preview" className="w-full max-h-48 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
            <p className="text-xs text-blue-400">This is a frontend simulation — in production, this connects to cloud storage for file uploads.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep('type')}>Back</Button>
            <Button
              fullWidth
              loading={loading}
              disabled={!title.trim() || (selectedType !== 'text' && !content.trim() && !file)}
              onClick={handleSubmit}
            >
              Submit Work
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && (
        <div className="text-center py-4 space-y-4">
          <div className="flex justify-center">
            <CheckCircle size={48} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold">Submission Uploaded</h3>
          <p className="text-sm text-[#9CA3AF]">Your work has been submitted and is now visible to all participants.</p>
          <div className="bg-[#161618] rounded-md p-4 text-left space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#9CA3AF]">Title</span>
              <span className="font-medium">{title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9CA3AF]">Type</span>
              <span className="capitalize">{selectedType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9CA3AF]">Starting Votes</span>
              <span>0</span>
            </div>
          </div>
          <div className="bg-[#161618] rounded-md p-4 text-left">
            <h4 className="text-sm font-semibold mb-2">What happens next?</h4>
            <ul className="text-xs text-[#9CA3AF] space-y-1">
              <li>Your submission is visible to all participants and voters</li>
              <li>Community voting will determine the winners</li>
              <li>You can vote on other submissions too</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={handleClose}>Close</Button>
            <Button fullWidth onClick={handleClose}>View Submissions & Vote</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
