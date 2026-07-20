import React, { useState, useRef, useEffect } from 'react';
import { Table, Column, Relationship } from '../types';
import { Plus, Trash2, Edit3, Settings, ShieldAlert, ArrowRightLeft, Move, HelpCircle } from 'lucide-react';

interface ERDCanvasProps {
  tables: Table[];
  relationships: Relationship[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  searchTerm: string;
}

export default function ERDCanvas({
  tables,
  relationships,
  setTables,
  selectedTableId,
  setSelectedTableId,
  searchTerm,
}: ERDCanvasProps) {
  // Dragging state
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Column / Table Editor state
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingColumnIdx, setEditingColumnIdx] = useState<{ tableId: string; colIdx: number } | null>(null);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('VARCHAR(100)');
  const [newColNullable, setNewColNullable] = useState(true);
  const [newColDesc, setNewColDesc] = useState('');

  // Table Add state
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCategory, setNewTableCategory] = useState<'core' | 'user' | 'asset' | 'transaction' | 'extension'>('core');
  const [newTableDesc, setNewTableDesc] = useState('');

  // Dimensions of cards for relationship anchors
  const CARD_WIDTH = 250;

  // Estimates card height based on column count for center anchor calculation
  const getCardHeight = (columnCount: number) => {
    return 45 + columnCount * 28 + 15; // header + padding + cols
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return; // Avoid drag on buttons
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    setSelectedTableId(tableId);
    setDraggedTableId(tableId);

    // Calculate mouse position relative to card top-left
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedTableId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    // Constrain inside bounds
    const boundedX = Math.max(10, Math.min(2200, x));
    const boundedY = Math.max(10, Math.min(1200, y));

    setTables((prev) =>
      prev.map((t) => (t.id === draggedTableId ? { ...t, x: boundedX, y: boundedY } : t))
    );
  };

  const handleMouseUp = () => {
    setDraggedTableId(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggedTableId(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [draggedTableId]);

  // Filtering based on search
  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.columns.some((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Column management
  const handleAddColumn = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const newCol: Column = {
          name: 'new_column',
          type: 'VARCHAR(100)',
          isPrimaryKey: false,
          isNullable: true,
          description: 'Custom user defined column.',
        };
        return { ...t, columns: [...t.columns, newCol] };
      })
    );
  };

  const handleDeleteColumn = (tableId: string, colIndex: number) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const filteredCols = t.columns.filter((_, idx) => idx !== colIndex);
        return { ...t, columns: filteredCols };
      })
    );
    if (editingColumnIdx?.tableId === tableId && editingColumnIdx.colIdx === colIndex) {
      setEditingColumnIdx(null);
    }
  };

  const handleSaveColumnChanges = () => {
    if (!editingColumnIdx) return;
    const { tableId, colIdx } = editingColumnIdx;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const updatedCols = t.columns.map((c, idx) => {
          if (idx !== colIdx) return c;
          return {
            ...c,
            name: newColName.trim() || c.name,
            type: newColType,
            isNullable: newColNullable,
            description: newColDesc.trim() || c.description,
          };
        });
        return { ...t, columns: updatedCols };
      })
    );
    setEditingColumnIdx(null);
  };

  // Add Table
  const handleCreateNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    const formattedId = newTableName.toLowerCase().replace(/\s+/g, '_');
    if (tables.some((t) => t.id === formattedId)) {
      alert('A table with this name already exists.');
      return;
    }

    const newTable: Table = {
      id: formattedId,
      name: formattedId,
      description: newTableDesc.trim() || 'Custom database table.',
      category: newTableCategory,
      x: 350,
      y: 250,
      columns: [
        { name: `${formattedId}_id`, type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
        { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'When record was inserted.' },
      ],
      indexes: [],
    };

    setTables((prev) => [...prev, newTable]);
    setNewTableName('');
    setNewTableDesc('');
    setShowAddTable(false);
    setSelectedTableId(formattedId);
  };

  // Delete Table
  const handleDeleteTable = (tableId: string) => {
    if (confirm(`Are you sure you want to delete the "${tableId}" table? This will remove all associated visual columns.`)) {
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      if (selectedTableId === tableId) setSelectedTableId(null);
    }
  };

  // Anchor coordinate calculation
  const getAnchorCoords = (tableId: string, side: 'left' | 'right') => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return { x: 0, y: 0 };

    const height = getCardHeight(table.columns.length);
    const x = side === 'left' ? table.x : table.x + CARD_WIDTH;
    const y = table.y + height / 2;

    return { x, y };
  };

  // Category Color Class Generator
  const getCategoryColor = (category: string, part: 'header' | 'badge' | 'border') => {
    switch (category) {
      case 'user':
        if (part === 'header') return 'bg-teal-600 border-teal-500';
        if (part === 'badge') return 'bg-teal-550 text-white';
        return 'border-teal-400 focus:border-teal-500';
      case 'asset':
        if (part === 'header') return 'bg-amber-600 border-amber-500';
        if (part === 'badge') return 'bg-amber-500 text-slate-950';
        return 'border-amber-400 focus:border-amber-500';
      case 'transaction':
        if (part === 'header') return 'bg-violet-600 border-violet-500';
        if (part === 'badge') return 'bg-violet-550 text-white';
        return 'border-violet-400 focus:border-violet-500';
      case 'extension':
        if (part === 'header') return 'bg-rose-600 border-rose-500';
        if (part === 'badge') return 'bg-rose-500 text-white';
        return 'border-rose-400 focus:border-rose-500';
      default: // core
        if (part === 'header') return 'bg-indigo-650 border-indigo-550';
        if (part === 'badge') return 'bg-indigo-500 text-white';
        return 'border-indigo-400 focus:border-indigo-500';
    }
  };

  return (
    <div className="flex flex-col h-[78vh] bg-[#05060B]/85 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden relative shadow-2xl">
      {/* Canvas Tool Belt */}
      <div className="bg-black/30 border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Canvas Workspace:</span>
          <button
            onClick={() => setShowAddTable(true)}
            className="flex items-center gap-1.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-md shadow-cyan-500/20 hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Custom Table
          </button>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-650"></span>
            <span>Core Ledger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-600"></span>
            <span>User Compliance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-600"></span>
            <span>Asset Catalog</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-violet-600"></span>
            <span>Transaction Ledger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span>Scaling Extensions</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        className="flex-1 overflow-auto p-4 select-none relative custom-blueprint"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Dynamic SVG Connection Layer */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          style={{ width: '2400px', height: '1400px' }}
        >
          {/* SVG Definitions for arrows and markers */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
          </defs>

          {/* Render lines for active relationships */}
          {relationships.map((rel) => {
            const parentTable = tables.find((t) => t.id === rel.fromTable);
            const childTable = tables.find((t) => t.id === rel.toTable);

            if (!parentTable || !childTable) return null;

            // Compute side connections based on horizontal proximity
            const parentSide = parentTable.x < childTable.x ? 'right' : 'left';
            const childSide = childTable.x < parentTable.x ? 'right' : 'left';

            const start = getAnchorCoords(rel.fromTable, parentSide);
            const end = getAnchorCoords(rel.toTable, childSide);

            // Draw clean cubic bezier path
            const controlOffset = Math.max(100, Math.abs(end.x - start.x) * 0.5);
            const cp1X = parentSide === 'right' ? start.x + controlOffset : start.x - controlOffset;
            const cp2X = childSide === 'right' ? end.x + controlOffset : end.x - controlOffset;

            const pathD = `M ${start.x} ${start.y} C ${cp1X} ${start.y}, ${cp2X} ${end.y}, ${end.x} ${end.y}`;

            const isRelatedSelected = selectedTableId === rel.fromTable || selectedTableId === rel.toTable;

            return (
              <g key={rel.id} className="transition-all duration-300">
                {/* Highlight Glow Curve */}
                {isRelatedSelected && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeOpacity="0.25"
                  />
                )}

                {/* Main Curve Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isRelatedSelected ? '#10b981' : '#475569'}
                  strokeWidth={isRelatedSelected ? '2' : '1.5'}
                  strokeDasharray={rel.type === '1:1' ? '0' : '4 2'}
                  className="transition-colors duration-300"
                />

                {/* Anchor point dots */}
                <circle cx={start.x} cy={start.y} r="4" fill={isRelatedSelected ? '#10b981' : '#64748b'} />
                <circle cx={end.x} cy={end.y} r="4" fill={isRelatedSelected ? '#10b981' : '#64748b'} />

                {/* Numerical / Cardinality Labels */}
                {/* 1 (One) Anchor Label */}
                <g transform={`translate(${start.x + (parentSide === 'right' ? 12 : -20)}, ${start.y + 4})`}>
                  <rect x="-4" y="-12" width="16" height="15" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <text fill="#cbd5e1" fontSize="10" fontWeight="bold" fontFamily="monospace">1</text>
                </g>

                {/* Many (Infinity/Crowfoot) or 1 Badge Label */}
                <g transform={`translate(${end.x + (childSide === 'right' ? 12 : -20)}, ${end.y + 4})`}>
                  <rect x="-4" y="-12" width="16" height="15" rx="3" fill="#1e293b" stroke={isRelatedSelected ? '#10b981' : '#475569'} strokeWidth="1" />
                  <text fill={isRelatedSelected ? '#34d399' : '#94a3b8'} fontSize="10" fontWeight="bold" fontFamily="monospace">
                    {rel.type === '1:1' ? '1' : '∞'}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Render HTML Table Cards absolute-positioned */}
        <div style={{ width: '2400px', height: '1400px', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {filteredTables.map((table) => {
            const isSelected = selectedTableId === table.id;

            return (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
                className={`absolute rounded-xl border bg-[#0F111A]/95 backdrop-blur-xl shadow-2xl transition-all duration-200 pointer-events-auto cursor-grab active:cursor-grabbing flex flex-col ${
                  isSelected
                    ? 'border-cyan-400 shadow-lg shadow-cyan-400/15 ring-1 ring-cyan-400/30'
                    : 'border-white/10 hover:border-white/20'
                }`}
                style={{
                  left: `${table.x}px`,
                  top: `${table.y}px`,
                  width: `${CARD_WIDTH}px`,
                  zIndex: isSelected ? 30 : 10,
                }}
              >
                {/* Card Header */}
                <div
                  className={`px-3 py-2 text-white rounded-t-xl flex items-center justify-between select-none ${getCategoryColor(
                    table.category,
                    'header'
                  )}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Move className="w-3.5 h-3.5 text-white/75 flex-shrink-0" />
                    <span className="font-semibold text-sm tracking-tight truncate font-mono text-white select-all">
                      {table.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 no-drag">
                    <button
                      onClick={() => handleAddColumn(table.id)}
                      title="Add Custom Column"
                      className="p-1 rounded bg-black/25 hover:bg-black/40 text-white transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {table.id !== 'users' && (
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        title="Delete Table"
                        className="p-1 rounded bg-black/25 hover:bg-rose-950 text-rose-300 hover:text-rose-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Schema Attributes */}
                <div className="px-1 py-2 divide-y divide-white/5">
                  {table.columns.map((col, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 text-[11px] font-mono flex items-center justify-between hover:bg-white/5 rounded transition no-drag group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {col.isPrimaryKey ? (
                          <span
                            title="Primary Key"
                            className="bg-amber-500 text-slate-950 font-extrabold px-1 rounded text-[8px] flex-shrink-0"
                          >
                            PK
                          </span>
                        ) : col.isForeignKey ? (
                          <span
                            title={`Foreign Key linking to ${col.foreignKeyTarget}`}
                            className="bg-indigo-500 text-white font-extrabold px-1 rounded text-[8px] flex-shrink-0 cursor-help"
                          >
                            FK
                          </span>
                        ) : (
                          <span className="w-3.5 h-1"></span>
                        )}

                        <span
                          className={`font-semibold truncate ${
                            col.isPrimaryKey ? 'text-amber-400 font-bold' : 'text-slate-200'
                          }`}
                          title={col.description}
                        >
                          {col.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 ml-2 text-slate-400">
                        <span className="text-[10px] text-slate-500 truncate" title={col.type}>
                          {col.type.split('(')[0]}
                        </span>
                        {!col.isNullable && (
                          <span title="NOT NULL" className="text-amber-500 text-[8px] font-bold">
                            ★
                          </span>
                        )}

                        {/* Inline column action trigger */}
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingColumnIdx({ tableId: table.id, colIdx: idx });
                              setNewColName(col.name);
                              setNewColType(col.type);
                              setNewColNullable(col.isNullable);
                              setNewColDesc(col.description);
                            }}
                            title="Edit Column details"
                            className="text-slate-400 hover:text-white p-0.5 rounded transition"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {!col.isPrimaryKey && (
                            <button
                              onClick={() => handleDeleteColumn(table.id, idx)}
                              title="Delete Column"
                              className="text-rose-400 hover:text-rose-300 p-0.5 rounded transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Brief description tooltip block */}
                <div className="bg-black/40 px-3 py-1.5 border-t border-white/5 rounded-b-xl text-[10px] text-slate-400 font-sans italic truncate">
                  {table.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Overlay modal for column properties */}
      {editingColumnIdx && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Configure Column Properties
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Column Name</label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. email_address"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Data Type</label>
                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="UUID">UUID</option>
                    <option value="VARCHAR(50)">VARCHAR(50)</option>
                    <option value="VARCHAR(100)">VARCHAR(100)</option>
                    <option value="VARCHAR(255)">VARCHAR(255)</option>
                    <option value="TEXT">TEXT</option>
                    <option value="NUMERIC(15,4)">NUMERIC(15,4) [Currency]</option>
                    <option value="NUMERIC(18,8)">NUMERIC(18,8) [Fractional Shares]</option>
                    <option value="INTEGER">INTEGER</option>
                    <option value="DATE">DATE</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Nullability</label>
                  <div className="flex items-center gap-4 h-10">
                    <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                      <input
                        type="radio"
                        checked={newColNullable}
                        onChange={() => setNewColNullable(true)}
                        className="text-emerald-500 focus:ring-0"
                      />
                      Nullable
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                      <input
                        type="radio"
                        checked={!newColNullable}
                        onChange={() => setNewColNullable(false)}
                        className="text-emerald-500 focus:ring-0"
                      />
                      NOT NULL
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description / Constraint rationale</label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enforces non-empty user registration entries."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingColumnIdx(null)}
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveColumnChanges}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition"
              >
                Save Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Overlay modal for adding a table */}
      {showAddTable && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-45 p-4">
          <form
            onSubmit={handleCreateNewTable}
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative"
          >
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Build New Relational Table
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Table Name</label>
                <input
                  type="text"
                  required
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. audit_logs"
                />
                <p className="text-[10px] text-slate-500 mt-1">Lowercase letters, digits, and underscores only.</p>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Domain Classification</label>
                <select
                  value={newTableCategory}
                  onChange={(e) => setNewTableCategory(e.target.value as any)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="core">Core Ledger Schema</option>
                  <option value="user">User Compliance / Profiles</option>
                  <option value="asset">Asset Catalogue</option>
                  <option value="transaction">Double-Entry Transaction Logs</option>
                  <option value="extension">Platform scaling / SIP extensions</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Entity Description</label>
                <textarea
                  value={newTableDesc}
                  onChange={(e) => setNewTableDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Keeps detailed security audit trails of admin edits."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddTable(false)}
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition"
              >
                Generate Table
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
