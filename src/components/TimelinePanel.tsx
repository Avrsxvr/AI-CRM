import React from 'react';
import { Clock } from 'lucide-react';

interface TimelineEvent {
  title: string;
  timestamp: string;
  icon: string;
  description: string;
  color: string;
}

interface TimelinePanelProps {
  events: TimelineEvent[];
}

export default function TimelinePanel({ events }: TimelinePanelProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 rounded-xl space-y-3">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/40 pb-2">
        <Clock className="w-4 h-4 text-slate-600" />
        Lead Journey Timeline
      </h4>
      <div className="relative border-l border-slate-200 ml-3.5 pl-4 space-y-4">
        {events.map((event, idx) => (
          <div key={idx} className="relative text-xs">
            {/* Timeline icon dot */}
            <span className={`absolute -left-[24.5px] top-0.5 w-5 h-5 rounded-full ${event.color} border border-zinc-950 flex items-center justify-center text-[10px]`}>
              {event.icon}
            </span>
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-zinc-200">{event.title}</span>
              <span className="text-[9px] text-slate-400">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
