'use client';

import React, { useState } from 'react';
import RecordButton from '@/components/RecordButton';
import CardScanner from '@/components/CardScanner';
import ExtractedFieldsForm from '@/components/ExtractedFieldsForm';
import FollowupDraftEditor from '@/components/FollowupDraftEditor';
import { Sparkles, CheckCircle2, ChevronRight, User, ShieldCheck, Play, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ExtractedContact {
  name: string | null;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  confidence: number;
}

export default function CaptureDashboard() {
  const [leadId, setLeadId] = useState<string | null>(null);
  
  // Processing States
  const [audioProcessing, setAudioProcessing] = useState(false);
  const [cardProcessing, setCardProcessing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Data States
  const [transcript, setTranscript] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [context, setContext] = useState<any>(null);
  const [extractedFields, setExtractedFields] = useState<ExtractedContact | null>(null);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  
  const [syncSystem, setSyncSystem] = useState<'zoho' | 'sheets' | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Modals
  const [showFieldsModal, setShowFieldsModal] = useState(false);

  const mockOrganizationId = '738de77c-ddd0-4a71-9d8d-3e346590ca0d';
  const mockUserId = null;

  // Initialize DB if not already initialized
  const ensureLeadId = async () => {
    if (leadId) return leadId;
    try {
      const response = await fetch('/api/leads/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: mockOrganizationId, userId: mockUserId }),
      });
      const result = await response.json();
      if (response.ok && result.data?.leadId) {
        setLeadId(result.data.leadId);
        return result.data.leadId;
      }
    } catch (e) {
      console.warn('DB initialization bypassed:', e);
    }
    return null;
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setAudioProcessing(true);
    setAudioUrl(URL.createObjectURL(audioBlob));
    const activeLeadId = await ensureLeadId();
    
    const formData = new FormData();
    formData.append('audio', audioBlob);
    if (activeLeadId) formData.append('leadId', activeLeadId);
    formData.append('organizationId', mockOrganizationId);

    try {
      const response = await fetch('/api/leads/recording/stop', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setTranscript(result.data.transcript);
          setContext(result.data.context);
          if (result.data.leadId && !leadId) setLeadId(result.data.leadId);
        }
      }
    } catch (e) {
      console.error('Audio processing failed:', e);
    } finally {
      setAudioProcessing(false);
    }
  };

  const handleScanComplete = async (data: any) => {
    const activeLeadId = await ensureLeadId();
    // In a real app we'd map this ID to the card scan record if they happen sequentially.
    setExtractedFields(data);
    setShowFieldsModal(true);
  };

  const handleConfirmFields = async (confirmedFields: ExtractedContact) => {
    setExtractedFields(confirmedFields);
    setShowFieldsModal(false);
  };

  const handleGenerateDraft = async () => {
    setIsDrafting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/confirm-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactFields: extractedFields || {},
          senderName: 'Sales Exec',
        }),
      });

      const result = await response.json();
      if (response.ok && result.data?.draft) {
        setEmailDraft(result.data.draft);
      } else {
        setEmailDraft({
          subject: `Following up from our conversation at ${extractedFields?.company || 'the exhibition'}`,
          body: `Hi ${extractedFields?.name || 'there'},\n\nIt was great speaking with you today. Let's connect next week.\n\nBest,\nSales Exec`,
        });
      }
    } catch (e) {
      console.error('Draft generation failed:', e);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (leadId && extractedFields) {
      setIsSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(`/api/leads/${leadId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactFields: extractedFields }),
        });
        if (!res.ok) throw new Error('Failed to save to database');
        
        router.push('/leads');
      } catch (e: any) {
        console.error('Failed to save draft:', e);
        setSaveError('Failed to save. Please check your connection and try again.');
      } finally {
        setIsSaving(false);
      }
    } else {
      router.push('/leads');
    }
  };

  const handleFollowupSuccess = (system: 'zoho' | 'sheets') => {
    setSyncSystem(system);
    setIsComplete(true);
    setEmailDraft(null);
  };

  const handleReset = () => {
    setLeadId(null);
    setTranscript('');
    setAudioUrl(null);
    setContext(null);
    setExtractedFields(null);
    setEmailDraft(null);
    setIsComplete(false);
    setSyncSystem(null);
  };

  // We only show the Generate Draft button if we have contact fields (since we need an email to send to).
  // The transcript is optional (can send a generic intro just from a card).
  const canGenerateDraft = extractedFields !== null;
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-6 z-10">
        <Link href="/leads" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">Live Workspace</span>
        </div>
      </header>

      {isComplete ? (
        <div className="flex-1 w-full max-w-lg flex flex-col items-center justify-center z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass-panel p-10 rounded-3xl w-full text-center space-y-6 shadow-2xl border border-emerald-500/20 bg-emerald-950/10">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 neon-glow-secondary">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white tracking-tight">Lead Captured!</h3>
              <p className="text-sm text-zinc-400 leading-relaxed px-4">
                Profile synced to <span className="text-emerald-400 font-semibold">{syncSystem === 'zoho' ? 'Zoho CRM' : 'Google Sheets'}</span> and the personalized intro email is on its way.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full mt-6 py-4 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-sm transition-all shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              Capture Next Lead
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <main className="flex-1 w-full max-w-5xl mx-auto z-10 flex flex-col justify-center gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            
            {/* LEFT COLUMN: Recording & Context */}
            <div className="flex flex-col gap-6">
              <RecordButton onRecordingComplete={handleRecordingComplete} isProcessing={audioProcessing} />
              
              {audioUrl && (
                <div className="glass-panel p-5 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 border border-indigo-500/20 bg-indigo-950/10">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4" /> Audio Playback
                  </h4>
                  <audio src={audioUrl} controls className="w-full h-10 rounded-full" />
                </div>
              )}

              {context && (
                <div className="glass-panel p-6 rounded-3xl flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 border border-indigo-500/20 bg-indigo-950/10">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Meeting Context
                  </h4>
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs text-zinc-500 block mb-1">Stated Need</span>
                      <p className="text-sm text-zinc-200 leading-relaxed">{context.needs || 'No specific needs stated.'}</p>
                    </div>
                    {context.notable_quotes?.length > 0 && (
                      <div>
                        <span className="text-xs text-zinc-500 block mb-1">Key Quote</span>
                        <p className="text-sm text-indigo-200 italic border-l-2 border-indigo-500/50 pl-3">"{context.notable_quotes[0]}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Scanning & Profile */}
            <div className="flex flex-col gap-6">
              <CardScanner onScanComplete={handleScanComplete} isProcessing={cardProcessing} />
              
              {extractedFields && (
                <div className="glass-panel p-6 rounded-3xl flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 border border-teal-500/20 bg-teal-950/10 relative group cursor-pointer" onClick={() => setShowFieldsModal(true)}>
                  <div className="absolute top-4 right-4 text-[10px] uppercase font-bold text-teal-500 bg-teal-500/10 px-2 py-1 rounded border border-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity">Edit</div>
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Contact Profile
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{extractedFields.name || 'Unknown Name'}</h2>
                      <p className="text-sm text-teal-200">{extractedFields.title} @ {extractedFields.company}</p>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <p className="text-sm text-zinc-300 flex justify-between">
                        <span className="text-zinc-500">Email</span> {extractedFields.email || '--'}
                      </p>
                      <p className="text-sm text-zinc-300 flex justify-between">
                        <span className="text-zinc-500">Phone</span> {extractedFields.phone || '--'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Action Bar */}
          {(canGenerateDraft || leadId) && (
            <div className="sticky bottom-6 mt-auto max-w-2xl mx-auto w-full animate-in slide-in-from-bottom-12 duration-700 flex flex-col gap-3">
              {saveError && (
                <div className="w-full p-3 bg-red-950/80 border border-red-500/50 text-red-300 rounded-xl text-sm flex items-center justify-center gap-2 backdrop-blur-md shadow-2xl">
                  <AlertCircle className="w-4 h-4" />
                  {saveError}
                </div>
              )}
              {canGenerateDraft && (
                <button
                  onClick={handleGenerateDraft}
                  disabled={isDrafting}
                  className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 neon-glow-primary hover:scale-[1.01] border border-indigo-400/30"
                >
                  {isDrafting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Drafting Personalized Email...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Review & Send Follow-up
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save to Drafts & Exit'}
              </button>
            </div>
          )}
        </main>
      )}

      {/* Modals */}
      {showFieldsModal && extractedFields && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <ExtractedFieldsForm
            initialFields={extractedFields}
            onConfirm={handleConfirmFields}
            onCancel={() => setShowFieldsModal(false)}
          />
        </div>
      )}

      {emailDraft && leadId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <FollowupDraftEditor
            leadId={leadId}
            initialDraft={emailDraft}
            onSuccess={handleFollowupSuccess}
            onCancel={() => setEmailDraft(null)}
          />
        </div>
      )}
    </div>
  );
}
