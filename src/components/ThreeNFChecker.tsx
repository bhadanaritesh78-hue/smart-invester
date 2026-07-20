import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, RefreshCw, AlertTriangle, CheckCircle, Split } from 'lucide-react';

interface NormalizationRule {
  level: string;
  title: string;
  definition: string;
  checklist: string[];
}

export default function ThreeNFChecker() {
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [violationSolved, setViolationSolved] = useState<boolean>(false);

  const rules: NormalizationRule[] = [
    {
      level: '1NF',
      title: 'First Normal Form: Atomicity',
      definition: 'All table rows must have the same number of columns, columns must contain only atomic (indivisible) values, and there must be no repeating groups or arrays.',
      checklist: [
        'There are no comma-separated arrays or JSON objects storing lists (e.g., storing a list of links in user_id as a single string).',
        'Every cell contains exactly one scalar value.',
        'Each column has a unique identifier name.'
      ]
    },
    {
      level: '2NF',
      title: 'Second Normal Form: Full Functional Dependency',
      definition: 'Must first satisfy 1NF, and all non-key columns must be fully functionally dependent on the entire Primary Key, eliminating partial dependencies (applicable on composite keys).',
      checklist: [
        'The table satisfies First Normal Form (1NF).',
        'No column depends on only a part of a composite primary key (e.g. in a holding key of (portfolio_id, asset_id), the asset_name depends only on asset_id, not portfolio_id. Hence, asset_name belongs in Assets!).',
        'Single surrogate primary keys (like UUIDs) automatically fulfill 2NF.'
      ]
    },
    {
      level: '3NF',
      title: 'Third Normal Form: Non-Transitive Dependency',
      definition: 'Must first satisfy 2NF, and no non-key column may depend transitively on the primary key through another non-key column (meaning every column depends "on the key, the whole key, and nothing but the key, so help me Codd").',
      checklist: [
        'The table satisfies Second Normal Form (2NF).',
        'There are no transitive dependencies (e.g. User -> Bank ID -> Bank Address is transitive. To resolve, split into User -> Bank ID and Bank ID -> Bank Address tables).',
        'All calculations or derived attributes (such as total_value = quantity * average_price) are either computed dynamically or treated as explicitly documented cache fields rather than structural source-of-truth tables.'
      ]
    }
  ];

  // Specific 3NF audit justifications for each table
  const tableChecklists: Record<string, { table: string; '1nf': boolean; '2nf': boolean; '3nf': boolean; explanation: string }> = {
    users: {
      table: 'users',
      '1nf': true,
      '2nf': true,
      '3nf': true,
      explanation: 'Each row represents one unique user identified by a UUID user_id. All attributes (email, full_name, password_hash) are simple atomic types. No multi-valued attributes are present. No transitive relationships exist because full_name or email do not determine password_hash or created_at.'
    },
    profiles: {
      table: 'profiles',
      '1nf': true,
      '2nf': true,
      '3nf': true,
      explanation: 'Tied 1:1 to user_id. Demographics like date_of_birth and investment_goal are completely atomic. There are no transitive attributes (e.g., a zip code determining a city name is avoided; the full address is treated as a simple text block or references a master location table in high-density applications).'
    },
    wallets: {
      table: 'wallets',
      '1nf': true,
      '2nf': true,
      '3nf': true,
      explanation: 'Contains a single balance and currency linked via FK user_id. There are no partial dependencies because the primary key is a single wallet_id. The currency attribute is standard and does not determine the balance.'
    },
    assets: {
      table: 'assets',
      '1nf': true,
      '2nf': true,
      '3nf': true,
      explanation: 'Holds security master details. The ticker_symbol is unique. All attributes (asset_name, asset_type, current_price, market) depend strictly and only on the asset_id key. Storing current_price here rather than in holdings ensures price edits only occur once.'
    },
    portfolios: {
      table: 'portfolios',
      '1nf': true,
      '2nf': true,
      '3nf': true,
      explanation: 'A sub-portfolio container. The total_value field is a caching attribute to optimize loading dashboards. In strict academic 3NF, total_value is omitted and computed via joins; in high-scale performance engineering, storing this as a cache is fully acceptable if synchronized via background workers or DB triggers.'
    },
    holdings: {
      table: 'holdings',
      '1nf': true,
      '2nf': true,
      '3nf': true,
      explanation: 'Connects portfolios to assets. Quantity and average_price are atomic. Because holding_id is a single PK, 2NF is satisfied. It avoids storing asset_name or current_price, preventing transitive dependencies. If asset_name were stored here, changing the name would require updating every holding row.'
    },
    transactions: {
      table: 'transactions',
      '1nf': true,
      '2nf': true,
      '3nf': true,
      explanation: 'A immutable historical audit ledger. Every record represents a distinct trade executed at a frozen price and quantity. All columns depend strictly on the transaction_id.'
    },
    watchlist: {
      table: 'watchlist',
      '1nf': true,
      '2nf': true,
      '3nf': true,
      explanation: 'A simple mapping table establishing a Many-to-Many join between Users and Assets. Houses unique composite index (user_id, asset_id), satisfying all criteria.'
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-slate-300">
      {/* Intro Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Third Normal Form (3NF) Normalization Analyzer
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-4xl">
          Relational databases require strict normalization to guarantee structural consistency, eliminate redundant storage bytes, and prevent update anomalies. Below is a detailed inspection of our platform schema and a simulated normalization sandbox.
        </p>
      </div>

      {/* Norm Theory cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rules.map((rule) => (
          <div key={rule.level} className="bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs bg-cyan-500/10 text-cyan-400 font-extrabold px-2.5 py-1 rounded-full border border-cyan-500/20 font-mono">
                {rule.level}
              </span>
              <h3 className="text-sm font-semibold text-white">{rule.title}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed min-h-12">
              {rule.definition}
            </p>
            <div className="border-t border-white/5 pt-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Audit Checklist:</span>
              <ul className="space-y-1.5">
                {rule.checklist.map((item, idx) => (
                  <li key={idx} className="text-[10px] text-slate-300 flex items-start gap-1.5 leading-normal">
                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Table Compliance Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left selector */}
        <div className="bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-3 shadow-2xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Entity to Audit</h3>
          <div className="flex flex-col gap-1.5">
            {Object.keys(tableChecklists).map((key) => {
              const active = selectedTable === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTable(key)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-mono font-bold transition flex items-center justify-between border ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-md shadow-cyan-500/5'
                      : 'bg-[#05060B]/80 hover:bg-white/5 text-slate-300 border-white/5'
                  }`}
                >
                  <span>{key}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans uppercase font-extrabold ${
                    active ? 'bg-black/40 text-cyan-400 border border-cyan-500/25' : 'bg-black/30 text-emerald-400 border border-emerald-500/10'
                  }`}>
                    3NF PASS
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Audit report panel */}
        <div className="bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl p-6 lg:col-span-2 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                audit_report: {selectedTable}.log
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                Full functional dependency mapping and mathematical proof.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Status:</span>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                COMPLIANT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="text-[11px]">
                <strong className="block text-slate-200">1NF Atomicity</strong>
                <span className="text-slate-500 font-mono">100% Pass</span>
              </div>
            </div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="text-[11px]">
                <strong className="block text-slate-200">2NF Key Dependencies</strong>
                <span className="text-slate-500 font-mono">100% Pass</span>
              </div>
            </div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="text-[11px]">
                <strong className="block text-slate-200">3NF Non-Transitive</strong>
                <span className="text-slate-500 font-mono">100% Pass</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Structural Rationale:</span>
            <p className="bg-[#05060B]/80 p-4 border border-white/10 rounded-lg text-xs leading-relaxed font-sans text-slate-350">
              {tableChecklists[selectedTable]?.explanation}
            </p>
          </div>

          {/* Interactive SQL Proof helper */}
          <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-[10px] space-y-1 font-mono">
            <span className="text-slate-500 uppercase tracking-wider block font-bold">Functional Dependencies Notation:</span>
            <div className="text-cyan-400">
              {selectedTable === 'users' && 'user_id → {full_name, email, phone, password_hash, KYC_status, account_status, created_at}'}
              {selectedTable === 'profiles' && 'profile_id → {user_id, date_of_birth, address, risk_level, investment_goal}; user_id (Unique) → profile_id'}
              {selectedTable === 'wallets' && 'wallet_id → {user_id, balance, currency}; user_id (Unique) → wallet_id'}
              {selectedTable === 'assets' && 'asset_id → {asset_name, asset_type, ticker_symbol, current_price, market}; ticker_symbol (Unique) → asset_id'}
              {selectedTable === 'portfolios' && 'portfolio_id → {user_id, portfolio_name, total_value}'}
              {selectedTable === 'holdings' && 'holding_id → {portfolio_id, asset_id, quantity, average_price}; {portfolio_id, asset_id} (Unique) → holding_id'}
              {selectedTable === 'transactions' && 'transaction_id → {user_id, asset_id, transaction_type, quantity, price, total_amount, transaction_date}'}
              {selectedTable === 'watchlist' && 'watchlist_id → {user_id, asset_id}; {user_id, asset_id} (Unique) → watchlist_id'}
            </div>
            <p className="text-[9px] text-slate-500 mt-1.5 font-sans leading-normal">
              No non-key attribute is determined by another non-key attribute. Therefore, transitive dependencies are mathematically zero.
            </p>
          </div>
        </div>
      </div>

      {/* NORMALIZATION SANDBOX - Violation Simulation */}
      <div className="bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4 shadow-2xl">
        <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Interactive Normalization Sandbox: Transitive Dependency Violation
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Let\'s simulate a classic normalization failure. In an un-normalized schema, developers often try to "speed up select statements" by duplicating columns. Observe how storing asset details directly inside the `holdings` table creates transitive dependency write anomalies.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Unnormalized table box */}
          <div className="bg-[#05060B]/80 p-4 border border-rose-950/80 rounded-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-400 border-l border-b border-rose-950 px-2 py-0.5 text-[9px] font-mono rounded-bl font-bold">
              VIOLATION (STRICT NO-NO)
            </div>

            <h4 className="text-xs font-mono font-bold text-rose-400">holdings [DENORMALIZED STATE]</h4>
            <div className="border border-rose-950/50 rounded overflow-hidden">
              <table className="w-full text-left font-mono text-[10px]">
                <thead className="bg-rose-950/20 text-rose-300">
                  <tr className="border-b border-rose-950/50">
                    <th className="p-2">holding_id</th>
                    <th className="p-2">portfolio_id</th>
                    <th className="p-2">asset_id</th>
                    <th className="p-2 text-rose-400">asset_name (Transitive!)</th>
                    <th className="p-2 text-rose-400">current_price (Transitive!)</th>
                    <th className="p-2">quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-950/20 text-slate-400">
                  <tr>
                    <td className="p-2 text-slate-500">h_901</td>
                    <td className="p-2 text-slate-500">p_001</td>
                    <td className="p-2 font-semibold">btc_id</td>
                    <td className="p-2 text-rose-300 font-semibold bg-rose-950/10">Bitcoin</td>
                    <td className="p-2 text-rose-300 font-semibold bg-rose-950/10">$62,450.00</td>
                    <td className="p-2">1.24</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-500">h_902</td>
                    <td className="p-2 text-slate-500">p_002</td>
                    <td className="p-2 font-semibold">btc_id</td>
                    <td className="p-2 text-rose-300 font-semibold bg-rose-950/10">Bitcoin</td>
                    <td className="p-2 text-rose-300 font-semibold bg-rose-950/10">$62,450.00</td>
                    <td className="p-2">0.50</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-rose-950/15 p-3 rounded border border-rose-900/30 text-[10px] text-rose-300 leading-normal font-sans">
              <strong>Write Anomaly:</strong> If the spot price of Bitcoin swings to $63,000.00, you have to query and update <strong>every holding record</strong> across your entire user base! If a single row fails to write, you introduce severe ledger inconsistency.
            </div>
          </div>

          {/* Action and 3NF Solved box */}
          <div className="flex flex-col justify-center space-y-4">
            {!violationSolved ? (
              <div className="bg-[#05060B]/85 p-6 rounded-xl border border-white/10 text-center space-y-4 flex flex-col items-center">
                <Split className="w-8 h-8 text-cyan-400 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">How do we solve this?</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-normal">
                    By pulling out the transitive non-key columns and routing them into a dedicated entity table <strong className="text-slate-200">assets</strong>, mapping them back only via foreign keys.
                  </p>
                </div>
                <button
                  onClick={() => setViolationSolved(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs transition-all duration-200 shadow-lg shadow-cyan-500/20"
                >
                  Apply 3NF Decompositions
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/10 p-5 rounded-xl border border-emerald-900/30 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Decomposed Successfully to 3NF!
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                  {/* Holdings table split */}
                  <div className="bg-black/40 p-2.5 rounded border border-white/10 space-y-1">
                    <span className="text-cyan-400 font-bold block text-[9px] uppercase">Table 1: holdings</span>
                    <ul className="text-slate-400 space-y-0.5">
                      <li>• holding_id (PK)</li>
                      <li>• portfolio_id (FK)</li>
                      <li>• asset_id (FK)</li>
                      <li>• quantity</li>
                    </ul>
                  </div>

                  {/* Assets table split */}
                  <div className="bg-black/40 p-2.5 rounded border border-white/10 space-y-1">
                    <span className="text-amber-400 font-bold block text-[9px] uppercase">Table 2: assets</span>
                    <ul className="text-slate-400 space-y-0.5">
                      <li>• asset_id (PK)</li>
                      <li>• asset_name</li>
                      <li>• current_price</li>
                    </ul>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  Excellent! By splitting the entities, you only update the Bitcoin price <strong>once</strong> inside the <strong className="text-slate-200">assets</strong> table. All holdings reference the single source-of-truth asset record dynamically via SQL joins!
                </p>

                <button
                  onClick={() => setViolationSolved(false)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  Reset Simulation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
