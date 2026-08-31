'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Megaphone, 
  Plus, 
  Users, 
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  Search,
  X,
  RefreshCw,
  Edit2,
  Trash2,
  MoreVertical,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const [createError, setCreateError] = useState<string | null>(null);

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const url = editingCampaignId ? `/api/campaigns/${editingCampaignId}` : '/api/campaigns';
      const method = editingCampaignId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCampaignName, description: newCampaignDesc }),
      });
      const data = await res.json();
      
      if (data.error) {
        setCreateError(data.error.message || 'Failed to save campaign');
      } else if (data.data) {
        addToast('success', editingCampaignId ? 'Campaign updated' : 'Campaign created');
        if (editingCampaignId) {
          setCampaigns(campaigns.map(c => c.id === editingCampaignId ? { ...c, name: newCampaignName, description: newCampaignDesc } : c));
        } else {
          setCampaigns([data.data, ...campaigns]);
        }
        setIsModalOpen(false);
        setNewCampaignName('');
        setNewCampaignDesc('');
        setEditingCampaignId(null);
      }
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'A network error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCampaign = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(null);
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      setCampaigns(campaigns.filter(c => c.id !== id));
      addToast('success', 'Campaign deleted successfully');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete campaign');
    }
  };

  const handleToggleStatus = async (campaign: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(null);
    
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c));
      addToast('success', `Campaign ${newStatus}`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update status');
    }
  };

  const openEditModal = (campaign: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(null);
    setEditingCampaignId(campaign.id);
    setNewCampaignName(campaign.name);
    setNewCampaignDesc(campaign.description || '');
    setIsModalOpen(true);
  };

  const filteredCampaigns = campaigns.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background gradients */}
      <nav className="border-b border-slate-200 bg-white/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/leads" className="w-10 h-10 rounded-xl bg-white/5 border border-slate-200 flex items-center justify-center hover:bg-white/10 hover:border-slate-300 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
            </Link>
            <div>
              <span className="font-bold text-slate-900 tracking-wide block leading-none mb-1 text-sm sm:text-base">Campaigns</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase hidden sm:block">Marketing Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             <Link
              href="/leads"
              className="py-2 px-3 sm:py-2.5 sm:px-5 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">All Leads</span>
            </Link>
            <button 
              onClick={() => {
                setEditingCampaignId(null);
                setNewCampaignName('');
                setNewCampaignDesc('');
                setIsModalOpen(true);
              }}
              className="py-2 px-3 sm:py-2.5 sm:px-5 rounded-xl bg-white hover:bg-zinc-200 font-bold text-xs sm:text-sm text-black flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-white/10 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>New<span className="hidden sm:inline"> Campaign</span></span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 z-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Your Campaigns
            </h1>
            <p className="text-sm text-slate-500 mt-2">Organize your leads and track performance per exhibition.</p>
          </div>
          
          <div className="relative w-full md:w-72 bg-white border border-slate-200 shadow-sm rounded-xl rounded-xl border-slate-200 group focus-within:border-blue-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-slate-600 transition-colors" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-zinc-600 focus:ring-0 outline-none"
            />
          </div>
        </div>

        {/* Campaign Grid / Empty State */}
        {isLoading && campaigns.length === 0 ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredCampaigns.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id}>
                <Link href={`/campaigns/${campaign.id}`} className="block h-full">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl transition-all hover:shadow-md p-6 rounded-3xl group cursor-pointer h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4 relative">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <LayoutDashboard className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        {campaign.status === 'paused' && (
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Paused</span>
                        )}
                        <span className="px-3 py-1 bg-white/5 border border-slate-200 rounded-full text-[10px] font-medium text-slate-500 font-mono">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                        
                        {/* Context Menu Trigger */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMenu(activeMenu === campaign.id ? null : campaign.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative z-20"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenu === campaign.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenu(null); }}></div>
                            <div className="absolute right-0 top-8 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
                              <button
                                onClick={(e) => handleToggleStatus(campaign, e)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {campaign.status === 'active' ? 'Pause' : 'Resume'}
                              </button>
                              <button
                                onClick={(e) => openEditModal(campaign, e)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button
                                onClick={(e) => handleDeleteCampaign(campaign.id, e)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-600 transition-colors">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1">
                      {campaign.description || "No description provided."}
                    </p>
                    
                    <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-2 text-sm text-slate-500">
                      <div className="flex items-center justify-between bg-white/40 rounded-lg px-3 py-2 border border-slate-200">
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Leads</span>
                        <span className="font-bold text-slate-900">{campaign.lead_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-800/10 rounded-lg px-3 py-2 border border-blue-500/10">
                        <span className="flex items-center gap-1.5 text-slate-600">🔥 Hot</span>
                        <span className="font-bold text-slate-900">{campaign.hot_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/40 rounded-lg px-3 py-2 border border-slate-200">
                        <span className="flex items-center gap-1.5 text-slate-500">Sent</span>
                        <span className="font-bold text-slate-900">{campaign.emails_sent || 0}</span>
                      </div>
                      <div className="flex items-center justify-between bg-teal-500/10 rounded-lg px-3 py-2 border border-teal-500/10">
                        <span className="flex items-center gap-1.5 text-teal-400">Opened</span>
                        <span className="font-bold text-slate-900">{campaign.opened_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl w-full max-w-md rounded-3xl border border-slate-200 relative z-10 overflow-hidden shadow-2xl shadow-indigo-500/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-slate-600" />
                {editingCampaignId ? 'Edit Campaign' : 'New Campaign'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g. CES 2026 Follow-ups"
                  className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-zinc-600 focus:border-blue-500/50 focus:ring-0 outline-none"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description (Optional)</label>
                <textarea
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  placeholder="Briefly describe the goal of this campaign..."
                  rows={3}
                  className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-zinc-600 focus:border-blue-500/50 focus:ring-0 outline-none resize-none"
                />
              </div>

              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
                  {createError}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCreateError(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newCampaignName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : null}
                  {editingCampaignId ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
