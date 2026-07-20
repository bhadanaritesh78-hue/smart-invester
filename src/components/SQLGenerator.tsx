import React, { useState } from 'react';
import { Table, Relationship } from '../types';
import { Copy, Check, FileCode, AlertCircle, Info, Database } from 'lucide-react';

interface SQLGeneratorProps {
  tables: Table[];
  relationships: Relationship[];
}

export default function SQLGenerator({ tables, relationships }: SQLGeneratorProps) {
  const [dialect, setDialect] = useState<'postgres' | 'mysql' | 'sqlite'>('postgres');
  const [copied, setCopied] = useState(false);

  // Helper mapping types depending on SQL dialect
  const getMappedType = (type: string, currentDialect: typeof dialect) => {
    if (currentDialect === 'sqlite') {
      if (type === 'UUID') return 'TEXT';
      if (type.includes('VARCHAR')) return 'TEXT';
      if (type.includes('TIMESTAMP')) return 'DATETIME';
      if (type.includes('NUMERIC')) return 'REAL';
    } else if (currentDialect === 'mysql') {
      if (type === 'UUID') return 'VARCHAR(36)';
      if (type === 'TIMESTAMP') return 'DATETIME';
    }
    return type;
  };

  const generateFullDDL = () => {
    let sql = `-- =========================================================================\n`;
    sql += `-- DATABASE DDL SCRIPT (DIALECT: ${dialect.toUpperCase()})\n`;
    sql += `-- Target System: Modern Multi-Asset Investment Platform\n`;
    sql += `-- Generation Timestamp: ${new Date().toISOString()}\n`;
    sql += `-- Optimization Standard: Third Normal Form (3NF), Foreign Key Indexing,\n`;
    sql += `--                       Non-Negative Check Constraints & Audit States\n`;
    sql += `-- =========================================================================\n\n`;

    if (dialect === 'postgres') {
      sql += `-- Enable UUID Extension\n`;
      sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
    } else if (dialect === 'mysql') {
      sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
      sql += `DROP TABLE IF EXISTS ${tables.map(t => t.name).join(', ')};\n`;
      sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    }

    // Step 1: CREATE TABLE declarations
    tables.forEach((table) => {
      sql += `-- Table Structure for [${table.name}]\n`;
      sql += `-- Description: ${table.description}\n`;
      sql += `CREATE TABLE ${table.name} (\n`;

      const columnLines = table.columns.map((col) => {
        let line = `  ${col.name} ${getMappedType(col.type, dialect)}`;

        if (col.isPrimaryKey) {
          line += ' PRIMARY KEY';
        }

        if (!col.isNullable) {
          line += ' NOT NULL';
        }

        if (col.defaultValue) {
          if (dialect === 'sqlite' && col.defaultValue === 'CURRENT_TIMESTAMP') {
            line += ' DEFAULT CURRENT_TIMESTAMP';
          } else {
            line += ` DEFAULT ${col.defaultValue}`;
          }
        }

        // Inline checks for non-negative balances
        if (col.name === 'balance' || col.name === 'quantity' || col.name === 'average_price' || col.name === 'price' || col.name === 'total_amount') {
          if (dialect !== 'sqlite') {
            line += ` CHECK (${col.name} >= 0)`;
          }
        }

        return line;
      });

      // Inline Foreign Keys for SQLite
      if (dialect === 'sqlite') {
        table.columns.forEach((col) => {
          if (col.isForeignKey && col.foreignKeyTarget) {
            const parts = col.foreignKeyTarget.split('.');
            columnLines.push(`  FOREIGN KEY (${col.name}) REFERENCES ${parts[0]}(${parts[1]}) ON DELETE CASCADE`);
          }
        });
      }

      sql += columnLines.join(',\n');
      sql += '\n);\n\n';
    });

    // Step 2: Foreign Key constraints for relational dialects (MySQL & Postgres)
    if (dialect !== 'sqlite') {
      sql += `-- =========================================================================\n`;
      sql += `-- FOREIGN KEY CONSTRAINTS (DOUBLE-ENTRY INTEGRITY)\n`;
      sql += `-- =========================================================================\n\n`;

      relationships.forEach((rel) => {
        // Only output if both tables still exist on canvas
        const hasParent = tables.some(t => t.id === rel.fromTable);
        const hasChild = tables.some(t => t.id === rel.toTable);

        if (hasParent && hasChild) {
          sql += `ALTER TABLE ${rel.toTable}\n`;
          sql += `  ADD CONSTRAINT fk_${rel.toTable}_${rel.toColumn}\n`;
          sql += `  FOREIGN KEY (${rel.toColumn}) REFERENCES ${rel.fromTable}(${rel.fromColumn})\n`;
          sql += `  ON DELETE CASCADE ON UPDATE CASCADE;\n\n`;
        }
      });
    }

    // Step 3: Performance Indexes on Foreign Keys (Eliminates full table scans!)
    sql += `-- =========================================================================\n`;
    sql += `-- PERFORMANCE OPTIMIZATION INDEXES (INDEX-ONLY TRANSITIONAL SCANS)\n`;
    sql += `-- =========================================================================\n\n`;

    tables.forEach((table) => {
      // Append table custom indexes
      table.indexes.forEach((idx) => {
        const uniq = idx.isUnique ? 'UNIQUE ' : '';
        sql += `CREATE ${uniq}INDEX ${idx.name} ON ${table.name} (${idx.columns.join(', ')});\n`;
      });

      // Auto-generate helper index on all foreign keys that do not already have a composite index!
      table.columns.forEach((col) => {
        if (col.isForeignKey) {
          const alreadyIndexed = table.indexes.some((idx) => idx.columns[0] === col.name);
          if (!alreadyIndexed) {
            sql += `CREATE INDEX idx_${table.name}_${col.name}_fk ON ${table.name} (${col.name});\n`;
          }
        }
      });
    });

    // Step 4: DBA Optimization Tuning Tips
    sql += `\n-- =========================================================================\n`;
    sql += `-- DBA ARCHITECTURAL RECOMMENDATIONS FOR INVESTMENT SCALING:\n`;
    sql += `-- 1. CONNECTION POOLING: Maintain min=10, max=100 pool config using pgpool or HikariCP.\n`;
    sql += `-- 2. MEMORY TUNING (PostgreSQL):\n`;
    sql += `--    - shared_buffers = 25% of overall System RAM.\n`;
    sql += `--    - work_mem = 64MB (critical for sorting large transactions lists).\n`;
    sql += `--    - maintenance_work_mem = 512MB (speeds up index creation on transactions table).\n`;
    sql += `-- 3. TIMESERIES SHARDING: If 'asset_prices_timeseries' exceeds 50M records, use TimescaleDB\n`;
    sql += `--    hypertables partitioned on 'time' with a chunk interval of '1 day'.\n`;
    sql += `-- 4. ACID READ-CONSISTENCY: For BUY/SELL order triggers, always wrap instructions\n`;
    sql += `--    in a transaction block with ISOLATION LEVEL SERIALIZABLE or REPEATABLE READ.\n`;
    sql += `-- =========================================================================\n`;

    return sql;
  };

  const fullSql = generateFullDDL();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controller Panel */}
      <div className="bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            Complete Platform DDL Generator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Exports the complete database setup script representing all active entities, PK/FK definitions, constraints, index declarations, and dialect mappings.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="flex bg-[#05060B]/80 border border-white/10 p-1 rounded-lg">
            {(['postgres', 'mysql', 'sqlite'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDialect(d)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${
                  dialect === d ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d === 'postgres' ? 'PostgreSQL' : d === 'mysql' ? 'MySQL' : 'SQLite'}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-cyan-400" />
                Copied DDL!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Script
              </>
            )}
          </button>
        </div>
      </div>

      {/* Database Warning / Advice Callout */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Transaction Security Measures</h4>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              We automatically inject non-negative `CHECK` constraints on monetary fields (`balance`, `quantity`, `average_price`). For SQL Dialects like SQLite that lack formal ALTER syntax, foreign keys are defined inline inside the table statements.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Indexes & Join Optimization</h4>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              For rapid lookups, our builder injects custom `B-Tree` composite indexes (such as composite unique constraints on user watchlists or holding portfolios) and appends a single-column index on every remaining foreign key.
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="relative rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md">
        {/* Title Bar */}
        <div className="bg-[#0F111A]/90 px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{dialect === 'postgres' ? 'schema_postgres.sql' : dialect === 'mysql' ? 'schema_mysql.sql' : 'schema_sqlite.sql'}</span>
          <span className="text-[10px] bg-[#05060B] px-2 py-0.5 border border-white/10 text-cyan-400 uppercase rounded">
            {dialect} DDL
          </span>
        </div>

        {/* Code Content */}
        <pre className="p-6 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed select-all max-h-[55vh]">
          {fullSql}
        </pre>
      </div>
    </div>
  );
}
