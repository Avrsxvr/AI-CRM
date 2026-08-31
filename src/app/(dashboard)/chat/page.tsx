'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your AI CRM Assistant. I can help you analyze your leads, summarize campaigns, or even search the web to research potential targets. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message immediately
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsStreaming(true);

    // Pre-add the AI response bubble (typing indicator)
    setMessages((prev) => [...prev, { role: 'model', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        let errMsg = 'Failed to communicate with AI';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let aiResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        
        // Artificial micro-chunking to make the stream look smooth and fast
        // instead of flashing massive blocks of text at once.
        const words = chunkText.split(/(\s+)/);
        for (const word of words) {
          aiResponse += word;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', content: aiResponse };
            return updated;
          });
          // Micro delay to simulate smooth typing stream
          await new Promise(r => setTimeout(r, 10));
        }
      }

      // If we got an empty response, show a fallback
      if (!aiResponse.trim()) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: 'I received an empty response. Please try again.' };
          return updated;
        });
      }
    } catch (err: any) {
      console.error('[Chat UI]', err);
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      // Replace the empty typing bubble with the error message inline
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'model' && last.content === '') {
          updated[updated.length - 1] = { role: 'model', content: `⚠️ **Error:** ${errorMessage}` };
        } else {
          updated.push({ role: 'model', content: `⚠️ **Error:** ${errorMessage}` });
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-screen bg-slate-50/50 rounded-3xl border border-slate-200 shadow-sm overflow-hidden m-4">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-slate-200 bg-white shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight">AI CRM Assistant</h1>
            <p className="text-xs text-slate-500 font-medium">Powered by Gemini + Google Search Grounding</p>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div 
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
              }`}
            >
              {msg.role === 'model' ? (
                <div className="prose prose-sm prose-slate max-w-none">
                  {msg.content === '' ? (
                    <div className="flex items-center gap-1 h-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"></div>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me to research a company or analyze your leads..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none min-h-[56px] max-h-32"
            rows={1}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
          >
            {isStreaming ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
          AI CRM Assistant uses live Google Search Grounding to find accurate, real-world data.
        </p>
      </div>
    </div>
  );
}
