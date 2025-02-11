export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  result?: QueryResult;
}

export interface QueryResult {
  data: any[];
  info: QueryDesc
}

export interface QueryDesc {
  columns: string[];
  error?: string;
  query?: string;
  desc?: string;
  reasoning?: {
    steps: string[];
    optimization_notes: string[];
  };
  tables_used?: string[];
  columns_used?: string[];
}

export interface QueryRequest {
  query: string;
  uri: string;
}

export interface Settings {
  dbName: string;
  dbUri: string;
  aiModel: 'openai' | 'claude';
}