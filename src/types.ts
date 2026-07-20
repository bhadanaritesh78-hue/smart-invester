export interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  foreignKeyTarget?: string; // Format: "table.column"
  isNullable: boolean;
  defaultValue?: string;
  description: string;
}

export interface Index {
  name: string;
  columns: string[];
  isUnique: boolean;
  description: string;
}

export interface Table {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  indexes: Index[];
  x: number; // For visualization positioning
  y: number; // For visualization positioning
  category: 'core' | 'user' | 'asset' | 'transaction' | 'extension';
}

export interface Relationship {
  id: string;
  fromTable: string; // The parent table (One side, e.g., "Users")
  fromColumn: string; // Typically "user_id"
  toTable: string; // The child table (Many or One side, e.g., "Profiles")
  toColumn: string; // Typically "user_id"
  type: '1:1' | '1:N';
  cardinality: 'one-to-one' | 'one-to-many';
  description: string;
}

export interface ExtensionPreset {
  id: string;
  name: string;
  description: string;
  tables: Table[];
  relationships: Relationship[];
}
