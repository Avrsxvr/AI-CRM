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
  Sparkles,
  X,
  Link2,
  Search
} from 'lucide-react';
import LeadList from '@/components/LeadList';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import LeadDetailPanel from '@/components/LeadDetailPanel';

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
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  const [isOpenDetailsModalOpen, setIsOpenDetailsModalOpen] = useState<string | boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const fetchCampaignDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}?t=${Date.now()}`, { cache: 'no-store' });
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
      const res = await fetch(`/api/leads?t=${Date.now()}`, { cache: 'no-store' });
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
      setActiveTab('existing'); // reset active tab
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
      const response = await fetch(`/api/campaigns/${campaignId}/leads?lead_id=${leadId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to remove lead');
      }
      await fetchCampaignDetails();
    } catch (err: any) {
      console.error('Error removing lead:', err);
      alert('Error removing lead: ' + err.message);
    }
  };

  if (isLoading && !campaign) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-white p-8 text-center text-red-500">
        <h2 className="text-2xl font-bold mb-4">Error loading campaign</h2>
        <p>{error}</p>
        <Link href="/campaigns" className="text-slate-600 mt-4 block hover:underline">Back to Campaigns</Link>
      </div>
    );
  }

  // Filter out leads that are already in the campaign for the Add Modal
  const existingLeadIds = new Set(campaign.leads?.map((l: any) => l.id) || []);
  const availableLeads = allLeads.filter(l => !existingLeadIds.has(l.id));
  
  const filteredAvailableLeads = availableLeads.filter(l => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = l.contact_fields?.name?.toLowerCase() || '';
    const company = l.contact_fields?.company?.toLowerCase() || '';
    return name.includes(searchLower) || company.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden flex flex-col">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/campaigns" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-bold text-slate-900 tracking-wide block leading-none mb-1 text-sm sm:text-base">
                {campaign.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                Campaign Dashboard
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 z-10 relative space-y-8">
        
        {/* Analytics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 rounded-3xl border border-blue-500/10 bg-white flex items-center gap-5">
             <div className="w-12 h-12 rounded-2xl bg-slate-800/20 text-slate-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-80">Total Leads</span>
              <p className="text-3xl font-black text-slate-900">{campaign.leads?.length || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 rounded-3xl border border-teal-500/10 bg-teal-950/10 flex items-center gap-5">
             <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-teal-300 font-bold uppercase tracking-widest opacity-80">Emails Sent</span>
              <p className="text-3xl font-black text-slate-900">{campaign.analytics?.sent || 0}</p>
            </div>
          </div>

          <button 
            onClick={() => {
              if (campaign.analytics?.opened > 0) {
                setIsOpenDetailsModalOpen(true);
              }
            }}
            disabled={!(campaign.analytics?.opened > 0)}
            className={`bg-white border border-slate-200 shadow-sm rounded-xl p-6 rounded-3xl border flex items-center gap-5 text-left transition-all ${
              campaign.analytics?.opened > 0 
                ? 'border-amber-500/15 bg-amber-950/10 hover:border-amber-500/45 hover:scale-[1.01] cursor-pointer' 
                : 'border-amber-500/5 bg-amber-950/5 opacity-60 cursor-not-allowed'
            }`}
          >
             <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-amber-300 font-bold uppercase tracking-widest opacity-80 block">Emails Opened</span>
              <p className="text-3xl font-black text-slate-900 leading-none mt-1">{campaign.analytics?.opened || 0}</p>
            </div>
          </button>
        </div>

        <AnalyticsPanel campaignId={campaignId} />

        {/* Lead Management Section */}
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
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
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
            <Users className="w-10 h-10 text-zinc-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No leads in this campaign</h3>
            <p className="text-sm text-slate-500">Add some leads from your main list to start engaging with them.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl rounded-3xl border border-slate-200 p-2">
            {campaign.leads?.map((lead: any, index: number) => (
              <div 
                key={lead.id || index} 
                className="p-4 flex items-center justify-between border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors rounded-2xl group cursor-pointer"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                    {lead.contact_fields?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{lead.contact_fields?.name || 'Unknown Prospect'}</h4>
                    <p className="text-xs text-slate-400">{lead.contact_fields?.email || 'No email'}</p>
                  </div>
                </div>
                
                {/* Views / Opens / Clicks counter */}
                <div className="flex-1 flex justify-center gap-3">
                  {(lead.zoho_analytics?.opens > 0 || (lead.context_summary?.open_count ?? 0) > 0) && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsOpenDetailsModalOpen(lead.id); }}
                      className="flex items-center gap-1.5 text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white/10 hover:border-amber-500/30 hover:text-amber-400 transition-all cursor-pointer" 
                      title="View Email opens"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{lead.zoho_analytics?.opens || lead.context_summary?.open_count}</span>
                    </button>
                  )}
                  {lead.zoho_analytics?.clicks > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsOpenDetailsModalOpen(lead.id); }}
                      className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer" 
                      title="View Links clicked"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{lead.zoho_analytics.clicks}</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => { e.stopPropagation(); removeLeadFromCampaign(lead.id); }}
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
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" onClick={() => setIsAddLeadModalOpen(false)}></div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl w-full max-w-2xl rounded-3xl border border-slate-200 relative z-10 overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white/40">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-slate-600" />
                Add Leads to {campaign.name}
              </h3>
              <button onClick={() => setIsAddLeadModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-200 bg-white/20">
              <button 
                onClick={() => setActiveTab('existing')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 text-center ${
                  activeTab === 'existing' 
                    ? 'text-slate-600 border-blue-500 bg-slate-800/5' 
                    : 'text-slate-400 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Choose Existing
              </button>
              <button 
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 text-center ${
                  activeTab === 'new' 
                    ? 'text-slate-600 border-blue-500 bg-slate-800/5' 
                    : 'text-slate-400 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Capture New Lead
              </button>
            </div>
            
            {activeTab === 'existing' ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-white/40">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search leads by name or company..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/40 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                  {filteredAvailableLeads.length === 0 ? (
                     <p className="text-center text-slate-400 py-10">
                       {searchTerm ? 'No leads match your search.' : 'All your existing leads are already in this campaign!'}
                     </p>
                  ) : (
                    filteredAvailableLeads.map((lead: any) => {
                      const isSelected = selectedLeadIds.has(lead.id);
                      return (
                        <div 
                          key={lead.id} 
                          onClick={() => toggleLeadSelection(lead.id)}
                          className={`p-4 flex items-center gap-4 rounded-2xl cursor-pointer border transition-all ${
                            isSelected 
                              ? 'bg-slate-800/10 border-blue-500/50' 
                              : 'bg-white/40 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-slate-800 border-blue-500 text-slate-900' : 'border-zinc-600 bg-transparent'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{lead.contact_fields?.name || 'Unknown Prospect'}</h4>
                            <p className="text-xs text-slate-400">{lead.contact_fields?.company || 'No company'}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-white/40 flex justify-between items-center">
                  <span className="text-sm text-slate-500">{selectedLeadIds.size} selected</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddLeadModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddLeads}
                      disabled={isAdding || selectedLeadIds.size === 0}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-slate-800 text-slate-900 font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isAdding ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : null}
                      Add {selectedLeadIds.size > 0 ? selectedLeadIds.size : ''} Leads
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/10 flex items-center justify-center border border-blue-500/20 text-slate-600 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-slate-900">AI Capture Workstation</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Launch the voice transcriber and card scanner. Any lead you capture here will be automatically linked to this campaign.
                  </p>
                </div>
                <Link
                  href={`/capture?campaignId=${campaignId}`}
                  className="px-6 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-sm transition-all shadow-lg hover:scale-[1.02] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Launch Workstation
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Open Details Drawer */}
      {isOpenDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpenDetailsModalOpen(false)}></div>
          <div className="w-full max-w-md h-full bg-white border-l border-slate-200 relative z-10 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white/40 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                Email Engagement
              </h3>
              <button onClick={() => setIsOpenDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {(() => {
                const isGlobal = isOpenDetailsModalOpen === true;
                const targetLead = isGlobal ? null : campaign.leads?.find((l: any) => l.id === isOpenDetailsModalOpen);
                
                // If it's a specific lead with Zoho Analytics
                if (targetLead && targetLead.zoho_analytics) {
                  const z = targetLead.zoho_analytics;
                  return (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-800/10 border border-blue-500/20">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{targetLead.contact_fields?.name}</h4>
                        <p className="text-xs text-slate-500">{targetLead.contact_fields?.email}</p>
                      </div>

                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2">Opens ({z.opens})</h4>
                      {z.openDetails?.length > 0 ? z.openDetails.map((open: any, i: number) => (
                        <div key={`open-${i}`} className="p-3 rounded-xl bg-white/5 border border-slate-200 flex justify-between items-center">
                          <span className="text-xs text-slate-700">Viewed Email</span>
                          <span className="text-xs font-bold text-amber-400">
                            {new Date(open.open_time || open.activity_time).toLocaleString()}
                          </span>
                        </div>
                      )) : <p className="text-xs text-zinc-600">No detailed open timestamps.</p>}

                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2">Link/Attachment Clicks ({z.clicks})</h4>
                      {z.clickDetails?.length > 0 ? z.clickDetails.map((click: any, i: number) => (
                        <div key={`click-${i}`} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-emerald-400 break-all pr-4">{click.clicked_url || click.link_name || 'Attachment/Link'}</span>
                            <span className="text-xs font-bold text-emerald-500 whitespace-nowrap">
                              {new Date(click.click_time || click.activity_time).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )) : <p className="text-xs text-zinc-600">No clicks recorded.</p>}
                    </div>
                  );
                }

                // Fallback to Global / Local DB Open Details
                const openDetails = campaign.analytics?.openDetails || [];
                if (openDetails.length === 0) {
                  return <p className="text-center text-slate-400 py-10">No engagement tracked yet.</p>;
                }

                return openDetails.map((detail: any, index: number) => (
                  <div key={index} className="p-4 rounded-2xl bg-white/5 border border-slate-200 flex flex-col gap-3 hover:bg-white/10 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-slate-900 text-sm">{detail.leadName}</h4>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">
                          {detail.leadCompany}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{detail.leadEmail}</p>
                      
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-white/40 px-3 py-2 rounded-lg border border-slate-200">
                        <span className="font-mono text-slate-600 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                          Touch #{detail.sequencePosition}
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className="truncate italic">
                          "{detail.subject}"
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-mono">Opened At</span>
                      <span className="text-xs font-bold text-amber-400">
                        {new Date(detail.openedAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="p-6 border-t border-slate-200 bg-white/40 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpenDetailsModalOpen(false)}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <LeadDetailPanel 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onRefresh={fetchCampaignDetails} 
        />
      )}
    </div>
  );
}
