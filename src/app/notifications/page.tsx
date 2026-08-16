'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Play, X, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsInboxPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleOpenNotification = (notif: any) => {
    setSelectedNotification(notif);
    if (notif.action_data?.draft_subject) setDraftSubject(notif.action_data.draft_subject);
    if (notif.action_data?.draft_body) setDraftBody(notif.action_data.draft_body);
  };

  const handleDismiss = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (selectedNotification?.id === id) setSelectedNotification(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedNotification) return;
    setIsSending(true);
    try {
      await fetch(`/api/leads/${selectedNotification.lead_id}/send-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: draftSubject,
          message: draftBody,
          notificationId: selectedNotification.id
        })
      });
      
      // Update UI
      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
      setSelectedNotification(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 md:pl-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <Bell className="w-8 h-8 text-rose-500" />
              Unified Inbox
            </h1>
            <p className="text-slate-500 mt-2">Manage incoming replies and AI-drafted responses.</p>
          </div>
        </header>

        {isLoading ? (
          <div className="text-center text-slate-400 mt-20">Loading inbox...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl rounded-3xl p-16 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Inbox Zero</h3>
            <p className="text-slate-500">You're all caught up on replies and alerts.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => handleOpenNotification(notif)}
                className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 rounded-2xl border border-slate-200 hover:border-rose-500/30 cursor-pointer transition-all flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-lg">{notif.title}</h4>
                    <span className="text-xs text-slate-400">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{notif.message}</p>
                  
                  {notif.action_data?.sentiment && (
                    <span className="inline-block mt-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-700 border border-slate-200">
                      Sentiment: {notif.action_data.sentiment}
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={(e) => handleDismiss(notif.id, e)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Approval Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={() => setSelectedNotification(null)}></div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl w-full max-w-4xl rounded-3xl border border-rose-500/20 relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 bg-rose-950/20 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                AI Rebuttal Review
              </h2>
              <button onClick={() => setSelectedNotification(null)} className="p-2 text-slate-500 hover:text-slate-900 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Prospect Reply */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Prospect's Reply</h3>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.action_data?.original_reply || 'No reply text available.'}
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>The automated drip campaign for this lead has been paused.</p>
                </div>
              </div>

              {/* Right Column: AI Draft */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">AI Drafted Response</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 ml-1">Subject</label>
                    <input 
                      type="text" 
                      value={draftSubject}
                      onChange={(e) => setDraftSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-rose-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 ml-1">Message</label>
                    <textarea 
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      rows={8}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-rose-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white/40 flex justify-between items-center">
              <button 
                onClick={() => handleDismiss(selectedNotification.id)}
                className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-700 hover:bg-white/10 font-semibold text-sm transition-all"
              >
                Dismiss & Handle Later
              </button>
              
              <button
                onClick={handleSendReply}
                disabled={isSending}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-900 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                {isSending ? 'Sending...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reply & Resolve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
