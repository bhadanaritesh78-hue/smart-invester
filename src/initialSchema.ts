import { Table, Relationship, ExtensionPreset } from './types';

export const initialTables: Table[] = [
  {
    id: 'users',
    name: 'users',
    description: 'Core table storing investor account details, security credentials, and compliance states.',
    category: 'user',
    x: 400,
    y: 100,
    columns: [
      { name: 'user_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key. Universally unique identifier.' },
      { name: 'full_name', type: 'VARCHAR(100)', isPrimaryKey: false, isNullable: false, description: 'Full legal name of the investor.' },
      { name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, description: 'Unique email address, used for login.' },
      { name: 'phone', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: true, description: 'Unique mobile number for SMS OTP.' },
      { name: 'password_hash', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false, description: 'Securely salted password hash (bcrypt/argon2).' },
      { name: 'KYC_status', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, defaultValue: "'PENDING'", description: "KYC verification state: 'PENDING', 'APPROVED', 'REJECTED'." },
      { name: 'account_status', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, defaultValue: "'ACTIVE'", description: "Account state: 'ACTIVE', 'SUSPENDED', 'FROZEN'." },
      { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Timestamp of registration.' }
    ],
    indexes: [
      { name: 'idx_users_email_uniq', columns: ['email'], isUnique: true, description: 'Enforces unique logins and speeds up auth lookups.' },
      { name: 'idx_users_phone_uniq', columns: ['phone'], isUnique: true, description: 'Enforces unique phone numbers for MFA.' }
    ]
  },
  {
    id: 'profiles',
    name: 'profiles',
    description: 'Detailed demographic profiles, investor risk tolerances, and investment objectives.',
    category: 'user',
    x: 100,
    y: 50,
    columns: [
      { name: 'profile_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'Foreign Key referencing users. One-to-One enforcement.' },
      { name: 'date_of_birth', type: 'DATE', isPrimaryKey: false, isNullable: false, description: 'Date of birth for age-based legal compliance.' },
      { name: 'address', type: 'TEXT', isPrimaryKey: false, isNullable: true, description: 'Permanent residential address for compliance.' },
      { name: 'risk_level', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, description: "Risk classification: 'CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'." },
      { name: 'investment_goal', type: 'VARCHAR(50)', isPrimaryKey: false, isNullable: false, description: "Investor objective: 'RETIREMENT', 'WEALTH_GROWTH', 'EDUCATION'." }
    ],
    indexes: [
      { name: 'idx_profiles_user_id_uniq', columns: ['user_id'], isUnique: true, description: 'Enforces the strict One-to-One relationship with users.' }
    ]
  },
  {
    id: 'wallets',
    name: 'wallets',
    description: 'Liquid cash ledger storing checking/wallet balances for trades and withdrawals.',
    category: 'core',
    x: 100,
    y: 280,
    columns: [
      { name: 'wallet_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'Foreign Key referencing users. One-to-One ledger.' },
      { name: 'balance', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, defaultValue: '0.0000', description: 'Liquid cash balance. Guaranteed non-negative via CHECK constraint.' },
      { name: 'currency', type: 'VARCHAR(3)', isPrimaryKey: false, isNullable: false, defaultValue: "'USD'", description: 'ISO 3-letter currency code (e.g. USD, EUR).' }
    ],
    indexes: [
      { name: 'idx_wallets_user_id_uniq', columns: ['user_id'], isUnique: true, description: 'Enforces One-to-One mapping of users to primary wallet.' }
    ]
  },
  {
    id: 'bank_accounts',
    name: 'bank_accounts',
    description: 'Linked depository bank details used for cash deposits, liquidations, and payouts.',
    category: 'user',
    x: 100,
    y: 510,
    columns: [
      { name: 'bank_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'Foreign Key linking to users. One user can have many banks.' },
      { name: 'bank_name', type: 'VARCHAR(100)', isPrimaryKey: false, isNullable: false, description: 'Name of bank institution (e.g., Chase, Wells Fargo).' },
      { name: 'account_number', type: 'VARCHAR(30)', isPrimaryKey: false, isNullable: false, description: 'Encrypted or masked bank account number.' },
      { name: 'IFSC', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, description: 'IFSC / Routing number / IBAN for settlements.' },
      { name: 'verification_status', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, defaultValue: "'PENDING'", description: "Verification state: 'PENDING', 'VERIFIED', 'FAILED'." }
    ],
    indexes: [
      { name: 'idx_bank_accounts_user_id', columns: ['user_id'], isUnique: false, description: 'Speeds up listing of linked accounts for a user.' }
    ]
  },
  {
    id: 'notifications',
    name: 'notifications',
    description: 'System-generated alerts, compliance alerts, and transactional messages sent to user.',
    category: 'user',
    x: 100,
    y: 740,
    columns: [
      { name: 'notification_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'Foreign Key referencing Users. Relates 1:N.' },
      { name: 'title', type: 'VARCHAR(150)', isPrimaryKey: false, isNullable: false, description: 'Short alert header.' },
      { name: 'message', type: 'TEXT', isPrimaryKey: false, isNullable: false, description: 'Detailed notice payload.' },
      { name: 'status', type: 'VARCHAR(10)', isPrimaryKey: false, isNullable: false, defaultValue: "'UNREAD'", description: "State: 'UNREAD', 'READ'." },
      { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'When the alert was pushed.' }
    ],
    indexes: [
      { name: 'idx_notifications_user_status', columns: ['user_id', 'status'], isUnique: false, description: 'Speeds up fetching count of unread messages.' }
    ]
  },
  {
    id: 'portfolios',
    name: 'portfolios',
    description: 'Portfolios are logical groupings of holdings. A user can create retirement, tax-advantaged, or generic trading portfolios.',
    category: 'core',
    x: 750,
    y: 100,
    columns: [
      { name: 'portfolio_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'Foreign Key referencing Users.' },
      { name: 'portfolio_name', type: 'VARCHAR(100)', isPrimaryKey: false, isNullable: false, description: 'Name of the sub-portfolio.' },
      { name: 'total_value', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, defaultValue: '0.0000', description: 'Derived/cached total valuation. Optimized for dashboards.' }
    ],
    indexes: [
      { name: 'idx_portfolios_user_id', columns: ['user_id'], isUnique: false, description: 'Optimizes loading all portfolios for a single investor.' }
    ]
  },
  {
    id: 'holdings',
    name: 'holdings',
    description: 'Stores quantity and cost-basis values for assets purchased inside a specific portfolio.',
    category: 'core',
    x: 1100,
    y: 100,
    columns: [
      { name: 'holding_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'portfolio_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'portfolios.portfolio_id', isNullable: false, description: 'Foreign Key referencing Portfolios. Relates 1:N.' },
      { name: 'asset_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'assets.asset_id', isNullable: false, description: 'Foreign Key referencing Assets. Relates 1:1.' },
      { name: 'quantity', type: 'NUMERIC(18,8)', isPrimaryKey: false, isNullable: false, description: 'Total shares/tokens owned. Allows fractional units for mutual funds and crypto.' },
      { name: 'average_price', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, description: 'Weighted average price (cost basis) of purchases.' }
    ],
    indexes: [
      { name: 'idx_holdings_portfolio_asset', columns: ['portfolio_id', 'asset_id'], isUnique: true, description: 'Enforces that an asset has exactly one row per portfolio.' },
      { name: 'idx_holdings_asset_id', columns: ['asset_id'], isUnique: false, description: 'Optimizes lookups to find which investors hold a certain asset (e.g. for split/dividend events).' }
    ]
  },
  {
    id: 'assets',
    name: 'assets',
    description: 'Master list of investable vehicles across stock, ETF, mutual fund, crypto, and fixed-income categories.',
    category: 'asset',
    x: 1100,
    y: 430,
    columns: [
      { name: 'asset_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'asset_name', type: 'VARCHAR(150)', isPrimaryKey: false, isNullable: false, description: 'Official legal name of the asset (e.g., Apple Inc., Bitcoin).' },
      { name: 'asset_type', type: 'VARCHAR(30)', isPrimaryKey: false, isNullable: false, description: "Type of asset: 'STOCK', 'MUTUAL_FUND', 'ETF', 'CRYPTO', 'FIXED_INCOME'." },
      { name: 'ticker_symbol', type: 'VARCHAR(15)', isPrimaryKey: false, isNullable: false, description: 'Global identifier (e.g., AAPL, BTC, FXNAX).' },
      { name: 'current_price', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, description: 'Current trading price. Regularly synchronized with market feed.' },
      { name: 'market', type: 'VARCHAR(30)', isPrimaryKey: false, isNullable: false, description: "Market identifier: 'NYSE', 'NASDAQ', 'AMEX', 'BINANCE', 'COINBASE', 'MUTUAL_FUND_MARKET'." }
    ],
    indexes: [
      { name: 'idx_assets_ticker_uniq', columns: ['ticker_symbol'], isUnique: true, description: 'Ensures ticker symbol uniqueness across the platform.' },
      { name: 'idx_assets_type', columns: ['asset_type'], isUnique: false, description: 'Speeds up filtering assets by category.' }
    ]
  },
  {
    id: 'transactions',
    name: 'transactions',
    description: 'Double-entry trade ledger recording buys, sells, and execution data for security audits.',
    category: 'transaction',
    x: 750,
    y: 430,
    columns: [
      { name: 'transaction_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'Foreign Key referencing Users.' },
      { name: 'asset_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'assets.asset_id', isNullable: false, description: 'Foreign Key referencing Assets.' },
      { name: 'transaction_type', type: 'VARCHAR(10)', isPrimaryKey: false, isNullable: false, description: "Type: 'BUY' or 'SELL'." },
      { name: 'quantity', type: 'NUMERIC(18,8)', isPrimaryKey: false, isNullable: false, description: 'Amount bought/sold. Supports micro-shares/decimals.' },
      { name: 'price', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, description: 'Price per share/token at transaction execution.' },
      { name: 'total_amount', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, description: 'Total value of transaction (usually price * quantity + fees).' },
      { name: 'transaction_date', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Execution timestamp.' }
    ],
    indexes: [
      { name: 'idx_transactions_user_date', columns: ['user_id', 'transaction_date'], isUnique: false, description: 'Critical for loading historical timelines for a specific user quickly.' },
      { name: 'idx_transactions_asset_id', columns: ['asset_id'], isUnique: false, description: 'Assists in analyzing trade volumes and volumes per asset.' }
    ]
  },
  {
    id: 'watchlist',
    name: 'watchlist',
    description: 'Mapping of assets flagged by user for short-term price tracing.',
    category: 'asset',
    x: 450,
    y: 470,
    columns: [
      { name: 'watchlist_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
      { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'Foreign Key referencing Users.' },
      { name: 'asset_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'assets.asset_id', isNullable: false, description: 'Foreign Key referencing Assets.' }
    ],
    indexes: [
      { name: 'idx_watchlist_user_asset_uniq', columns: ['user_id', 'asset_id'], isUnique: true, description: 'Ensures an asset is watched only once by a given user.' }
    ]
  }
];

export const initialRelationships: Relationship[] = [
  {
    id: 'rel_users_profiles',
    fromTable: 'users',
    fromColumn: 'user_id',
    toTable: 'profiles',
    toColumn: 'user_id',
    type: '1:1',
    cardinality: 'one-to-one',
    description: 'A user possesses exactly one profile containing compliance and goal parameters.'
  },
  {
    id: 'rel_users_wallets',
    fromTable: 'users',
    fromColumn: 'user_id',
    toTable: 'wallets',
    toColumn: 'user_id',
    type: '1:1',
    cardinality: 'one-to-one',
    description: 'A user owns exactly one ledger wallet determining their transactional buying power.'
  },
  {
    id: 'rel_users_portfolios',
    fromTable: 'users',
    fromColumn: 'user_id',
    toTable: 'portfolios',
    toColumn: 'user_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'A user can segregate their capital into multiple investment sub-portfolios.'
  },
  {
    id: 'rel_portfolios_holdings',
    fromTable: 'portfolios',
    fromColumn: 'portfolio_id',
    toTable: 'holdings',
    toColumn: 'portfolio_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'A portfolio groups multiple holding rows together for valuation reporting.'
  },
  {
    id: 'rel_assets_holdings',
    fromTable: 'assets',
    fromColumn: 'asset_id',
    toTable: 'holdings',
    toColumn: 'asset_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'Each holding row tracks a specific underlying investable asset.'
  },
  {
    id: 'rel_users_transactions',
    fromTable: 'users',
    fromColumn: 'user_id',
    toTable: 'transactions',
    toColumn: 'user_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'A user records an audit history of trades they execute.'
  },
  {
    id: 'rel_assets_transactions',
    fromTable: 'assets',
    fromColumn: 'asset_id',
    toTable: 'transactions',
    toColumn: 'asset_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'A transaction record ties back to a specific traded asset in the catalog.'
  },
  {
    id: 'rel_users_watchlist',
    fromTable: 'users',
    fromColumn: 'user_id',
    toTable: 'watchlist',
    toColumn: 'user_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'A user can add numerous items to their market watchlist.'
  },
  {
    id: 'rel_assets_watchlist',
    fromTable: 'assets',
    fromColumn: 'asset_id',
    toTable: 'watchlist',
    toColumn: 'asset_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'Each watchlist row points to an asset that the investor wants to track.'
  },
  {
    id: 'rel_users_bank_accounts',
    fromTable: 'users',
    fromColumn: 'user_id',
    toTable: 'bank_accounts',
    toColumn: 'user_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'An investor can link multiple external depository banks to settle deposits/payouts.'
  },
  {
    id: 'rel_users_notifications',
    fromTable: 'users',
    fromColumn: 'user_id',
    toTable: 'notifications',
    toColumn: 'user_id',
    type: '1:N',
    cardinality: 'one-to-many',
    description: 'A user accumulates notifications logging platform alerts.'
  }
];

export const extensionPresets: ExtensionPreset[] = [
  {
    id: 'ext_sips_recurring',
    name: 'SIPs & Recurring Investments',
    description: 'Adds support for automatic Systematic Investment Plans (SIPs) and recurring scheduled buy-orders.',
    tables: [
      {
        id: 'sips',
        name: 'sips',
        description: 'Systematic Investment Plans directing auto-buy scripts to invest fixed cash on schedules.',
        category: 'extension',
        x: 450,
        y: 680,
        columns: [
          { name: 'sip_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
          { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'FK referencing users. Direct owner.' },
          { name: 'portfolio_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'portfolios.portfolio_id', isNullable: false, description: 'FK referencing portfolio to drop assets in.' },
          { name: 'asset_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'assets.asset_id', isNullable: false, description: 'FK referencing target asset to buy.' },
          { name: 'amount', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, description: 'Fixed cash amount to buy on each cycle.' },
          { name: 'frequency', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, description: "Cycle frequency: 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'." },
          { name: 'next_execution_date', type: 'DATE', isPrimaryKey: false, isNullable: false, description: 'Date of next automated buy execution.' },
          { name: 'status', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, defaultValue: "'ACTIVE'", description: "State: 'ACTIVE', 'PAUSED', 'COMPLETED'." },
          { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'When the SIP was started.' }
        ],
        indexes: [
          { name: 'idx_sips_next_exec', columns: ['next_execution_date', 'status'], isUnique: false, description: 'Critical for cron jobs querying active orders due today.' },
          { name: 'idx_sips_user_id', columns: ['user_id'], isUnique: false, description: 'Optimizes loading active SIP schedules for a user.' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel_users_sips',
        fromTable: 'users',
        fromColumn: 'user_id',
        toTable: 'sips',
        toColumn: 'user_id',
        type: '1:N',
        cardinality: 'one-to-many',
        description: 'A user sets up multiple recurring automated investment cycles.'
      },
      {
        id: 'rel_portfolios_sips',
        fromTable: 'portfolios',
        fromColumn: 'portfolio_id',
        toTable: 'sips',
        toColumn: 'portfolio_id',
        type: '1:N',
        cardinality: 'one-to-many',
        description: 'A SIP is configured to purchase assets into a targeted investor portfolio.'
      },
      {
        id: 'rel_assets_sips',
        fromTable: 'assets',
        fromColumn: 'asset_id',
        toTable: 'sips',
        toColumn: 'asset_id',
        type: '1:N',
        cardinality: 'one-to-many',
        description: 'A recurring SIP purchases a specified target security.'
      }
    ]
  },
  {
    id: 'ext_dividends',
    name: 'Dividends & Corporate Actions',
    description: 'Enables dividend distribution registry tracking, ex-dates, and direct cash disbursements to user wallets.',
    tables: [
      {
        id: 'dividends',
        name: 'dividends',
        description: 'Registry of announced corporate dividends detailing ex-date and rate per share/token.',
        category: 'extension',
        x: 1400,
        y: 430,
        columns: [
          { name: 'dividend_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
          { name: 'asset_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'assets.asset_id', isNullable: false, description: 'FK referencing the distributing asset.' },
          { name: 'amount_per_share', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, description: 'Cash payout distribution rate per share/unit.' },
          { name: 'ex_date', type: 'DATE', isPrimaryKey: false, isNullable: false, description: 'Date by which investor must own asset to qualify.' },
          { name: 'record_date', type: 'DATE', isPrimaryKey: false, isNullable: false, description: 'Date to seal roster of qualifying holding records.' },
          { name: 'payment_date', type: 'DATE', isPrimaryKey: false, isNullable: false, description: 'Actual date of cash payout dispatch.' },
          { name: 'status', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, defaultValue: "'ANNOUNCED'", description: "State: 'ANNOUNCED', 'PROCESSED', 'CANCELLED'." }
        ],
        indexes: [
          { name: 'idx_dividends_payment_date', columns: ['payment_date'], isUnique: false, description: 'Enables prompt dispatch runs on payment days.' },
          { name: 'idx_dividends_asset_ex', columns: ['asset_id', 'ex_date'], isUnique: false, description: 'Optimizes lookup of active dividend announcements.' }
        ]
      },
      {
        id: 'dividend_payouts',
        name: 'dividend_payouts',
        description: 'Ledger tracking discrete payouts issued to individual qualifying portfolio owners.',
        category: 'extension',
        x: 1400,
        y: 100,
        columns: [
          { name: 'payout_id', type: 'UUID', isPrimaryKey: true, isNullable: false, description: 'Primary Key.' },
          { name: 'dividend_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'dividends.dividend_id', isNullable: false, description: 'FK referencing parent dividend announcement.' },
          { name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'users.user_id', isNullable: false, description: 'FK referencing user receiving the funds.' },
          { name: 'holding_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTarget: 'holdings.holding_id', isNullable: false, description: 'FK referencing the target holding context on ex-date.' },
          { name: 'qualified_quantity', type: 'NUMERIC(18,8)', isPrimaryKey: false, isNullable: false, description: 'Snapshot quantity owned on record date.' },
          { name: 'payout_amount', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, description: 'Total payout amount (qualified_quantity * amount_per_share).' },
          { name: 'status', type: 'VARCHAR(20)', isPrimaryKey: false, isNullable: false, defaultValue: "'PENDING'", description: "Payout state: 'PENDING', 'PAID', 'FAILED'." },
          { name: 'paid_at', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: true, description: 'Actual time of wallet cash deposit.' }
        ],
        indexes: [
          { name: 'idx_payouts_user_status', columns: ['user_id', 'status'], isUnique: false, description: 'Speeds up listing pending or completed dividend incomes for user.' },
          { name: 'idx_payouts_dividend_id', columns: ['dividend_id'], isUnique: false, description: 'Enables quick bulk status updates per dividend.' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel_assets_dividends',
        fromTable: 'assets',
        fromColumn: 'asset_id',
        toTable: 'dividends',
        toColumn: 'asset_id',
        type: '1:N',
        cardinality: 'one-to-many',
        description: 'An asset issues historical dividends over time.'
      },
      {
        id: 'rel_dividends_payouts',
        fromTable: 'dividends',
        fromColumn: 'dividend_id',
        toTable: 'dividend_payouts',
        toColumn: 'dividend_id',
        type: '1:N',
        cardinality: 'one-to-many',
        description: 'A dividend distribution records multiple discrete payout receipts for qualifying investors.'
      },
      {
        id: 'rel_users_payouts',
        fromTable: 'users',
        fromColumn: 'user_id',
        toTable: 'dividend_payouts',
        toColumn: 'user_id',
        type: '1:N',
        cardinality: 'one-to-many',
        description: 'An investor accumulates passive dividend payouts over their lifecycle.'
      },
      {
        id: 'rel_holdings_payouts',
        fromTable: 'holdings',
        fromColumn: 'holding_id',
        toTable: 'dividend_payouts',
        toColumn: 'holding_id',
        type: '1:N',
        cardinality: 'one-to-many',
        description: 'A dividend payout ties back to the snapshot holding record that generated it.'
      }
    ]
  },
  {
    id: 'ext_realtime_ticks',
    name: 'Real-Time Market Feeds',
    description: 'Schema optimized for high-volume timeseries logs to trace asset tick movements without slowing down relational transaction records.',
    tables: [
      {
        id: 'asset_prices_timeseries',
        name: 'asset_prices_timeseries',
        description: 'High-speed timeseries tick table. In production, this table is usually partitioned by time (e.g., hypertable or daily tables) or backed by a timeseries storage engine.',
        category: 'extension',
        x: 1400,
        y: 740,
        columns: [
          { name: 'time', type: 'TIMESTAMP', isPrimaryKey: true, isNullable: false, description: 'Primary Key part 1. Exact timestamp of the tick event.' },
          { name: 'asset_id', type: 'UUID', isPrimaryKey: true, isNullable: false, isForeignKey: true, foreignKeyTarget: 'assets.asset_id', description: 'Primary Key part 2. Foreign Key pointing to Asset catalog.' },
          { name: 'price', type: 'NUMERIC(15,4)', isPrimaryKey: false, isNullable: false, description: 'Spot tick price.' },
          { name: 'volume_24h', type: 'NUMERIC(18,4)', isPrimaryKey: false, isNullable: true, description: 'Rolling 24-hour trading volume.' }
        ],
        indexes: [
          { name: 'idx_timeseries_composite', columns: ['asset_id', 'time DESC'], isUnique: false, description: 'Critical timeseries index for rapid rendering of historical charts.' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel_assets_timeseries',
        fromTable: 'assets',
        fromColumn: 'asset_id',
        toTable: 'asset_prices_timeseries',
        toColumn: 'asset_id',
        type: '1:N',
        cardinality: 'one-to-many',
        description: 'An asset generates millions of streaming price tick updates recorded in timeseries.'
      }
    ]
  }
];
