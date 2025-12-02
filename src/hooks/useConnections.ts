import { useState, useEffect } from 'react';

export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'mongodb';
  host: string;
  port: string;
  user: string;
  database: string;
  createdAt: string;
}

export function useConnections() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('chatsql_connections');
    if (stored) {
      setConnections(JSON.parse(stored));
    }
  }, []);

  const saveConnections = (newConnections: DatabaseConnection[]) => {
    setConnections(newConnections);
    localStorage.setItem('chatsql_connections', JSON.stringify(newConnections));
  };

  const addConnection = (connection: Omit<DatabaseConnection, 'id' | 'createdAt'>) => {
    const newConnection: DatabaseConnection = {
      ...connection,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    saveConnections([...connections, newConnection]);
  };

  const removeConnection = (id: string) => {
    saveConnections(connections.filter((c) => c.id !== id));
  };

  const testConnection = async (details: any) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true); // Always succeed for mock
      }, 1500);
    });
  };

  return {
    connections,
    addConnection,
    removeConnection,
    testConnection,
  };
}
