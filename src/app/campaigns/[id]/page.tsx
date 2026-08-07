'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Megaphone,
  ArrowLeft,
  Users,
  Mail,
  Eye,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  X
} from 'lucide-react';
import LeadList from '@/components/LeadList';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const campaignId = resolvedParams.id;
  
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for adding existing leads to this campaign
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const fetchCampaignDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setCampaign(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setAllLeads(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaignDetails();
  }, [campaignId]);

  useEffect(() => {
    if (isAddLeadModalOpen) {
      fetchAllLeads();
      setSelectedLeadIds(new Set()); // reset selection
    }
  }, [isAddLeadModalOpen]);

  const toggleLeadSelection = (id: string) => {
    const newSet = new Set(selectedLeadIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeadIds(newSet);
  };

  const handleAddLeads = async () => {
    if (selectedLeadIds.size === 0) return;
    setIsAdding(true);
    try {
      // Add leads sequentially for simplicity in this phase
      for (const leadId of Array.from(selectedLeadIds)) {
        await fetch(`/api/campaigns/${campaignId}/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: leadId })
        });
      }
      setIsAddLeadModalOpen(false);
      await fetchCampaignDetails(); // refresh dashboard
    } catch (err) {
      console.error('Error adding leads:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const removeLeadFromCampaign = async (leadId: string) => {
    if (!confirm('Remove this lead from the campaign?')) return;
    try {
      await fetch(`/api/campaigns/${campaignId}/leads?lead_id=${leadId}`, {
        method: 'DELETE'
      });
      await fetchCampaignDetails();
    } catch (err) {
      console.error('Error removing lead:', err);
    }
  };

  if (isLoading && !campaign) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-black p-8 text-center text-red-500">
        <h2 className="text-2xl font-bold mb-4">Error loading campaign</h2>
        <p>{error}</p>
        <Link href="/campaigns" className="text-indigo-400 mt-4 block hover:underline">Back to Campaigns</Link>
      </div>
    );
  }

  // Filter out leads that are already in the campaign for the Add Modal
  const existingLeadIds = new Set(campaign.leads?.map((l: any) => l.id) || []);
  const availableLeads = allLeads.filter(l => !existingLeadIds.has(l.id));

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans relative overflow-hidden flex flex-col">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/campaigns" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-bold text-white tracking-wide block leading-none mb-1 text-sm sm:text-base">
                {campaign.name}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Campaign Dashboard
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 z-10 relative space-y-8">
        
        {/* Analytics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/10 bg-indigo-950/10 flex items-center gap-5">
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest opacity-80">Total Leads</span>
              <p className="text-3xl font-black text-white">{campaign.leads?.length || 0}</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-teal-500/10 bg-teal-950/10 flex items-center gap-5">
             <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-teal-300 font-bold uppercase tracking-widest opacity-80">Emails Sent</span>
              <p className="text-3xl font-black text-white">{campaign.analytics?.sent || 0}</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-amber-500/10 bg-amber-950/10 flex items-center gap-5">
             <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-amber-300 font-bold uppercase tracking-widest opacity-80">Emails Opened</span>
              <p className="text-3xl font-black text-white">{campaign.analytics?.opened || 0}</p>
            </div>
          </div>
        </div>

        {/* Lead Management Section */}
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Campaign Leads
          </h2>
          <div className="flex gap-3">
             <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-white/10"
            >
              <Plus className="w-4 h-4" />
              Add Leads
            </button>
          </div>
        </div>

        {/* Lead List specific to campaign */}
        {campaign.leads?.length === 0 ? (
          <div className="glass-panel border-white/5 rounded-3xl p-12 text-center flex flex-col items-center">
            <Users className="w-10 h-10 text-zinc-600 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No leads in this campaign</h3>
            <p className="text-sm text-zinc-400">Add some leads from your main list to start engaging with them.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl border border-white/5 p-2">
            {campaign.leads?.map((lead: any) => (
              <div key={lead.id} className="p-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-2xl group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-sm">
                    {lead.contact_fields?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{lead.contact_fields?.name || 'Unknown Prospect'}</h4>
                    <p className="text-xs text-zinc-500">{lead.contact_fields?.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => removeLeadFromCampaign(lead.id)}
                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                    title="Remove from campaign"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Leads Modal */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddLeadModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/10 relative z-10 overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add Leads to {campaign.name}
              </h3>
              <button onClick={() => setIsAddLeadModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
              {availableLeads.length === 0 ? (
                 <p className="text-center text-zinc-500 py-10">All your existing leads are already in this campaign!</p>
              ) : (
                availableLeads.map((lead: any) => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  return (
                    <div 
                      key={lead.id} 
                      onClick={() => toggleLeadSelection(lead.id)}
                      className={`p-4 flex items-center gap-4 rounded-2xl cursor-pointer border transition-all ${
                        isSelected 
                          ? 'bg-indigo-500/10 border-indigo-500/50' 
                          : 'bg-black/40 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-zinc-600 bg-transparent'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{lead.contact_fields?.name || 'Unknown Prospect'}</h4>
                        <p className="text-xs text-zinc-500">{lead.contact_fields?.company || 'No company'}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center">
              <span className="text-sm text-zinc-400">{selectedLeadIds.size} selected</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLeads}
                  disabled={isAdding || selectedLeadIds.size === 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isAdding ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : null}
                  Add {selectedLeadIds.size > 0 ? selectedLeadIds.size : ''} Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
