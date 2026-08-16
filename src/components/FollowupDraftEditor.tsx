'use client';

import React, { useState, useEffect } from 'react';
import { MailOpen, Edit, Save, Send, AlertTriangle, CheckCircle, Paperclip, X } from 'lucide-react';
import { useToast } from './Toast';

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
  const [attachments, setAttachments] = useState<{ filename: string; content: string; encoding: string }[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle || '';
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const content = result.split(',')[1]; // get base64 string without data type prefix
          setAttachments((prev) => [
            ...prev,
            { filename: file.name, content, encoding: 'base64' },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    // clear input so same file can be selected again if removed
    e.target.value = '';
  };
  
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
          attachments,
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
      addToast('success', 'Email Sent & Synced!', `Synced to ${result.data.syncedTo === 'zoho' ? 'Zoho CRM' : 'Google Sheets'}`);

      setTimeout(() => {
        onSuccess(result.data.syncedTo);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during approval.');
      setSyncStatus({ status: 'failed' });
      addToast('error', 'Sync Failed', err.message || 'Both CRM and fallback were unreachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 rounded-2xl w-full max-w-md mx-auto transition-all duration-300">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200/60 pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-600">
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
            <h4 className="font-semibold text-slate-900 text-base">Draft Approved & Synced!</h4>
            <p className="text-xs text-slate-500">
              Lead details saved and synced to{' '}
              <span className="font-semibold text-slate-600 capitalize">
                {syncStatus.system === 'zoho' ? 'Zoho CRM' : 'Google Sheets Fallback'}
              </span>
            </p>
            <p className="text-[10px] text-slate-400">First follow-up email scheduled for 1 hour from now.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 mb-2">
            The AI drafted this email based on your conversation transcript. Adjust any wording before scheduling.
          </p>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Edit className="w-3.5 h-3.5 text-slate-600" />
              Email Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={draft.subject}
              onChange={handleInputChange}
              required
              className="w-full bg-white/50 border border-slate-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-zinc-600 transition-all outline-none shadow-inner"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1.5">
            <label htmlFor="body" className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <MailOpen className="w-3.5 h-3.5 text-slate-600" />
              Email Message
            </label>
            <textarea
              id="body"
              name="body"
              value={draft.body}
              onChange={handleInputChange}
              required
              rows={8}
              className="w-full bg-white/50 border border-slate-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-zinc-600 transition-all outline-none font-sans leading-relaxed resize-none shadow-inner"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2 pb-2">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-slate-600" />
              Attachments
            </label>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-800/10 border border-blue-500/20 text-slate-500 px-3 py-1.5 rounded-lg text-xs">
                    <span className="truncate max-w-[150px]">{att.filename}</span>
                    <button type="button" onClick={() => removeAttachment(i)} className="text-slate-600 hover:text-indigo-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-slate-700 hover:file:bg-white/10 transition-all cursor-pointer"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-200/40">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:text-zinc-200 hover:bg-slate-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-slate-800 text-sm font-medium text-slate-900 flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] transition-all"
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
