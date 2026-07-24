'use client';

import React, { useState } from 'react';
import { MailOpen, Edit, Save, Send, AlertTriangle, CheckCircle } from 'lucide-react';

interface EmailDraft {
  subject: string;
  body: string;
}

interface FollowupDraftEditorProps {
  leadId: string;
  initialDraft: EmailDraft;
  onSuccess: (syncedTo: 'zoho' | 'sheets') => void;
  onCancel: () => void;
}

export default function FollowupDraftEditor({
  leadId,
  initialDraft,
  onSuccess,
  onCancel,
}: FollowupDraftEditorProps) {
  const [draft, setDraft] = useState<EmailDraft>({ ...initialDraft });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ status: 'idle' | 'success' | 'failed'; system?: 'zoho' | 'sheets' }>({
    status: 'idle',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/approve-followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: draft.subject,
          body: draft.body,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Syncing failed. Both CRM and fallback were unreachable.');
      }

      setSyncStatus({
        status: 'success',
        system: result.data.syncedTo,
      });

      setTimeout(() => {
        onSuccess(result.data.syncedTo);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during approval.');
      setSyncStatus({ status: 'failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl w-full max-w-md mx-auto transition-all duration-300">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/60 pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-400">
          <MailOpen className="w-5 h-5" />
          Review Follow-Up Email
        </h3>
      </div>

      {syncStatus.status === 'success' ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-zinc-100 text-base">Draft Approved & Synced!</h4>
            <p className="text-xs text-zinc-400">
              Lead details saved and synced to{' '}
              <span className="font-semibold text-indigo-400 capitalize">
                {syncStatus.system === 'zoho' ? 'Zoho CRM' : 'Google Sheets Fallback'}
              </span>
            </p>
            <p className="text-[10px] text-zinc-500">First follow-up email scheduled for 1 hour from now.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400 mb-2">
            The AI drafted this email based on your conversation transcript. Adjust any wording before scheduling.
          </p>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Edit className="w-3.5 h-3.5 text-indigo-400" />
              Email Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={draft.subject}
              onChange={handleInputChange}
              required
              className="w-full bg-black/50 border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-all outline-none shadow-inner"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1.5">
            <label htmlFor="body" className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <MailOpen className="w-3.5 h-3.5 text-indigo-400" />
              Email Message
            </label>
            <textarea
              id="body"
              name="body"
              value={draft.body}
              onChange={handleInputChange}
              required
              rows={8}
              className="w-full bg-black/50 border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-all outline-none font-sans leading-relaxed resize-none shadow-inner"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/40">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white flex items-center justify-center gap-1.5 neon-glow-primary hover:scale-[1.01] transition-all"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Approve & Sync
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
