'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Ban, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchFollowups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/followups');
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setFollowups(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load follow-ups.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleCancelFollowup = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled follow-up?')) return;
    try {
      const res = await fetch(`/api/followups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      addToast('success', 'Follow-up cancelled.');
      setFollowups(prev => prev.map(f => f.id === id ? { ...f, status: 'cancelled' } : f));
    } catch (err: any) {
      addToast('error', err.message || 'Failed to cancel follow-up');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'sent':
        return <span className="flex items-center gap-1 px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> Sent</span>;
      case 'scheduled':
        return <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase"><Clock className="w-3 h-3" /> Scheduled</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase"><Ban className="w-3 h-3" /> Cancelled</span>;
      case 'failed':
        return <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase"><XCircle className="w-3 h-3" /> Failed</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Mail className="w-8 h-8 text-indigo-600" />
              Follow-ups Schedule
            </h1>
            <p className="text-slate-500 mt-2">Manage automated email sequences and scheduled communications.</p>
          </div>
          <button 
            onClick={fetchFollowups}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Campaign</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Scheduled For</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-300" />
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : followups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Mail className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p>No follow-ups found.</p>
                    </td>
                  </tr>
                ) : (
                  followups.map((f: any) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{f.lead?.contact_fields?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{f.lead?.contact_fields?.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">{f.lead?.campaigns?.name || 'No Campaign'}</div>
                        <div className="text-xs text-slate-400 font-mono">Touch #{f.sequence_position || 1}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-[200px] truncate" title={f.subject}>
                        {f.subject || '(No Subject)'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(f.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(f.scheduled_for).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {f.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelFollowup(f.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs rounded-lg transition-colors border border-red-200"
                          >
                            Cancel
                          </button>
                        )}
                        {f.status === 'sent' && f.opened && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-200">Opened</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
