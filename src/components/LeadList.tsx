'use client';

import React from 'react';
import { Calendar, User, Building, ChevronRight, Mail, AlertTriangle } from 'lucide-react';
import LeadStatusBadge from './LeadStatusBadge';

interface LeadListProps {
  leads: any[];
  onSelectLead: (lead: any) => void;
}

export default function LeadList({ leads, onSelectLead }: LeadListProps) {
  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-12 glass-panel rounded-2xl p-6">
        <AlertTriangle className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-zinc-300">No leads captured yet</h4>
        <p className="text-xs text-zinc-500 mt-1">
          Start capturing leads by visiting the capture interface on your mobile browser.
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full space-y-3">
      {/* Desktop Table view (hidden on mobile) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-white/5 bg-black/40 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-black/40">
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Company</th>
              <th className="py-3.5 px-4">Title</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Captured At</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {leads.map((lead) => {
              const contact = lead.contact_fields || {};
              return (
                <tr 
                  key={lead.id} 
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{contact.name || 'Unnamed Lead'}</span>
                      {lead.context_summary?.is_hot && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)] select-none animate-pulse">
                          🔥 Hot
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {contact.email && (
                        <span className="text-[10px] text-zinc-500">{contact.email}</span>
                      )}
                      {lead.followups?.length > 0 && (
                        <>
                          {contact.email && <span className="text-[10px] text-zinc-700 select-none">•</span>}
                          <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-950/60 border border-zinc-850 px-1.5 py-0.5 rounded flex items-center gap-1 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            👁️ {lead.context_summary?.open_count || 0} views
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300 font-medium">{contact.company || 'Unknown'}</td>
                  <td className="py-3.5 px-4 text-zinc-400">{contact.title || 'Not Specified'}</td>
                  <td className="py-3.5 px-4">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {formatDate(lead.created_at)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="p-1 rounded-md text-zinc-400 hover:text-indigo-400 transition-colors">
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card view (hidden on desktop) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {leads.map((lead) => {
          const contact = lead.contact_fields || {};
          return (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className="p-5 rounded-2xl bg-black/40 border border-white/5 shadow-xl space-y-4 cursor-pointer hover:border-indigo-500/30 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>{contact.name || 'Unnamed Lead'}</span>
                    {lead.context_summary?.is_hot && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)] select-none animate-pulse">
                        🔥 Hot
                      </span>
                    )}
                  </h4>
                  {contact.title && (
                    <p className="text-xs text-zinc-400">{contact.title}</p>
                  )}
                  {lead.followups?.length > 0 && (
                    <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-950/60 border border-zinc-850 px-1.5 py-0.5 rounded flex items-center gap-1 select-none w-max mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      👁️ {lead.context_summary?.open_count || 0} views
                    </span>
                  )}
                </div>
                <LeadStatusBadge status={lead.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="truncate">{contact.company || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
