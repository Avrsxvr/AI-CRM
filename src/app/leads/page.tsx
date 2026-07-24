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
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
              <span className="font-bold text-white tracking-wide block leading-none mb-1">AI CRM Hub</span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Exhibition Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchLeads}
              className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all group"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 group-hover:text-indigo-400 transition-colors ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <Link
              href="/capture"
              className="py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 font-bold text-sm text-black flex items-center gap-2 shadow-lg shadow-white/10 hover:scale-[1.02] transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Capture Lead
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
          <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit h-fit backdrop-blur-md">
            {['all', 'synced', 'needs_attention', 'capturing'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl flex items-center gap-5 border border-indigo-500/10 bg-indigo-950/10 group hover:border-indigo-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform neon-glow-primary">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest opacity-80">Total Leads</span>
              <p className="text-3xl font-black text-white">{totalLeads}</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex items-center gap-5 border border-teal-500/10 bg-teal-950/10 group hover:border-teal-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform neon-glow-secondary">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-teal-300 font-bold uppercase tracking-widest opacity-80">CRM Synced</span>
              <p className="text-3xl font-black text-white">{syncedCount}</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex items-center gap-5 border border-red-500/10 bg-red-950/10 group hover:border-red-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform neon-glow-accent">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-red-300 font-bold uppercase tracking-widest opacity-80">Failed / Alert</span>
              <p className="text-3xl font-black text-white">{alertCount}</p>
            </div>
          </div>
        </div>

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
