import React from 'react';
import { Database, GitBranch, ShieldCheck, Zap, Code, HelpCircle, Server } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  serverStatus: 'online' | 'checking' | 'offline';
}

export default function Header({ activeTab, setActiveTab, serverStatus }: HeaderProps) {
  const tabs = [
    { id: 'canvas', label: 'Interactive ERD', icon: Database },
    { id: 'sql', label: 'SQL Generator', icon: Code },
    { id: 'normalization', label: '3NF Normalized Analyzer', icon: ShieldCheck },
    { id: 'playground', label: 'Financial SQL Queries', icon: GitBranch },
    { id: 'scalability', label: 'Scalability & Extensions', icon: Zap },
    { id: 'assistant', label: 'AI Schema Assistant', icon: HelpCircle },
  ];

  return (
    <header className="bg-[#05060B]/85 text-white border-b border-white/10 backdrop-blur-md shadow-2xl relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Title & Branding */}
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-cyan-500 p-2 rounded-lg text-slate-950 shadow-lg shadow-cyan-500/30">
                <Database className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  NexusInvest
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded font-mono uppercase tracking-wider">
                    v2.4.0_ERD Standard
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-asset trading engine relational model with SIPs, Dividends, and Timeseries extensions.
                </p>
              </div>
            </div>
          </div>

          {/* Server Status Indicator */}
          <div className="flex items-center gap-4 self-end md:self-center">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-mono">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">AI Architect:</span>
              {serverStatus === 'online' ? (
                <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  ONLINE
                </span>
              ) : serverStatus === 'checking' ? (
                <span className="text-amber-400">CONNECTING...</span>
              ) : (
                <span className="text-rose-400">OFFLINE</span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-white/5 mt-2">
          <nav className="flex flex-wrap gap-1 py-2 overflow-x-auto -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-semibold shadow-md shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
