'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Megaphone, 
  Plus, 
  Users, 
  ArrowRight,
  LayoutDashboard,
  Search,
  X
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCampaignName, description: newCampaignDesc }),
      });
      const data = await res.json();
      if (data.data) {
        setCampaigns([data.data, ...campaigns]);
        setIsModalOpen(false);
        setNewCampaignName('');
        setNewCampaignDesc('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans relative overflow-hidden flex flex-col">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center neon-glow-primary">
              <Megaphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide block leading-none mb-1 text-sm sm:text-base">Campaigns</span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase hidden sm:block">Marketing Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             <Link
              href="/leads"
              className="py-2 px-3 sm:py-2.5 sm:px-5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">All Leads</span>
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
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
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              Your Campaigns
            </h1>
            <p className="text-sm text-zinc-400 mt-2">Organize your leads and track performance per exhibition.</p>
          </div>
          
          <div className="relative w-full md:w-72 glass-panel rounded-xl border-white/10 group focus-within:border-indigo-500/50 transition-colors">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:ring-0 outline-none"
            />
          </div>
        </div>

        {isLoading ? (
           <div className="flex justify-center items-center py-32">
             <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="glass-panel border-white/5 rounded-3xl p-12 text-center flex flex-col items-center max-w-lg mx-auto mt-12">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6">
              <Megaphone className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No campaigns found</h3>
            <p className="text-sm text-zinc-400 mb-8">Create your first marketing campaign to start organizing leads and tracking outreach.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Link href={`/campaigns/${campaign.id}`} key={campaign.id}>
                <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 group transition-all cursor-pointer h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LayoutDashboard className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-zinc-300">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-6 flex-1">
                    {campaign.description || "No description provided."}
                  </p>
                  
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-bold text-white">{campaign.lead_count || 0} Leads</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-zinc-400 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 relative z-10 overflow-hidden shadow-2xl shadow-indigo-500/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" />
                New Campaign
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g. CES 2026 Follow-ups"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-0 outline-none"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description (Optional)</label>
                <textarea
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  placeholder="Briefly describe the goal of this campaign..."
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-0 outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 font-semibold text-sm transition-all"
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
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
