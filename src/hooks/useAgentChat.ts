// ============================================
// USE AGENT CHAT HOOK
// Manages agent session lifecycle, SSE events, and approval flow
// ============================================

import { useState, useRef, useCallback } from 'react';
import { agentService, AgentEvent, AgentPlanStep, AgentExecutionResult } from '@/services/agent.service';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'planning'
  | 'proposing'
  | 'executing'
  | 'analyzing'
  | 'completed'
  | 'error'
  | 'stopped';

export interface AgentMessage {
  id: string;
  type: 'user' | 'thinking' | 'plan' | 'proposal' | 'executing' | 'result' | 'analysis' | 'complete' | 'error' | 'stopped';
  content?: string;
  plan?: AgentPlanStep[];
  sql?: string;
  stepIndex?: number;
  stepDescription?: string;
  isRetry?: boolean;
  retryCount?: number;
  success?: boolean;
  rowCount?: number;
  affectedRows?: number;
  executionTime?: number;
  preview?: any[];
  error?: string;
  errorDetails?: { message: string; detail?: string; hint?: string };
  summary?: string;
  stepsCompleted?: number;
  totalSteps?: number;
  timestamp: Date;
}

interface UseAgentChatReturn {
  agentStatus: AgentStatus;
  agentMessages: AgentMessage[];
  agentSessionId: string | null;
  currentProposal: { sql: string; stepIndex: number; stepDescription: string; isRetry: boolean; retryCount: number } | null;
  isWaitingForApproval: boolean;
  isWaitingForExecution: boolean;
  startAgent: (connectionId: string, message: string, sessionId?: string, selectedSchemas?: string[]) => void;
  approveQuery: (connectionId: string, modifiedSql?: string) => Promise<void>;
  rejectQuery: (connectionId: string, reason?: string) => Promise<void>;
  sendExecutionResult: (connectionId: string, result: AgentExecutionResult) => Promise<void>;
  stopAgent: (connectionId: string) => Promise<void>;
  resetAgent: () => void;
}

export function useAgentChat(): UseAgentChatReturn {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null);
  const [, setChatSessionId] = useState<string | null>(null);
  const [currentProposal, setCurrentProposal] = useState<{
    sql: string;
    stepIndex: number;
    stepDescription: string;
    isRetry: boolean;
    retryCount: number;
  } | null>(null);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isWaitingForExecution, setIsWaitingForExecution] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((msg: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    setAgentMessages(prev => [
      ...prev,
      { ...msg, id: `agent-${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date() },
    ]);
  }, []);

  const handleEvent = useCallback((event: AgentEvent) => {
    switch (event.type) {
      case 'session':
        if (event.sessionId) setChatSessionId(event.sessionId);
        break;

      case 'agent_session':
        if (event.agentSessionId) setAgentSessionId(event.agentSessionId);
        break;

      case 'agent_thinking':
        setAgentStatus('thinking');
        addMessage({ type: 'thinking', content: event.message });
        break;

      case 'agent_plan':
        setAgentStatus('planning');
        addMessage({
          type: 'plan',
          plan: event.plan,
          content: event.message,
        });
        break;

      case 'agent_proposal':
        setAgentStatus('proposing');
        setIsWaitingForApproval(true);
        setCurrentProposal({
          sql: event.sql!,
          stepIndex: event.stepIndex!,
          stepDescription: event.stepDescription || '',
          isRetry: event.isRetry || false,
          retryCount: event.retryCount || 0,
        });
        addMessage({
          type: 'proposal',
          sql: event.sql,
          stepIndex: event.stepIndex,
          stepDescription: event.stepDescription || event.explanation,
          isRetry: event.isRetry,
          retryCount: event.retryCount,
          content: event.explanation,
        });
        break;

      case 'agent_executing':
        setAgentStatus('executing');
        setIsWaitingForApproval(false);
        setIsWaitingForExecution(true);
        setCurrentProposal(null);
        addMessage({
          type: 'executing',
          sql: event.sql,
          stepIndex: event.stepIndex,
        });
        break;

      case 'agent_result':
        setIsWaitingForExecution(false);
        setAgentStatus('analyzing');
        addMessage({
          type: 'result',
          stepIndex: event.stepIndex,
          success: event.success,
          rowCount: event.rowCount,
          affectedRows: event.affectedRows,
          executionTime: event.executionTime,
          preview: event.preview,
          error: event.error,
          errorDetails: event.errorDetails,
        });
        break;

      case 'content':
        addMessage({
          type: 'analysis',
          content: event.content,
        });
        break;

      case 'agent_complete':
        setAgentStatus('completed');
        setIsWaitingForApproval(false);
        setIsWaitingForExecution(false);
        setCurrentProposal(null);
        addMessage({
          type: 'complete',
          summary: event.summary,
          stepsCompleted: event.stepsCompleted,
          totalSteps: event.totalSteps,
        });
        break;

      case 'agent_error':
        if (!event.recoverable) {
          setAgentStatus('error');
          setIsWaitingForApproval(false);
          setIsWaitingForExecution(false);
          setCurrentProposal(null);
        }
        addMessage({
          type: 'error',
          error: event.error,
        });
        break;

      case 'agent_stopped':
        setAgentStatus('stopped');
        setIsWaitingForApproval(false);
        setIsWaitingForExecution(false);
        setCurrentProposal(null);
        addMessage({
          type: 'stopped',
          content: event.message,
        });
        break;
    }
  }, [addMessage]);

  const startAgent = useCallback((
    connectionId: string,
    message: string,
    sessionId?: string,
    selectedSchemas: string[] = []
  ) => {
    // Reset state
    setAgentStatus('thinking');
    setAgentMessages([]);
    setAgentSessionId(null);
    setCurrentProposal(null);
    setIsWaitingForApproval(false);
    setIsWaitingForExecution(false);

    // Add user message
    addMessage({ type: 'user', content: message });

    // Cancel previous connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = agentService.startAgent(
      connectionId,
      message,
      sessionId,
      selectedSchemas,
      handleEvent,
      (error) => {
        setAgentStatus('error');
        addMessage({ type: 'error', error: error.message });
      },
      () => {
        // SSE connection closed
      }
    );
  }, [addMessage, handleEvent]);

  const approveQuery = useCallback(async (connectionId: string, modifiedSql?: string) => {
    if (!agentSessionId) return;
    try {
      await agentService.approve(connectionId, agentSessionId, modifiedSql);
    } catch (err: any) {
      addMessage({ type: 'error', error: `Failed to approve: ${err.message}` });
    }
  }, [agentSessionId, addMessage]);

  const rejectQuery = useCallback(async (connectionId: string, reason?: string) => {
    if (!agentSessionId) return;
    try {
      setIsWaitingForApproval(false);
      setCurrentProposal(null);
      await agentService.reject(connectionId, agentSessionId, reason);
    } catch (err: any) {
      addMessage({ type: 'error', error: `Failed to reject: ${err.message}` });
    }
  }, [agentSessionId, addMessage]);

  const sendExecutionResult = useCallback(async (connectionId: string, result: AgentExecutionResult) => {
    if (!agentSessionId) return;
    try {
      await agentService.sendResult(connectionId, agentSessionId, result);
    } catch (err: any) {
      addMessage({ type: 'error', error: `Failed to send result: ${err.message}` });
    }
  }, [agentSessionId, addMessage]);

  const stopAgent = useCallback(async (connectionId: string) => {
    if (!agentSessionId) return;
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      await agentService.stop(connectionId, agentSessionId);
    } catch (err: any) {
      // Might fail if already stopped
    }
    setAgentStatus('stopped');
    setIsWaitingForApproval(false);
    setIsWaitingForExecution(false);
    setCurrentProposal(null);
  }, [agentSessionId]);

  const resetAgent = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAgentStatus('idle');
    setAgentMessages([]);
    setAgentSessionId(null);
    setCurrentProposal(null);
    setIsWaitingForApproval(false);
    setIsWaitingForExecution(false);
  }, []);

  return {
    agentStatus,
    agentMessages,
    agentSessionId,
    currentProposal,
    isWaitingForApproval,
    isWaitingForExecution,
    startAgent,
    approveQuery,
    rejectQuery,
    sendExecutionResult,
    stopAgent,
    resetAgent,
  };
}
