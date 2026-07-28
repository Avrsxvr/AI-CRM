'use client';

import React, { useState, useEffect } from 'react';
import LeadList from '@/components/LeadList';
import LeadDetailPanel from '@/components/LeadDetailPanel';
import {
  Sparkles,
  Users,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  LayoutDashboard,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [offlineQueueLength, setOfflineQueueLength] = useState(0);

  interface Activity {
    id: string;
    leadId: string;
    leadName: string;
    company: string;
    type: 'capture' | 'ocr' | 'voice' | 'sync' | 'open';
    timestamp: string;
    details: string;
  }

  const getActivities = (leadsList: any[]): Activity[] => {
    const list: Activity[] = [];
    leadsList.forEach((lead) => {
      const contact = lead.contact_fields || {};
      const name = contact.name || 'Unnamed Prospect';
      const company = contact.company || 'Unknown Company';
      
      if (lead.created_at) {
        list.push({
          id: `${lead.id}-capture`,
          leadId: lead.id,
          leadName: name,
          company,
          type: 'capture',
          timestamp: lead.created_at,
          details: 'Prospect captured'
        });
      }

      const card = lead.card_scans 
        ? (Array.isArray(lead.card_scans) ? lead.card_scans[0] : lead.card_scans) 
        : null;
      if (card && card.image_url) {
        list.push({
          id: `${lead.id}-ocr`,
          leadId: lead.id,
          leadName: name,
          company,
          type: 'ocr',
          timestamp: card.created_at || lead.created_at,
          details: 'Business card scanned'
        });
      }

      const recording = lead.recordings 
        ? (Array.isArray(lead.recordings) ? lead.recordings[0] : lead.recordings) 
        : null;
      if (recording && (recording.audio_url || recording.transcript)) {
        list.push({
          id: `${lead.id}-voice`,
          leadId: lead.id,
          leadName: name,
          company,
          type: 'voice',
          timestamp: recording.created_at || lead.created_at,
          details: 'Conversation transcribed'
        });
      }

      if (lead.status === 'synced' && lead.crm_record_id) {
        list.push({
          id: `${lead.id}-sync`,
          leadId: lead.id,
          leadName: name,
          company,
          type: 'sync',
          timestamp: lead.created_at,
          details: 'Synced to Zoho CRM'
        });
      }

      const context = lead.context_summary || {};
      if (context.open_count > 0) {
        list.push({
          id: `${lead.id}-open`,
          leadId: lead.id,
          leadName: name,
          company,
          type: 'open',
          timestamp: new Date(new Date(lead.created_at).getTime() + 10 * 60 * 1000).toISOString(),
          details: `Follow-up email opened (${context.open_count} views)`
        });
      }
    });

    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads?status=${statusFilter}`);
      if (!response.ok) {
        throw new Error('Failed to load leads from database.');
      }
      const result = await response.json();
      setLeads(result.data || []);
      
      if (selectedLead) {
        const updated = (result.data || []).find((l: any) => l.id === selectedLead.id);
        if (updated) setSelectedLead(updated);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateOfflineCount = () => {
      const queue = localStorage.getItem('exhibition_crm_offline_leads');
      setOfflineQueueLength(queue ? JSON.parse(queue).length : 0);
    };
    
    window.addEventListener('offline-queue-updated', updateOfflineCount);
    window.addEventListener('offline-sync-complete', () => {
      updateOfflineCount();
      fetchLeads();
    });
    
    updateOfflineCount();
    
    return () => {
      window.removeEventListener('offline-queue-updated', updateOfflineCount);
      window.removeEventListener('offline-sync-complete', updateOfflineCount);
    };
  }, []);

  const sentimentCounts = leads.reduce((acc: any, lead) => {
    const sentiment = lead.context_summary?.sentiment || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, { positive: 0, neutral: 0, skeptical: 0, critical: 0 });

  const totalLeads = leads.length;
  const syncedCount = leads.filter((l) => l.status === 'synced').length;
  const alertCount = leads.filter((l) => l.status === 'needs_attention').length;

  const filteredLeads = leads.filter((lead) => {
    const contact = lead.contact_fields || {};
    const name = (contact.name || '').toLowerCase();
    const company = (contact.company || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || company.includes(query);
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center neon-glow-primary">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide block leading-none mb-1 text-sm sm:text-base">AI CRM Hub</span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase hidden sm:block">Exhibition Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={fetchLeads}
              className="p-2 sm:p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all group"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-indigo-400 transition-colors ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <Link
              href="/capture"
              className="py-2 px-3 sm:py-2.5 sm:px-5 rounded-xl bg-white hover:bg-zinc-200 font-bold text-xs sm:text-sm text-black flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-white/10 hover:scale-[1.02] transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Capture<span className="hidden sm:inline"> Lead</span></span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8 z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-7 h-7 text-indigo-500" />
              Campaign Overview
            </h1>
            <p className="text-sm text-zinc-400 mt-2">Monitor all lead processing, extraction status, and automated CRM syncs.</p>
          </div>
          
          {/* Status Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full backdrop-blur-md whitespace-nowrap scrollbar-none">
            {['all', 'synced', 'needs_attention', 'capturing'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
                  statusFilter === tab
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                {tab === 'needs_attention' ? 'Alerts' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          <div className="glass-panel p-3 md:p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center gap-2 md:gap-5 border border-indigo-500/10 bg-indigo-950/10 group hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform neon-glow-primary">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="space-y-0.5 md:space-y-1 text-center md:text-left">
              <span className="text-[9px] md:text-xs text-indigo-300 font-bold uppercase tracking-widest opacity-80 block">
                Total<span className="hidden sm:inline"> Leads</span>
              </span>
              <p className="text-lg md:text-3xl font-black text-white leading-none">{totalLeads}</p>
            </div>
          </div>

          <div className="glass-panel p-3 md:p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center gap-2 md:gap-5 border border-teal-500/10 bg-teal-950/10 group hover:border-teal-500/30 transition-all">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform neon-glow-secondary">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="space-y-0.5 md:space-y-1 text-center md:text-left">
              <span className="text-[9px] md:text-xs text-teal-300 font-bold uppercase tracking-widest opacity-80 block">
                Synced<span className="hidden sm:inline"> CRM</span>
              </span>
              <p className="text-lg md:text-3xl font-black text-white leading-none">{syncedCount}</p>
            </div>
          </div>

          <div className="glass-panel p-3 md:p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center gap-2 md:gap-5 border border-red-500/10 bg-red-950/10 group hover:border-red-500/30 transition-all">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform neon-glow-accent">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="space-y-0.5 md:space-y-1 text-center md:text-left">
              <span className="text-[9px] md:text-xs text-red-300 font-bold uppercase tracking-widest opacity-80 block">
                Alerts
              </span>
              <p className="text-lg md:text-3xl font-black text-white leading-none">{alertCount}</p>
            </div>
          </div>
        </div>

        {/* Offline Sync Alert */}
        {offlineQueueLength > 0 && (
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 rounded-3xl text-sm flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="font-semibold">Sync Queue: {offlineQueueLength} lead(s) cached locally waiting for connection.</span>
            </div>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Syncing in background</span>
          </div>
        )}

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Leads List Area (3/4 Width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <div className="relative w-full glass-panel rounded-2xl border-white/10 group focus-within:border-indigo-500/50 transition-colors">
              <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Search leads by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none rounded-2xl pl-12 pr-6 py-4 text-sm text-white placeholder-zinc-600 focus:ring-0 outline-none"
              />
            </div>

            {/* Leads List */}
            {isLoading && leads.length === 0 ? (
              <div className="py-24 text-center glass-panel rounded-3xl border border-white/5">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-medium text-zinc-400">Loading your AI-processed leads...</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-red-950/20 border border-red-500/20 text-red-400 rounded-3xl text-sm font-medium text-center">
                {error}
              </div>
            ) : (
              <LeadList leads={filteredLeads} onSelectLead={setSelectedLead} />
            )}
          </div>

          {/* Right Sidebar: Analytics & Real-time Log (1/4 Width) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Sentiment Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Sentiment Breakdown
              </h4>
              <div className="space-y-3.5">
                {[
                  { name: 'Positive', key: 'positive', color: 'bg-emerald-500', barColor: 'bg-emerald-500/20' },
                  { name: 'Neutral', key: 'neutral', color: 'bg-blue-500', barColor: 'bg-blue-500/20' },
                  { name: 'Skeptical', key: 'skeptical', color: 'bg-amber-500', barColor: 'bg-amber-500/20' },
                  { name: 'Critical', key: 'critical', color: 'bg-rose-500', barColor: 'bg-rose-500/20' }
                ].map((s) => {
                  const count = sentimentCounts[s.key] || 0;
                  const percent = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                  return (
                    <div key={s.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400 font-medium">{s.name}</span>
                        <span className="text-zinc-500 font-mono">{count} ({percent}%)</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full ${s.barColor} overflow-hidden`}>
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Activity Log */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Live Activity Log
              </h4>
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {getActivities(leads).length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center italic select-none py-8">
                    No recent activities recorded.
                  </p>
                ) : (
                  getActivities(leads).map((act) => (
                    <div key={act.id} className="relative pl-4 border-l border-zinc-800 text-[11px] space-y-0.5">
                      {/* Event dot */}
                      <span className={`absolute -left-[4.5px] top-1 w-2 h-2 rounded-full ${
                        act.type === 'capture' ? 'bg-indigo-500' :
                        act.type === 'ocr' ? 'bg-teal-500' :
                        act.type === 'voice' ? 'bg-purple-500' :
                        act.type === 'sync' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                      }`}></span>
                      <div className="flex justify-between text-zinc-300">
                        <span className="font-semibold">{act.leadName}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">{act.details} @ {act.company}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Side drawer detail inspector */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onRefresh={fetchLeads}
        />
      )}
    </div>
  );
}
