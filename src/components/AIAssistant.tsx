import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, HelpCircle, User, Bot, AlertTriangle, MessageSquare, ArrowRight } from 'lucide-react';
import { Table, Relationship } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  tables: Table[];
  relationships: Relationship[];
}

export default function AIAssistant({ tables, relationships }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your AI Schema Assistant and Lead Database Architect. I have full real-time awareness of your investment platform ERD (including any custom tables you've built or extensions you've enabled).\n\nAsk me anything! For example:\n- *'How should I structure the transactions table to support daily partitioning on execution date?'*\n- *'Write a PostgreSQL query to calculate the rolling 30-day average transaction size per user.'*\n- *'Critique my index configuration on the holdings table. Am I missing something?'*",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: 'Partition transactions', text: 'How should I partition the transactions table when it reaches 100M rows?' },
    { label: 'Calculate portfolio yields', text: 'Write a postgres query to join assets and holdings to calculate overall dividend yields.' },
    { label: 'Locking strategies', text: 'Explain how row-level locking (SELECT FOR UPDATE) prevents double-spend race conditions in trading engines.' },
  ];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (!textToSend) setInput('');
    setErrorMsg(null);

    const userMessage: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          schemaContext: { tables, relationships },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server responded with an error status.');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message ||
        'Failed to connect to the AI Assistant. Make sure GEMINI_API_KEY is configured in the secrets panel.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[76vh] flex flex-col text-slate-300">
      {/* Description header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          AI Database Architect
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Chat with an expert Database Administrator regarding index optimizations, sharding triggers, high-volume transactions isolation, or custom SQL queries.
        </p>
      </div>

      {/* Main chat boundary */}
      <div className="flex-1 bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isAI = m.role === 'assistant';
            return (
              <div key={idx} className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
                {/* Avatar */}
                {isAI && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`rounded-xl p-4 text-xs max-w-[80%] leading-relaxed space-y-2 select-text border ${
                    isAI
                      ? 'bg-black/30 text-slate-300 border-white/5'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-medium font-sans shadow-md shadow-cyan-500/5'
                  }`}
                >
                  {/* Render content split by codeblocks or items simple styled */}
                  <div className="whitespace-pre-wrap font-sans">
                    {m.content}
                  </div>
                </div>

                {!isAI && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing state */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-xs border border-white/5 flex items-center gap-2 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                <span>Architect is parsing schema...</span>
              </div>
            </div>
          )}

          {/* Error Alert bubble */}
          {errorMsg && (
            <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 flex gap-3 text-xs text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-sans">Connection Blocked</strong>
                <span className="text-slate-400 mt-0.5 block">{errorMsg}</span>
                <span className="text-[10px] bg-black/50 border border-white/10 px-2 py-0.5 rounded font-mono text-slate-400 mt-2 inline-block">
                  Your API key can be found in the Settings &gt; Secrets panel.
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        {messages.length === 1 && (
          <div className="px-4 py-3 border-t border-white/5 bg-black/20 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Suggested Architecture Queries
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="bg-[#05060B]/80 hover:bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 font-medium transition-all flex items-center gap-1.5 hover:text-cyan-400"
                >
                  {p.label}
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="bg-black/40 p-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
            placeholder="Ask your database architect regarding schema critique, transactions triggers, partitioning, sharding, indexes..."
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-cyan-500 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
