import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ERDCanvas from './components/ERDCanvas';
import Inspector from './components/Inspector';
import SQLGenerator from './components/SQLGenerator';
import ThreeNFChecker from './components/ThreeNFChecker';
import SQLPlayground from './components/SQLPlayground';
import ScalabilityTab from './components/ScalabilityTab';
import AIAssistant from './components/AIAssistant';

import { initialTables, initialRelationships, extensionPresets } from './initialSchema';
import { Table, Relationship } from './types';
import { Search, Database, Layers, ShieldAlert, Award } from 'lucide-react';

export default function App() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [relationships, setRelationships] = useState<Relationship[]>(initialRelationships);
  const [selectedTableId, setSelectedTableId] = useState<string | null>('users');
  const [appliedExtensions, setAppliedExtensions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'canvas' | 'sql' | 'normalization' | 'playground' | 'scalability' | 'assistant'>('canvas');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState<'online' | 'checking' | 'offline'>('checking');

  // Check backend server status on boot
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkServer();
  }, []);

  // Handles adding/removing scalable extension tables to the main visual state
  const toggleExtension = (id: string) => {
    const isApplied = appliedExtensions.includes(id);
    const preset = extensionPresets.find((p) => p.id === id);
    if (!preset) return;

    if (isApplied) {
      // Remove extension tables & connections
      setAppliedExtensions((prev) => prev.filter((x) => x !== id));
      setTables((prev) => prev.filter((t) => !preset.tables.some((pt) => pt.id === t.id)));
      setRelationships((prev) => prev.filter((r) => !preset.relationships.some((pr) => pr.id === r.id)));
      if (preset.tables.some((pt) => pt.id === selectedTableId)) {
        setSelectedTableId('users'); // Reset select to a safe core table
      }
    } else {
      // Inject extension tables & connections
      setAppliedExtensions((prev) => [...prev, id]);
      setTables((prev) => {
        const filteredPresetTables = preset.tables.filter((pt) => !prev.some((t) => t.id === pt.id));
        return [...prev, ...filteredPresetTables];
      });
      setRelationships((prev) => {
        const filteredPresetRels = preset.relationships.filter((pr) => !prev.some((r) => r.id === pr.id));
        return [...prev, ...filteredPresetRels];
      });
      // Set focus to the primary injected table for helpful guidance
      if (preset.tables.length > 0) {
        setSelectedTableId(preset.tables[0].id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#05060B] text-slate-300 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col relative overflow-hidden">
      {/* Atmospheric Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/15 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/15 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Top Header Block */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverStatus={serverStatus}
      />

      {/* Main tab switch container */}
      <main className="flex-1 flex flex-col min-h-0 z-10">
        {activeTab === 'canvas' && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-h-0 gap-5">
            {/* Top Toolbar */}
            <div className="bg-[#0F111A]/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0 shadow-2xl">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/5 p-1.5 rounded text-cyan-400 border border-white/5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-tight">Interactive ERD Workspace</h3>
                  <p className="text-[10px] text-slate-400">Drag table headers to arrange, double-click rows or click inspector to edit parameters.</p>
                </div>
              </div>

              {/* Live search input */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter tables/columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#05060B]/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Split Visual Canvas + Inspector */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
              {/* Left Canvas (2/3 columns) */}
              <div className="lg:col-span-2 flex flex-col min-h-0">
                <ERDCanvas
                  tables={tables}
                  relationships={relationships}
                  setTables={setTables}
                  selectedTableId={selectedTableId}
                  setSelectedTableId={setSelectedTableId}
                  searchTerm={searchTerm}
                />
              </div>

              {/* Right Sidebar Inspector (1/3 column) */}
              <div className="flex flex-col min-h-0">
                <Inspector
                  tableId={selectedTableId}
                  tables={tables}
                  relationships={relationships}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <SQLGenerator
            tables={tables}
            relationships={relationships}
          />
        )}

        {activeTab === 'normalization' && <ThreeNFChecker />}

        {activeTab === 'playground' && <SQLPlayground />}

        {activeTab === 'scalability' && (
          <ScalabilityTab
            appliedExtensions={appliedExtensions}
            toggleExtension={toggleExtension}
          />
        )}

        {activeTab === 'assistant' && (
          <AIAssistant
            tables={tables}
            relationships={relationships}
          />
        )}
      </main>
    </div>
  );
}
