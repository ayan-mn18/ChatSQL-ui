export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  result?: QueryResult;
}

export interface QueryResult {
  data: any[];
  columns: string[];
  error?: string;
}

export interface QueryRequest {
  query: string;
  uri: string;
}