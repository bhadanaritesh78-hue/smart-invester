import React from 'react';
import { extensionPresets } from '../initialSchema';
import { Table, Relationship } from '../types';
import { Zap, HelpCircle, Check, ArrowRight, Server, Shield, Database, Award } from 'lucide-react';

interface ScalabilityTabProps {
  appliedExtensions: string[];
  toggleExtension: (id: string) => void;
}

export default function ScalabilityTab({ appliedExtensions, toggleExtension }: ScalabilityTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-300 space-y-8">
      {/* Introduction Block */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-cyan-400 animate-bounce" />
          Scalability Architectures & Schema Extensions
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-4xl">
          A production-grade trading platform must easily ingest billions of real-time market quotes and process hundreds of recurring investment cycles (SIPs) without introducing write lock latency. Click the toggles below to dynamically inject high-volume tables and relation strings directly into the main ERD Workspace.
        </p>
      </div>

      {/* Interactive Extensions Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {extensionPresets.map((preset) => {
          const isApplied = appliedExtensions.includes(preset.id);
          return (
            <div
              key={preset.id}
              className={`bg-[#0F111A]/85 backdrop-blur-xl border rounded-xl p-5 flex flex-col justify-between transition-all duration-350 shadow-2xl ${
                isApplied
                  ? 'border-cyan-400 shadow-lg shadow-cyan-400/10 bg-[#0F111A]/95'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded uppercase ${
                    preset.id === 'ext_realtime_ticks' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {preset.id === 'ext_realtime_ticks' ? 'Timeseries Feed' : 'Scheduled Logic'}
                  </span>
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full border cursor-pointer transition-colors duration-200 ${
                    isApplied ? 'bg-cyan-500/20 border-cyan-400' : 'bg-black/40 border-white/10'
                  }`}
                    onClick={() => toggleExtension(preset.id)}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full transition duration-200 ${
                        isApplied ? 'translate-x-5 bg-cyan-400' : 'translate-x-1 bg-slate-500'
                      }`}
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white">{preset.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed min-h-12">
                  {preset.description}
                </p>
              </div>

              <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Injected Objects:</div>
                <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                  {preset.tables.map((t) => (
                    <span key={t.id} className="bg-black/30 px-2 py-1 rounded text-slate-300 border border-white/5">
                      table: {t.name}
                    </span>
                  ))}
                  {preset.relationships.map((r) => (
                    <span key={r.id} className="bg-black/30 px-2 py-1 rounded text-cyan-400 border border-cyan-500/10">
                      link: {r.type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Educational Architectural Guide */}
      <div className="bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-6 shadow-2xl">
        <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
          <Server className="w-5 h-5 text-cyan-400" />
          High-Performance Database Scaling Blueprints
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs leading-relaxed">
          {/* Caching and Sharding */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" />
                1. Microsecond Price Cache (In-Memory Redis Layer)
              </h4>
              <p className="text-slate-400 pl-5">
                Querying the SQL relational database directly for current prices during high-frequency asset dashboard loading introduces extreme read bottlenecks. 
                In a production trading system, use <strong className="text-slate-300">Redis Key-Value storage</strong> to cache active asset prices.
              </p>
              <pre className="bg-black/45 p-3 rounded-lg text-[10px] font-mono pl-5 text-cyan-400 border border-white/5 ml-5 overflow-x-auto leading-normal">
                {"Key: \"asset:price:AAPL\" -> Value: 185.2400 (TTL: 5 seconds)"}
              </pre>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-cyan-400" />
                2. Read-Replica Partitioning (Scale-Out Read Architecture)
              </h4>
              <p className="text-slate-400 pl-5">
                Trading systems are heavily read-skewed (95% reads for viewing watchlists and portfolio totals, 5% writes for trade executions). 
                Route all analytical reporting queries to <strong className="text-slate-300">Read Replicas</strong>, keeping the Master DB instance fully locked for secure double-entry trades (writes).
              </p>
            </div>
          </div>

          {/* Timeseries and SIP workers */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                3. Timeseries Partitioning (Sharding High-Volume Feeds)
              </h4>
              <p className="text-slate-400 pl-5">
                Storing every quote quote-tick inside a single standard table will result in table lock sizes exceeding 100GB. 
                Use timeseries partitioned tables (hypertables) chunked daily on the <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300 font-mono">time</code> column, allowing obsolete historical ticks to be pruned instantly without vacuum overhead.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500" />
                4. Background SIP Cron Job Workers (Systematic Buys)
              </h4>
              <p className="text-slate-400 pl-5">
                To process systematic investment plans, a background cron system runs daily at midnight:
              </p>
              <ol className="list-decimal list-inside pl-5 mt-1 space-y-1 text-slate-400">
                <li>Queries due records: <code className="bg-black/40 px-1 rounded text-slate-350 font-mono">WHERE next_execution_date &lt;= CURRENT_DATE</code></li>
                <li>Batch filters active users with wallet balance greater than the SIP execution amount.</li>
                <li>Fires off buying requests inside isolated serializable transactions.</li>
                <li>Updates scheduled row: <code className="bg-black/40 px-1 rounded text-slate-355 font-mono">next_execution_date = next_execution_date + frequency</code>.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
