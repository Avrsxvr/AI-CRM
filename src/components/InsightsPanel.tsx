import React, { useState, useEffect } from 'react';
import { Sparkles, Edit3, Save, RefreshCw } from 'lucide-react';

interface InsightsPanelProps {
  context: any;
  getSentimentColor: (sentiment: string) => string;
  leadId: string;
  onRefresh: () => void;
}

export default function InsightsPanel({ context, getSentimentColor, leadId, onRefresh }: InsightsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [problem, setProblem] = useState('');
  const [needs, setNeeds] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (context) {
      setProblem(context.problem || '');
      setNeeds(context.needs || '');
    }
  }, [context]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedContext = {
        ...context,
        problem,
        needs
      };
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_summary: updatedContext }),
      });
      if (res.ok) {
        setIsEditing(false);
        onRefresh();
      }
    } catch (e) {
      console.error('Failed to save context:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!context) return null;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 rounded-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-slate-600 animate-pulse" />
          AI Sales Context
        </h4>
        <div className="flex items-center gap-2">
          {context.sentiment && !isEditing && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getSentimentColor(context.sentiment)}`}>
              {context.sentiment} Sentiment
            </span>
          )}
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" title="Edit AI Context">
              <Edit3 className="w-4 h-4" />
            </button>
          ) : (
             <div className="flex items-center gap-1">
                <button onClick={handleSave} disabled={isSaving} className="p-1 rounded hover:bg-slate-50 text-blue-500 hover:text-blue-600 transition-colors" title="Save Context">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
                <button onClick={() => {
                  setIsEditing(false);
                  setProblem(context.problem || '');
                  setNeeds(context.needs || '');
                }} className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" title="Cancel">
                  <span className="text-xs font-bold px-1">Cancel</span>
                </button>
             </div>
          )}
        </div>
      </div>

      <div className="space-y-3.5 text-xs">
        <div className="space-y-1">
          <span className="text-slate-500 font-medium">Stated Problem / Challenge:</span>
          {isEditing ? (
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:border-blue-500 focus:ring-0 outline-none resize-none"
              rows={2}
              placeholder="No specific problem extracted."
            />
          ) : (
            <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-900 font-medium leading-relaxed">
              {context.problem || 'No specific problem extracted.'}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 font-medium">Interest & Requirements:</span>
          {isEditing ? (
            <textarea
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:border-blue-500 focus:ring-0 outline-none resize-none"
              rows={2}
              placeholder="No specific requirements extracted."
            />
          ) : (
            <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-900 font-medium leading-relaxed">
              {context.needs || 'No specific requirements extracted.'}
            </p>
          )}
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
