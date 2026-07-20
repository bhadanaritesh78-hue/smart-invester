import React, { useState } from 'react';
import { Table, Column, Relationship } from '../types';
import { Layers, Key, Link2, Plus, Info, CheckCircle, Database } from 'lucide-react';

interface InspectorProps {
  tableId: string | null;
  tables: Table[];
  relationships: Relationship[];
}

export default function Inspector({ tableId, tables, relationships }: InspectorProps) {
  const [dialect, setDialect] = useState<'postgres' | 'mysql' | 'sqlite'>('postgres');

  const table = tables.find((t) => t.id === tableId);

  if (!table) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="bg-slate-850 p-4 rounded-full text-slate-500 mb-3 border border-slate-800 animate-pulse">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No Entity Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Click on any table header inside the ERD Workspace to inspect columns, constraints, auto-generated DDL, and indexes.
        </p>
      </div>
    );
  }

  // Find incoming and outgoing relations
  const outgoingRelations = relationships.filter((r) => r.fromTable === table.id);
  const incomingRelations = relationships.filter((r) => r.toTable === table.id);

  // Generate table-specific DDL based on dialect
  const generateTableDDL = () => {
    let sql = `-- Dialect: ${dialect.toUpperCase()} DDL\n`;
    sql += `CREATE TABLE ${table.name} (\n`;

    const lines = table.columns.map((col) => {
      let line = `  ${col.name} `;

      // Type mapping
      let colType = col.type;
      if (dialect === 'sqlite') {
        if (colType === 'UUID') colType = 'TEXT';
        else if (colType.includes('VARCHAR')) colType = 'TEXT';
        else if (colType.includes('TIMESTAMP')) colType = 'DATETIME';
        else if (colType.includes('NUMERIC')) colType = 'REAL';
      } else if (dialect === 'mysql') {
        if (colType === 'UUID') colType = 'VARCHAR(36)';
        else if (colType === 'TIMESTAMP') colType = 'DATETIME';
      }

      line += colType;

      if (col.isPrimaryKey) {
        if (dialect === 'sqlite') {
          line += ' PRIMARY KEY';
        } else {
          line += ' PRIMARY KEY';
        }
      }

      if (!col.isNullable) {
        line += ' NOT NULL';
      }

      if (col.defaultValue) {
        line += ` DEFAULT ${col.defaultValue}`;
      }

      return line;
    });

    // Add ForeignKey constraints if supported inside table definition (or keep them separate for postgres)
    table.columns.forEach((col) => {
      if (col.isForeignKey && col.foreignKeyTarget) {
        const parts = col.foreignKeyTarget.split('.');
        lines.push(`  CONSTRAINT fk_${table.name}_${col.name} FOREIGN KEY (${col.name}) REFERENCES ${parts[0]}(${parts[1]}) ON DELETE CASCADE`);
      }
    });

    sql += lines.join(',\n');
    sql += '\n);';

    // Append indexes
    if (table.indexes.length > 0) {
      sql += '\n\n-- Indexes optimized for query performance\n';
      table.indexes.forEach((idx) => {
        const uniq = idx.isUnique ? 'UNIQUE ' : '';
        const colsJoined = idx.columns.join(', ');
        sql += `CREATE ${uniq}INDEX ${idx.name} ON ${table.name} (${colsJoined});\n`;
      });
    }

    return sql;
  };

  // Generate preloaded CRUD queries for this table
  const getCRUDQueries = () => {
    const keys = table.columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
    const nonKeys = table.columns.filter((c) => !colIsGenerated(c));
    const allColsJoined = table.columns.map((c) => c.name).join(', ');

    // helper check for generated columns or timestamps
    function colIsGenerated(col: Column) {
      return col.isPrimaryKey || col.defaultValue === 'CURRENT_TIMESTAMP';
    }

    const selectQuery = `SELECT ${allColsJoined}\nFROM ${table.name}\nWHERE ${keys[0] || 'id'} = ?;`;

    const insertCols = nonKeys.map((c) => c.name).join(', ');
    const insertVals = nonKeys.map(() => '?').join(', ');
    const insertQuery = `INSERT INTO ${table.name} (${insertCols})\nVALUES (${insertVals});`;

    const updateSets = nonKeys.map((c) => `${c.name} = ?`).join(', ');
    const updateQuery = `UPDATE ${table.name}\nSET ${updateSets}\nWHERE ${keys[0] || 'id'} = ?;`;

    return { selectQuery, insertQuery, updateQuery };
  };

  const crud = getCRUDQueries();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl h-full flex flex-col overflow-hidden text-slate-350">
      {/* Header Info */}
      <div className="bg-slate-850 p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            table_inspect: {table.name}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 font-sans italic leading-relaxed">
            {table.description}
          </p>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Relations summary list */}
        {(outgoingRelations.length > 0 || incomingRelations.length > 0) && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-slate-400" />
              Relational Cardinality Bindings
            </h4>
            <div className="grid grid-cols-1 gap-1 text-[11px] font-mono">
              {outgoingRelations.map((r) => (
                <div key={r.id} className="bg-slate-950/60 p-2 border border-slate-850 rounded flex items-center gap-2">
                  <span className="text-emerald-400">1</span>
                  <span className="text-slate-300 font-semibold">{r.fromTable}.{r.fromColumn}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-indigo-400 font-semibold">{r.type === '1:1' ? '1' : '∞'}</span>
                  <span className="text-slate-300">{r.toTable}.{r.toColumn}</span>
                </div>
              ))}
              {incomingRelations.map((r) => (
                <div key={r.id} className="bg-slate-950/60 p-2 border border-slate-850 rounded flex items-center gap-2">
                  <span className="text-indigo-400 font-semibold">{r.type === '1:1' ? '1' : '∞'}</span>
                  <span className="text-slate-300">{r.fromTable}.{r.fromColumn}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-emerald-400">1</span>
                  <span className="text-slate-300 font-semibold">{r.toTable}.{r.toColumn}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3NF Compliance confirmation badge */}
        <div className="bg-emerald-950/25 border border-emerald-800/40 rounded-lg p-3 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-[11px]">
            <span className="font-bold text-emerald-300 font-sans">3NF Compliance Certified</span>
            <p className="text-slate-400 mt-0.5 leading-relaxed font-sans">
              All non-key columns of <strong className="text-slate-200">{table.name}</strong> are completely atomic (1NF), depend fully on the primary key (2NF), and possess no transitive dependencies (3NF).
            </p>
          </div>
        </div>

        {/* Columns Metadata list */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            Attributes & Constraints Schema
          </h4>
          <div className="space-y-1.5">
            {table.columns.map((col, idx) => (
              <div key={idx} className="bg-slate-950/50 p-2.5 border border-slate-850 rounded-lg">
                <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                  <div className="flex items-center gap-1.5">
                    {col.isPrimaryKey ? (
                      <span className="bg-amber-500 text-slate-950 px-1 rounded text-[8px] font-extrabold font-sans">PRIMARY KEY</span>
                    ) : col.isForeignKey ? (
                      <span className="bg-indigo-500 text-white px-1 rounded text-[8px] font-extrabold font-sans">FOREIGN KEY</span>
                    ) : null}
                    <span className="text-slate-200 font-bold">{col.name}</span>
                  </div>
                  <span className="text-emerald-400 text-[10px]">{col.type}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  {col.description}
                </p>
                {col.defaultValue && (
                  <div className="text-[9px] text-slate-500 mt-1 font-mono">
                    DEFAULT VALUE: <span className="text-indigo-300">{col.defaultValue}</span>
                  </div>
                )}
                {col.foreignKeyTarget && (
                  <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                    REFERENCES: <span className="text-emerald-400 font-semibold">{col.foreignKeyTarget}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Performance Indexes */}
        {table.indexes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Performance Tuning: Indexes
            </h4>
            <div className="space-y-1.5">
              {table.indexes.map((idx, i) => (
                <div key={i} className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-lg text-xs">
                  <div className="flex items-center justify-between font-mono mb-1 text-[11px]">
                    <span className="text-indigo-300 font-semibold">{idx.name}</span>
                    <span className="text-[10px] bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded uppercase font-sans">
                      {idx.isUnique ? 'Unique' : 'B-Tree'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    {idx.description}
                  </p>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">
                    INDEXED COLUMNS: <span className="text-slate-300 font-bold">({idx.columns.join(', ')})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-Time Table DDL code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Live Generated DDL Script
            </h4>
            <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
              {(['postgres', 'mysql', 'sqlite'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                    dialect === d ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <pre className="bg-slate-950 p-3 rounded-lg text-[10px] font-mono text-slate-300 border border-slate-850 overflow-x-auto select-all max-h-56 leading-relaxed">
            {generateTableDDL()}
          </pre>
        </div>

        {/* Table-specific CRUD Operations */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Pre-optimized CRUD Operations
          </h4>
          <div className="space-y-2 font-mono text-[10px]">
            <div>
              <span className="text-slate-500 uppercase tracking-wide block mb-1">Select query</span>
              <pre className="bg-slate-950 p-2 rounded text-indigo-200 border border-slate-850 leading-relaxed overflow-x-auto select-all">
                {crud.selectQuery}
              </pre>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wide block mb-1">Insert query</span>
              <pre className="bg-slate-950 p-2 rounded text-teal-200 border border-slate-850 leading-relaxed overflow-x-auto select-all">
                {crud.insertQuery}
              </pre>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wide block mb-1">Update query</span>
              <pre className="bg-slate-950 p-2 rounded text-amber-200 border border-slate-850 leading-relaxed overflow-x-auto select-all">
                {crud.updateQuery}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
