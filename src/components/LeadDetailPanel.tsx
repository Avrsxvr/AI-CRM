'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Send,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  Camera,
  Save,
  Edit3,
  Trash2,
} from 'lucide-react';
import LeadStatusBadge from './LeadStatusBadge';
import AudioPlayer from './AudioPlayer';
import FollowupDraftEditor from './FollowupDraftEditor';

interface LeadDetailPanelProps {
  lead: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function LeadDetailPanel({ lead, onClose, onRefresh }: LeadDetailPanelProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contact = lead.contact_fields || {};
  const context = lead.context_summary || {};
  
  // recordings and card_scans are 1:1 relationships in the schema and are returned as objects,
  // but were previously accessed as arrays (?.[0]), returning undefined.
  const recording = lead.recordings 
    ? (Array.isArray(lead.recordings) ? lead.recordings[0] : lead.recordings) 
    : {};
  const card = lead.card_scans 
    ? (Array.isArray(lead.card_scans) ? lead.card_scans[0] : lead.card_scans) 
    : {};
    
  const followups = lead.followups || [];
  const syncLogs = lead.crm_sync_log || [];

  const getTimelineEvents = () => {
    const events = [];
    
    // 1. Lead captured
    if (lead.created_at) {
      events.push({
        title: 'Lead Captured',
        timestamp: lead.created_at,
        icon: '🎙️',
        description: 'Prospect conversation recorded at trade show booth.',
        color: 'bg-indigo-500'
      });
    }

    // 2. Card scanned
    if (card && card.image_url) {
      events.push({
        title: 'Business Card Scanned',
        timestamp: card.created_at || lead.created_at,
        icon: '📇',
        description: `OCR completed (${Math.round((card.confidence || 0.95) * 100)}% confidence).`,
        color: 'bg-teal-500'
      });
    }

    // 3. Audio processed
    if (recording && (recording.audio_url || recording.transcript)) {
      events.push({
        title: 'Conversation Transcribed',
        timestamp: recording.created_at || lead.created_at,
        icon: '📝',
        description: 'Gemini extracted sales context and verbatim transcript.',
        color: 'bg-purple-500'
      });
    }

    // 4. CRM Sync
    syncLogs.forEach((log: any) => {
      events.push({
        title: `${log.target_system.toUpperCase()} CRM Sync`,
        timestamp: log.synced_at,
        icon: log.status === 'success' ? '✅' : '❌',
        description: log.status === 'success' 
          ? `Lead pushed successfully to ${log.target_system === 'zoho' ? 'Zoho CRM' : 'Google Sheets'}.`
          : `Sync attempt failed: ${log.error_message || 'Unknown error'}.`,
        color: log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
      });
    });

    // 5. Follow-ups
    followups.forEach((touch: any) => {
      if (touch.status === 'sent') {
        events.push({
          title: `Touch ${touch.sequence_position} Email Sent`,
          timestamp: touch.sent_at,
          icon: '✉️',
          description: `Touchpoint ${touch.sequence_position} follow-up successfully sent.`,
          color: 'bg-blue-500'
        });
      }
    });

    // 6. Opens
    const openCount = context.open_count || 0;
    if (openCount > 0) {
      events.push({
        title: 'Follow-up Email Opened',
        timestamp: new Date(new Date(lead.created_at).getTime() + 10 * 60 * 1000).toISOString(),
        icon: '👁️',
        description: `Prospect opened email. Total opens: ${openCount} views. ${context.is_hot ? '🔥 HOT LEAD' : ''}`,
        color: context.is_hot ? 'bg-rose-500 animate-pulse' : 'bg-rose-400'
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(contact.name || '');
  const [editCompany, setEditCompany] = useState(contact.company || '');
  const [editTitle, setEditTitle] = useState(contact.title || '');
  const [editEmail, setEditEmail] = useState(contact.email || '');
  const [editPhone, setEditPhone] = useState(contact.phone || '');
  const [isSavingFields, setIsSavingFields] = useState(false);

  // Follow-up generation State
  const [isDrafting, setIsDrafting] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);

  // Scanning State
  const [isScanningCard, setIsScanningCard] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cardImageBase64, setCardImageBase64] = useState<string | null>(null);

  // Reset fields when lead changes
  useEffect(() => {
    setEditName(lead.contact_fields?.name || '');
    setEditCompany(lead.contact_fields?.company || '');
    setEditTitle(lead.contact_fields?.title || '');
    setEditEmail(lead.contact_fields?.email || '');
    setEditPhone(lead.contact_fields?.phone || '');
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setScanError(null);
    setEmailDraft(null);
    setCardImageBase64(null);
  }, [lead.id, lead.contact_fields]);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle || '';
    };
  }, []);

  const handleGenerateDraft = async () => {
    setIsDrafting(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${lead.id}/confirm-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactFields: contact,
          senderName: 'Sales Exec',
        }),
      });

      const result = await response.json();
      if (response.ok && result.data?.draft) {
        setEmailDraft(result.data.draft);
      } else {
        setEmailDraft({
          subject: `Following up from our conversation`,
          body: `Hi ${contact.name || 'there'},\n\nIt was great speaking with you. Let's connect next week.\n\nBest,\nSales Exec`,
        });
      }
    } catch (e) {
      console.error('Draft generation failed:', e);
      setError('Failed to generate draft. Please try again.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleDeleteLead = async () => {
    setIsDeletingLead(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to delete lead.');
      }
      onClose();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during deletion.');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingLead(false);
    }
  };

  const handleSaveFields = async () => {
    setIsSavingFields(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${lead.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactFields: {
            name: editName || null,
            company: editCompany || null,
            title: editTitle || null,
            email: editEmail || null,
            phone: editPhone || null,
          },
          cardImage: cardImageBase64 || null,
          confidence: cardImageBase64 ? 0.95 : 1.0,
        }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to save changes.');
      }
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSavingFields(false);
    }
  };

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningCard(true);
    setScanError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = async () => {
        // Compress using Canvas to prevent payload size limits
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setCardImageBase64(compressedBase64);
          
          try {
            const response = await fetch('/api/leads/card-scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: compressedBase64 }),
            });
            const result = await response.json();
            
            if (response.ok && result.data) {
              const data = result.data;
              // Switch to editing and auto-fill extracted details
              setIsEditing(true);
              if (data.name) setEditName(data.name);
              if (data.company) setEditCompany(data.company);
              if (data.title) setEditTitle(data.title);
              if (data.email) setEditEmail(data.email);
              if (data.phone) setEditPhone(data.phone);
            } else {
              setScanError(result.error?.message || 'Failed to scan card.');
            }
          } catch (err) {
            setScanError('Failed to upload or scan card image.');
          } finally {
            setIsScanningCard(false);
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRetrySync = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      // Re-trigger the approve-followup API endpoint to run Zoho sync + Sheets fallback
      const response = await fetch(`/api/leads/${lead.id}/approve-followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Following up on our conversation', // Default fallback
          body: `Hi ${contact.name || 'there'},\n\nIt was great speaking with you. I wanted to follow up and see how we can assist you with your requirements.\n\nBest regards,\nSales Exec`,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Sync retry failed. Both integrations are still unreachable.');
      }

      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during synchronization retry.');
    } finally {
      setIsRetrying(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'skeptical':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'neutral':
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Slide-over Panel */}
      <div className="relative w-full max-w-lg bg-black border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 h-full">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{contact.name || 'Unnamed Prospect'}</h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {lead.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {context.is_hot && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse flex items-center gap-1">
                <span>🔥</span> Hot
              </span>
            )}
            <LeadStatusBadge status={lead.status} />
          </div>
        </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Alerts / Error States */}
        {lead.status === 'needs_attention' && (
          <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-3">
            <div className="flex gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold block mb-0.5">Synchronization Failed</span>
                Both Zoho CRM and the Google Sheets fallback failed to sync. Review your integration credentials or check internet connectivity.
              </div>
            </div>
            {syncLogs.length > 0 && syncLogs[syncLogs.length - 1]?.error_message && (
              <p className="text-[10px] font-mono text-red-500/80 bg-black/35 p-2 rounded border border-red-900/30">
                Log Error: {syncLogs[syncLogs.length - 1].error_message}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-400 font-medium">Retry error: {error}</p>
            )}
            <button
              onClick={handleRetrySync}
              disabled={isRetrying}
              className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            >
              {isRetrying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Retry Synchronization Now
            </button>
          </div>
        )}

        {/* 1. Contact Details Card */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Contact Profile
            </h4>
            {!isEditing && !showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Delete Prospect"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {showDeleteConfirm && (
            <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex gap-2 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold block mb-0.5">Delete Prospect?</span>
                  Are you sure you want to delete this contact and all associated recordings and follow-up templates? This action is permanent.
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteLead}
                  disabled={isDeletingLead}
                  className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {isDeletingLead ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-1.5 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:border-indigo-500 focus:ring-0 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Company</label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:border-indigo-500 focus:ring-0 outline-none"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Job Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:border-indigo-500 focus:ring-0 outline-none"
                  placeholder="e.g. Manager"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:border-indigo-500 focus:ring-0 outline-none"
                  placeholder="e.g. name@company.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:border-indigo-500 focus:ring-0 outline-none"
                  placeholder="e.g. +1 555-0199"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveFields}
                  disabled={isSavingFields}
                  className="flex-1 py-2 px-3 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  {isSavingFields ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-300">Company:</span>
                  <span className="text-zinc-100 font-medium">{contact.company || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-300">Job Title:</span>
                  <span className="text-zinc-100 font-medium">{contact.title || 'Not Specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-300">Email:</span>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="text-indigo-400 hover:underline">
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-zinc-500 italic">None</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-300">Phone:</span>
                  <span className={contact.phone ? "text-zinc-100" : "text-zinc-500 italic"}>
                    {contact.phone || 'None'}
                  </span>
                </div>
              </div>

              {!contact.name && (
                <div className="border border-dashed border-zinc-800 rounded-2xl p-4 text-center space-y-3 bg-zinc-950/20">
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Missing prospect info? Upload a business card photo to automatically extract and populate their profile details.
                  </p>
                  <label className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all neon-glow-primary">
                    <Camera className="w-3.5 h-3.5" />
                    {isScanningCard ? 'Processing...' : 'Upload Business Card'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCardUpload}
                      disabled={isScanningCard}
                      className="hidden"
                    />
                  </label>
                  {scanError && (
                    <p className="text-[10px] text-red-400">{scanError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Follow-up Pipeline Action (If no sequence is scheduled yet) */}
        {followups.length === 0 && (
          <div className="w-full">
            {contact.email ? (
              <button
                onClick={handleGenerateDraft}
                disabled={isDrafting}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 neon-glow-primary hover:scale-[1.01]"
              >
                {isDrafting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Follow-up Sequence...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Initialize Follow-up Pipeline
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-zinc-500 text-xs font-semibold text-center leading-relaxed">
                Add an email address to initialize the 3-month follow-up pipeline.
              </div>
            )}
          </div>
        )}

        {/* 2. Visual Timeline */}
        <div className="glass-panel p-4 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/40 pb-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Lead Journey Timeline
          </h4>
          <div className="relative border-l border-zinc-800 ml-3.5 pl-4 space-y-4">
            {getTimelineEvents().map((event, idx) => (
              <div key={idx} className="relative text-xs">
                {/* Timeline icon dot */}
                <span className={`absolute -left-[24.5px] top-0.5 w-5 h-5 rounded-full ${event.color} border border-zinc-950 flex items-center justify-center text-[10px]`}>
                  {event.icon}
                </span>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-zinc-200">{event.title}</span>
                  <span className="text-[9px] text-zinc-500">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{event.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. AI Extraction Insights */}
        {context && (
          <div className="glass-panel p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                AI Sales Context
              </h4>
              {context.sentiment && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getSentimentColor(context.sentiment)}`}>
                  {context.sentiment} Sentiment
                </span>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Problem */}
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium">Stated Problem / Challenge:</span>
                <p className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900/60 text-zinc-200 leading-relaxed">
                  {context.problem || 'No specific problem extracted.'}
                </p>
              </div>

              {/* Needs */}
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium">Interest & Requirements:</span>
                <p className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900/60 text-zinc-200 leading-relaxed">
                  {context.needs || 'No specific requirements extracted.'}
                </p>
              </div>

              {/* Action items */}
              {context.action_items && context.action_items.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-zinc-400 font-medium">Agreed Action Items:</span>
                  <ul className="space-y-1.5">
                    {context.action_items.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-zinc-300">
                        <span className="w-4 h-4 rounded border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quotes */}
              {context.notable_quotes && context.notable_quotes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-zinc-400 font-medium">Key Quotes:</span>
                  <div className="space-y-2">
                    {context.notable_quotes.map((quote: string, idx: number) => (
                      <p key={idx} className="border-l-2 border-indigo-500/40 pl-3 italic text-zinc-400 leading-relaxed">
                        "{quote}"
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Audio & Transcript */}
        {recording && (recording.audio_url || recording.transcript) && (
          <div className="glass-panel p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/40 pb-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Recorded Conversation
            </h4>
            {recording.audio_url && (
              <div className="pb-1">
                {recording.audio_url.startsWith('local-placeholder://') ? (
                  <div className="p-3 bg-zinc-950/60 border border-zinc-900/60 rounded-xl flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-mono truncate max-w-[280px]">
                      {recording.audio_url.replace('local-placeholder://', '')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex-shrink-0">
                      Local Dev Audio
                    </span>
                  </div>
                ) : (
                  <AudioPlayer src={recording.audio_url} />
                )}
              </div>
            )}
            {recording.transcript && (
              <div className="max-h-40 overflow-y-auto bg-zinc-950/60 p-3 rounded-lg border border-zinc-900/60 text-xs text-zinc-400 font-mono leading-relaxed whitespace-pre-line">
                {recording.transcript}
              </div>
            )}
          </div>
        )}

        {/* 4. Drip Nurture Sequence */}
        {followups.length > 0 && (
          <div className="glass-panel p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/40 pb-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Drip Nurture Sequence
            </h4>
            <div className="relative border-l border-zinc-800 ml-2.5 pl-4 space-y-4 text-xs">
              {followups
                .sort((a: any, b: any) => a.sequence_position - b.sequence_position)
                .map((touch: any) => {
                  const isSent = touch.status === 'sent';
                  const isFailed = touch.status === 'send_failed';
                  const isSending = touch.status === 'sending';
                  const dateStr = touch.sent_at 
                    ? new Date(touch.sent_at).toLocaleDateString()
                    : new Date(touch.scheduled_for).toLocaleDateString();

                  return (
                    <div key={touch.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
                        isSent ? 'bg-emerald-400' : isFailed ? 'bg-red-400' : isSending ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-700'
                      }`}></span>

                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-zinc-200">
                          Touch {touch.sequence_position} {touch.sequence_position === 1 ? '(1-Hour follow-up)' : `(Day ${(touch.sequence_position - 1) * 14})`}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                          isSent ? 'bg-emerald-500/10 text-emerald-400' : isFailed ? 'bg-red-500/10 text-red-400' : isSending ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {touch.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                        {isSent ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}
                        <span>{isSent ? 'Sent on' : 'Scheduled for'}: {dateStr}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 5. Email Open Analytics */}
        {followups.length > 0 && (
          <div className="glass-panel p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/40 pb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Email Open Analytics
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900/60 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Total Opens</span>
                <span className="text-xl font-black text-white">{context.open_count || 0}</span>
              </div>
              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900/60 text-center flex flex-col justify-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Engagement</span>
                <span className={`text-[11px] font-bold ${context.is_hot ? 'text-rose-400' : 'text-zinc-500'}`}>
                  {context.is_hot ? '🔥 Hot Lead' : (context.open_count > 0 ? 'Active' : 'No activity')}
                </span>
              </div>
            </div>
            
            {/* Open Breakdown */}
            {context.email_opens && Object.keys(context.email_opens).length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Touchpoint Breakdown</span>
                <div className="space-y-1">
                  {Object.entries(context.email_opens).map(([touchNum, count]: [string, any]) => (
                    <div key={touchNum} className="flex justify-between text-[11px] py-1 px-2.5 bg-zinc-900/30 rounded border border-zinc-850">
                      <span className="text-zinc-400">Touchpoint {touchNum === '1' ? '1 (Immediate)' : touchNum}</span>
                      <span className="font-mono font-semibold text-zinc-200">{count} {count === 1 ? 'open' : 'opens'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-zinc-600 text-center pt-1 italic select-none">
                Waiting for the prospect to open the follow-up email.
              </p>
            )}
          </div>
        )}

        {/* 5. Sync Audits */}
        {syncLogs.length > 0 && (
          <div className="glass-panel p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/40 pb-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Sync Audit History
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {syncLogs
                .sort((a: any, b: any) => new Date(b.synced_at).getTime() - new Date(a.synced_at).getTime())
                .map((log: any) => (
                  <div key={log.id} className="flex items-start justify-between text-[11px] p-2 bg-zinc-950/60 rounded border border-zinc-900/60">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-300 capitalize">{log.target_system} Sync</span>
                        <span className={`text-[9px] uppercase px-1 rounded font-bold ${
                          log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      {log.error_message && (
                        <p className="text-[10px] text-red-400 font-mono">{log.error_message}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500">{new Date(log.synced_at).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Editor Modal */}
      {emailDraft && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <FollowupDraftEditor
            leadId={lead.id}
            initialDraft={emailDraft}
            onSuccess={() => {
              setEmailDraft(null);
              onRefresh();
            }}
            onCancel={() => setEmailDraft(null)}
          />
        </div>
      )}
    </div>
    </div>
  );
}
