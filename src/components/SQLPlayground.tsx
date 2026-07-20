import React, { useState } from 'react';
import { GitBranch, Shield, Zap, Search, HelpCircle } from 'lucide-react';

interface SQLQuery {
  id: string;
  name: string;
  category: 'transaction' | 'dashboard' | 'compliance';
  description: string;
  rationale: string;
  sql: string;
  explainPlan: string;
}

export default function SQLPlayground() {
  const [selectedQueryId, setSelectedQueryId] = useState<string>('secure_buy');

  const queries: SQLQuery[] = [
    {
      id: 'secure_buy',
      name: 'Secure Atomic Buy-Order Execution',
      category: 'transaction',
      description: 'Performs a highly secure, double-entry transactional update. Wraps wallet balance deduction, transaction logging, and fractional share holding additions inside an atomic database transaction.',
      rationale: 'In financial ledgers, preventing race conditions (such as double-spending) is critical. This query uses explicit SELECT FOR UPDATE row-level locks on the user\'s wallet to block concurrent withdrawal requests, ensuring perfect ledger consistency.',
      sql: `-- Set Isolation level to guarantee strict sequential execution\n` +
           `BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\n\n` +
           `-- 1. LOCK & VERIFY USER'S BALANCE (Row-level lock prevents race conditions)\n` +
           `SELECT balance, currency \n` +
           `FROM wallets \n` +
           `WHERE user_id = '997dbe22-d716-43b3-b255-f639d598eeaa' \n` +
           `FOR UPDATE;\n\n` +
           `-- [Application check: Ensure balance >= (quantity * asset_price) + transaction_fee]\n\n` +
           `-- 2. DEDUCT CASH FROM WALLET LEDGER\n` +
           `UPDATE wallets\n` +
           `SET balance = balance - 5000.0000\n` +
           `WHERE user_id = '997dbe22-d716-43b3-b255-f639d598eeaa';\n\n` +
           `-- 3. INSERT IMMUTABLE AUDIT TRANSACTION LOG\n` +
           `INSERT INTO transactions (\n` +
           `  transaction_id, user_id, asset_id, transaction_type, quantity, price, total_amount, transaction_date\n` +
           `)\n` +
           `VALUES (\n` +
           `  uuid_generate_v4(),\n` +
           `  '997dbe22-d716-43b3-b255-f639d598eeaa',\n` +
           `  'b852934b-fbbe-4dfd-a8e5-eb65239e31d4',\n` +
           `  'BUY',\n` +
           `  0.08012820,   -- Fractional units supported\n` +
           `  62400.0000,   -- Execution spot price\n` +
           `  5000.0000,    -- Total cost\n` +
           `  CURRENT_TIMESTAMP\n` +
           `);\n\n` +
           `-- 4. ATOMICALLY INSERT OR INCREMENT PORTFOLIO HOLDINGS\n` +
           `INSERT INTO holdings (holding_id, portfolio_id, asset_id, quantity, average_price)\n` +
           `VALUES (\n` +
           `  uuid_generate_v4(),\n` +
           `  'a4b1234c-6789-4def-9012-3456789abcde',\n` +
           `  'b852934b-fbbe-4dfd-a8e5-eb65239e31d4',\n` +
           `  0.08012820,\n` +
           `  62400.0000\n` +
           `)\n` +
           `ON CONFLICT (portfolio_id, asset_id) \n` +
           `DO UPDATE SET\n` +
           `  -- Compute new average cost basis: (old_total_cost + new_cost) / new_total_quantity\n` +
           `  average_price = ((holdings.quantity * holdings.average_price) + EXCLUDED.total_cost) / (holdings.quantity + EXCLUDED.quantity),\n` +
           `  quantity = holdings.quantity + EXCLUDED.quantity;\n\n` +
           `COMMIT;`,
      explainPlan: `EXPLAIN ANALYZE OUTPUT:\n` +
                   `-> Commit Transaction (cost=0.00..0.00)\n` +
                   `   -> Update on holdings (cost=0.15..8.17 rows=1)\n` +
                   `      -> Insert on transactions (cost=0.00..0.01 rows=1)\n` +
                   `         -> Update on wallets (cost=0.15..8.17 rows=1)\n` +
                   `            -> Lock rows on wallets (SELECT FOR UPDATE) using unique index idx_wallets_user_id_uniq (cost=0.15..8.16 rows=1)`
    },
    {
      id: 'portfolio_valuation',
      name: 'Dynamic Portfolio Valuation Aggregate',
      category: 'dashboard',
      description: 'Calculates the overall real-time value of an investor\'s sub-portfolios by joining current holding quantities with real-time synchronized asset master prices.',
      rationale: 'Demonstrates a standard aggregate report. Uses dynamic inner joins across Portfolios, Holdings, and Assets to compute live worth, sorting by valuation size.',
      sql: `SELECT \n` +
           `  p.portfolio_id,\n` +
           `  p.portfolio_name,\n` +
           `  u.full_name AS investor_name,\n` +
           `  COUNT(h.holding_id) AS distinct_assets_count,\n` +
           `  COALESCE(SUM(h.quantity * a.current_price), 0.0000) AS computed_total_value,\n` +
           `  COALESCE(SUM(h.quantity * h.average_price), 0.0000) AS total_invested_cost_basis,\n` +
           `  COALESCE(SUM(h.quantity * a.current_price) - SUM(h.quantity * h.average_price), 0.0000) AS absolute_unrealized_gain_loss\n` +
           `FROM portfolios p\n` +
           `JOIN users u ON p.user_id = u.user_id\n` +
           `LEFT JOIN holdings h ON p.portfolio_id = h.portfolio_id\n` +
           `LEFT JOIN assets a ON h.asset_id = a.asset_id\n` +
           `WHERE p.user_id = '997dbe22-d716-43b3-b255-f639d598eeaa'\n` +
           `GROUP BY p.portfolio_id, p.portfolio_name, u.full_name\n` +
           `ORDER BY computed_total_value DESC;`,
      explainPlan: `EXPLAIN ANALYZE OUTPUT:\n` +
                   `-> Sort (cost=16.35..16.36 rows=1)\n` +
                   `   -> HashAggregate (cost=16.30..16.33 rows=1)\n` +
                   `      -> Nested Loop Left Join (cost=0.30..16.20 rows=5)\n` +
                   `         -> Index Scan using idx_portfolios_user_id on portfolios p (cost=0.15..8.14 rows=2)\n` +
                   `         -> Index Scan using idx_holdings_portfolio_asset on holdings h (cost=0.15..4.02 rows=3)`
    },
    {
      id: 'sip_cron',
      name: 'SIP Automated Trigger Roster',
      category: 'compliance',
      description: 'Fetches all recurring systematic investment plans (SIPs) due for execution on the current calendar date, checking user wallets to verify if adequate purchasing cash is available.',
      rationale: 'Critical query for automated cron jobs running every midnight. Joining SIP triggers with active wallet balances filter-outs users with insufficient funds to minimize failed transaction logs.',
      sql: `SELECT \n` +
           `  s.sip_id,\n` +
           `  s.amount AS recurring_investment_amount,\n` +
           `  s.frequency,\n` +
           `  u.full_name AS investor_name,\n` +
           `  w.balance AS available_liquid_cash,\n` +
           `  a.ticker_symbol AS security_ticker,\n` +
           `  a.current_price AS current_spot_price\n` +
           `FROM sips s\n` +
           `JOIN users u ON s.user_id = u.user_id\n` +
           `JOIN wallets w ON u.user_id = w.user_id\n` +
           `JOIN assets a ON s.asset_id = a.asset_id\n` +
           `WHERE s.status = 'ACTIVE'\n` +
           `  AND s.next_execution_date <= CURRENT_DATE\n` +
           `  AND w.balance >= s.amount  -- Filter out insufficient funds pre-execution\n` +
           `ORDER BY s.amount DESC;`,
      explainPlan: `EXPLAIN ANALYZE OUTPUT:\n` +
                   `-> Nested Loop (cost=0.45..32.18 rows=3)\n` +
                   `   -> Index Scan using idx_sips_next_exec on sips s (cost=0.15..12.10 rows=5)\n` +
                   `   -> Index Scan using idx_wallets_user_id_uniq on wallets w (cost=0.15..4.01 rows=1)`
    }
  ];

  const selectedQuery = queries.find((q) => q.id === selectedQueryId) || queries[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-300 space-y-6">
      {/* Overview Block */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-cyan-400" />
          Financial SQL Playground & Transaction Controls
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-4xl">
          Observe and copy key transactional SQL sequences utilized inside real-world trading engines. These queries demonstrate how to guarantee asset integrity, execute atomic ledger transfers, and generate dashboard aggregates using optimized indexes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queries sidebar selector */}
        <div className="bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-3 h-fit shadow-2xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Shield className="w-4 h-4 text-cyan-400" />
            Core Query Catalog
          </h3>
          <div className="flex flex-col gap-2">
            {queries.map((q) => {
              const active = q.id === selectedQueryId;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQueryId(q.id)}
                  className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all duration-200 space-y-1 ${
                    active
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/5'
                      : 'bg-[#05060B]/80 hover:bg-white/5 border-white/5 text-slate-300'
                  }`}
                >
                  <span className="font-bold block tracking-tight">{q.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold inline-block font-sans ${
                    active ? 'bg-black/40 text-cyan-400 border border-cyan-500/25' : 'bg-black/20 text-slate-400 border border-white/5'
                  }`}>
                    {q.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Query viewer workspace */}
        <div className="bg-[#0F111A]/85 backdrop-blur-xl border border-white/10 rounded-xl p-6 lg:col-span-2 space-y-5 shadow-2xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              query_inspect: {selectedQuery.id}.sql
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {selectedQuery.description}
            </p>
          </div>

          {/* ACID security notice card */}
          <div className="bg-cyan-550/5 border border-cyan-500/20 rounded-lg p-4 space-y-1">
            <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              DBA Architectural Rationale
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedQuery.rationale}
            </p>
          </div>

          {/* Code Viewer Block */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Structured SQL Block:</span>
            <pre className="bg-black/40 p-4 border border-white/5 rounded-lg text-[10px] font-mono leading-relaxed text-slate-300 overflow-x-auto select-all max-h-72">
              {selectedQuery.sql}
            </pre>
          </div>

          {/* Explain Plan audit */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Optimizer Execution Path (Explain Plan)
            </span>
            <pre className="bg-black/40 p-4 border border-white/5 rounded-lg text-[10px] font-mono leading-normal text-cyan-400 overflow-x-auto select-all shadow-inner">
              {selectedQuery.explainPlan}
            </pre>
            <p className="text-[9px] text-slate-500 leading-normal font-sans">
              The query engine utilizes indexes directly, bypassing full-table scans. Row-level filters execute in O(log N) complexity, maintaining sub-millisecond latencies as the system scales to millions of orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
