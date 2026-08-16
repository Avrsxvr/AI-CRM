import React from 'react';
import { Sparkles } from 'lucide-react';

interface InsightsPanelProps {
  context: any;
  getSentimentColor: (sentiment: string) => string;
}

export default function InsightsPanel({ context, getSentimentColor }: InsightsPanelProps) {
  if (!context) return null;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 rounded-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-slate-600 animate-pulse" />
          AI Sales Context
        </h4>
        {context.sentiment && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getSentimentColor(context.sentiment)}`}>
            {context.sentiment} Sentiment
          </span>
        )}
      </div>

      <div className="space-y-3.5 text-xs">
        <div className="space-y-1">
          <span className="text-slate-500 font-medium">Stated Problem / Challenge:</span>
          <p className="bg-white/60 p-2.5 rounded-lg border border-zinc-900/60 text-zinc-200 leading-relaxed">
            {context.problem || 'No specific problem extracted.'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 font-medium">Interest & Requirements:</span>
          <p className="bg-white/60 p-2.5 rounded-lg border border-zinc-900/60 text-zinc-200 leading-relaxed">
            {context.needs || 'No specific requirements extracted.'}
          </p>
        </div>

        {context.action_items && context.action_items.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-slate-500 font-medium">Agreed Action Items:</span>
            <ul className="space-y-1.5">
              {context.action_items.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="w-4 h-4 rounded border border-blue-500/20 bg-slate-800/5 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {context.notable_quotes && context.notable_quotes.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-slate-500 font-medium">Key Quotes:</span>
            <div className="space-y-2">
              {context.notable_quotes.map((quote: string, idx: number) => (
                <p key={idx} className="border-l-2 border-blue-500/40 pl-3 italic text-slate-500 leading-relaxed">
                  "{quote}"
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
