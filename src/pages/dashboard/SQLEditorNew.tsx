import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Sparkles,
  Save,
  Download,
  BarChart3,
  Table as TableIcon,
  AlertCircle,
  Loader2,
  Database,
  ChevronDown,
  X,
  Info,
  Settings2,
} from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import DataTable from '@/components/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Parser } from 'node-sql-parser';
import Editor from 'react-simple-code-editor';
import Prism from '@/lib/prism-setup';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';
import toast from 'react-hot-toast';

// Chart imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

// Services
import { connectionService } from '@/services/connection.service';
import { aiService, AIJobResult } from '@/services/ai.service';
import { DatabaseSchemaPublic } from '@/types';

// ============================================
// TYPES
// ============================================

interface QueryResultState {
  rows: any[];
  columns: string[];
  rowCount: number;
  executionTime: number;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  xAxis: string;
  yAxis: string[];
  title: string;
}

// ============================================
// SQL EDITOR COMPONENT
// ============================================

export default function SQLEditor() {
  const { connectionId } = useParams<{ connectionId: string }>();

  // Query state
  const [query, setQuery] = useState(`-- Write your SQL query here\nSELECT * FROM `);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<QueryResultState | null>(null);

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<AIJobResult['result'] | null>(null);

  // Schema state
  const [schemas, setSchemas] = useState<DatabaseSchemaPublic[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);

  // Chart configuration
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxis: '',
    yAxis: [],
    title: 'Query Results',
  });
  const [showChartConfig, setShowChartConfig] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('table');

  const parser = useMemo(() => new Parser(), []);

  // ============================================
  // FETCH SCHEMAS ON MOUNT
  // ============================================

  useEffect(() => {
    if (connectionId) {
      fetchSchemas();
    }
  }, [connectionId]);

  const fetchSchemas = async () => {
    if (!connectionId) return;

    setLoadingSchemas(true);
    try {
      const response = await connectionService.getSchemas(connectionId);
      // Backend returns { success, schemas } not { success, data }
      const schemasData = (response as any).schemas || response.data;
      if (response.success && schemasData) {
        setSchemas(schemasData);
        // Pre-select schemas that are marked as selected
        const preSelected = schemasData
          .filter((s: DatabaseSchemaPublic) => s.is_selected)
          .map((s: DatabaseSchemaPublic) => s.schema_name);
        setSelectedSchemas(preSelected.length > 0 ? preSelected : ['public']);
      }
    } catch (err) {
      console.error('Failed to fetch schemas:', err);
    } finally {
      setLoadingSchemas(false);
    }
  };

  // ============================================
  // SQL VALIDATION
  // ============================================

  const validateSQL = useCallback((sql: string) => {
    if (!sql.trim()) {
      setError(null);
      return true;
    }
    try {
      parser.astify(sql, { database: 'postgresql' });
      setError(null);
      return true;
    } catch (err: any) {
      setError(`Syntax Error: ${err.message}`);
      return false;
    }
  }, [parser]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    validateSQL(newQuery);
  }, [validateSQL]);

  // ============================================
  // RUN QUERY
  // ============================================

  const handleRunQuery = async () => {
    if (!connectionId) {
      toast.error('No connection selected');
      return;
    }

    if (!query.trim()) {
      setError('Query cannot be empty');
      return;
    }

    if (error) {
      toast.error('Please fix syntax errors before running');
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      const response = await connectionService.executeQuery(connectionId, query, true);

      // Handle response - backend returns rows/rowCount at top level, not nested in data
      const responseData = response.data || response;
      const rows = (responseData as any).rows || [];
      const rowCount = (responseData as any).rowCount || rows.length;
      const executionTime = (responseData as any).executionTime || 0;

      if (response.success) {
        setResults({
          rows,
          columns: rows.length > 0 ? Object.keys(rows[0]) : [],
          rowCount,
          executionTime,
        });

        // Auto-detect chart config
        if (rows.length > 0) {
          autoDetectChartConfig(rows);
        }

        toast.success(`Query returned ${rowCount} rows in ${executionTime}ms`);
      } else {
        setError(response.error || 'Query failed');
        toast.error(response.error || 'Query failed');
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to execute query';
      setError(message);
      toast.error(message);
    } finally {
      setIsRunning(false);
    }
  };

  // ============================================
  // AI SQL GENERATION
  // ============================================

  // Typing animation effect - faster chunked typing for better UX
  const typeText = async (text: string) => {
    setIsTyping(true);
    setQuery('');

    // Type in chunks for faster display (5-10 chars at a time)
    const chunkSize = 8;
    const delay = 10; // ms between chunks

    for (let i = 0; i <= text.length; i += chunkSize) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setQuery(text.substring(0, Math.min(i + chunkSize, text.length)));
    }

    // Ensure final text is complete
    setQuery(text);
    setIsTyping(false);
  };

  const handleGenerateSQL = async () => {
    if (!connectionId) {
      toast.error('No connection selected');
      return;
    }

    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    // Save prompt before clearing
    const currentPrompt = aiPrompt;

    // Immediately close modal and show loading animation in editor
    setIsAiOpen(false);
    setAiPrompt('');
    setIsGenerating(true);
    setAiReasoning(null);
    setError(null);
    setQuery(''); // Clear editor to show loading state

    try {
      console.log('[AI] Starting SQL generation for prompt:', currentPrompt);

      // Start the job and wait for result via SSE
      const result = await aiService.generateSqlAndWait(
        connectionId,
        currentPrompt,
        selectedSchemas
      );

      console.log('[AI] Full Result:', JSON.stringify(result, null, 2));

      // Handle different response structures
      // result could be: { jobId, type, success, result: { sql, ... } }
      // or directly: { sql, explanation, ... }
      const sqlResult = result.result || result;
      let sql = (sqlResult as any).sql || (sqlResult as any).query || '';
      const tablesUsed = (sqlResult as any).tables_used || [];

      // Clean up escaped newlines if present
      if (typeof sql === 'string') {
        sql = sql.replace(/\\n/g, '\n');
      }

      console.log('[AI] Extracted SQL:', sql);

      if (sql) {
        // Stop the generating animation before typing
        setIsGenerating(false);

        // Format the generated SQL nicely
        const generatedSQL = `-- AI Generated: "${currentPrompt}"\n-- Tables used: ${tablesUsed.join(', ') || 'unknown'}\n\n${sql}`;

        setAiReasoning(sqlResult as any);

        // Type out the SQL with fast animation
        await typeText(generatedSQL);

        toast.success('SQL generated successfully!');
      } else {
        console.error('[AI] No SQL in result:', result);
        setIsGenerating(false);
        toast.error('AI generated empty response - please try again');
      }
    } catch (err: any) {
      console.error('[AI] Generation Error:', err);
      setIsGenerating(false);
      toast.error(err.message || 'Failed to generate SQL');
    }
  };

  // ============================================
  // CHART AUTO-DETECTION
  // ============================================

  const autoDetectChartConfig = (rows: any[]) => {
    if (!rows.length) return;

    const columns = Object.keys(rows[0]);
    const fieldTypes = analyzeFieldTypes(rows, columns);

    const numericFields = columns.filter(col => fieldTypes[col].isNumeric);
    const categoryFields = columns.filter(col => !fieldTypes[col].isNumeric);
    const dateFields = columns.filter(col => fieldTypes[col].isDate);

    // Determine best chart type
    let chartType: ChartConfig['type'] = 'bar';
    if (rows.length <= 10 && numericFields.length === 1 && categoryFields.length > 0) {
      chartType = 'pie';
    } else if (dateFields.length > 0 || rows.length > 20) {
      chartType = 'line';
    }

    setChartConfig({
      type: chartType,
      xAxis: categoryFields[0] || dateFields[0] || columns[0],
      yAxis: numericFields.slice(0, 3), // Max 3 series
      title: 'Query Results',
    });
  };

  const analyzeFieldTypes = (rows: any[], columns: string[]) => {
    return columns.reduce((acc, field) => {
      const values = rows.map(item => item[field]).filter(v => v != null);
      const isNumeric = values.every(v => !isNaN(Number(String(v).replace(/[,$]/g, ''))));
      const isDate = values.every(v => !isNaN(Date.parse(String(v))));

      acc[field] = { isNumeric, isDate, isCategory: !isNumeric && !isDate };
      return acc;
    }, {} as Record<string, { isNumeric: boolean; isDate: boolean; isCategory: boolean }>);
  };

  // ============================================
  // CHART DATA GENERATION
  // ============================================

  const chartData = useMemo(() => {
    if (!results?.rows.length || !chartConfig.xAxis || !chartConfig.yAxis.length) {
      return null;
    }

    const labels = results.rows.map(row => {
      const val = row[chartConfig.xAxis];
      if (val instanceof Date) return val.toLocaleDateString();
      return String(val ?? 'N/A');
    });

    const colors = [
      { bg: 'rgba(139, 92, 246, 0.7)', border: '#8b5cf6' },
      { bg: 'rgba(6, 182, 212, 0.7)', border: '#06b6d4' },
      { bg: 'rgba(16, 185, 129, 0.7)', border: '#10b981' },
      { bg: 'rgba(245, 158, 11, 0.7)', border: '#f59e0b' },
      { bg: 'rgba(236, 72, 153, 0.7)', border: '#ec4899' },
    ];

    const datasets = chartConfig.yAxis.map((field, idx) => ({
      label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      data: results.rows.map(row => {
        const val = row[field];
        return Number(String(val).replace(/[,$]/g, '')) || 0;
      }),
      backgroundColor: chartConfig.type === 'pie' || chartConfig.type === 'doughnut'
        ? colors.map(c => c.bg)
        : colors[idx % colors.length].bg,
      borderColor: chartConfig.type === 'pie' || chartConfig.type === 'doughnut'
        ? colors.map(c => c.border)
        : colors[idx % colors.length].border,
      borderWidth: 2,
      tension: 0.4,
      fill: chartConfig.type === 'line',
    }));

    return { labels, datasets };
  }, [results, chartConfig]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: chartConfig.title,
        color: '#f8fafc',
        font: { size: 14 },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: chartConfig.type !== 'pie' && chartConfig.type !== 'doughnut' ? {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
        border: { display: false },
      },
    } : undefined,
  }), [chartConfig]);

  // ============================================
  // SCHEMA TOGGLE
  // ============================================

  const toggleSchema = (schemaName: string) => {
    setSelectedSchemas(prev =>
      prev.includes(schemaName)
        ? prev.filter(s => s !== schemaName)
        : [...prev, schemaName]
    );
  };

  // ============================================
  // LINE NUMBERS
  // ============================================

  const lineNumbers = useMemo(() => query.split('\n').map((_, i) => i + 1), [query]);

  // ============================================
  // RENDER CHART
  // ============================================

  const renderChart = () => {
    if (!chartData) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Run a query to visualize data</p>
          </div>
        </div>
      );
    }

    const ChartComponent = {
      bar: Bar,
      line: Line,
      pie: Pie,
      doughnut: Doughnut,
    }[chartConfig.type];

    return <ChartComponent data={chartData} options={chartOptions} />;
  };

  // ============================================
  // NO CONNECTION STATE
  // ============================================

  if (!connectionId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1B2431]">
        <div className="text-center text-gray-400">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-white mb-2">No Connection Selected</h2>
          <p>Please select a database connection to use the SQL Editor</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-[#1B2431]">
        {/* Toolbar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#1B2431] shrink-0">
          {/* Left: Run & Schema */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-green-500/20"
              onClick={handleRunQuery}
              disabled={isRunning || !!error}
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              <span className="hidden sm:inline">Run Query</span>
              <span className="sm:hidden">Run</span>
            </Button>

            {/* Schema Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                  disabled={loadingSchemas}
                >
                  {loadingSchemas ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  {selectedSchemas.length > 0 ? (
                    <span className="max-w-[100px] truncate">
                      {selectedSchemas.length === 1 ? selectedSchemas[0] : `${selectedSchemas.length} schemas`}
                    </span>
                  ) : (
                    'All Schemas'
                  )}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#273142] border-white/10 text-white min-w-[200px]">
                <DropdownMenuLabel className="text-gray-400 text-xs">
                  Select schemas for AI context
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {schemas.map(schema => (
                  <DropdownMenuCheckboxItem
                    key={schema.id}
                    checked={selectedSchemas.includes(schema.schema_name)}
                    onCheckedChange={() => toggleSchema(schema.schema_name)}
                    className="text-white hover:bg-white/10"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>{schema.schema_name}</span>
                      <Badge variant="outline" className="ml-2 text-xs border-white/20">
                        {schema.table_count} tables
                      </Badge>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
                {schemas.length === 0 && (
                  <div className="px-2 py-4 text-center text-gray-500 text-sm">
                    No schemas found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center: AI Button */}
          <div className="flex-1 max-w-2xl mx-4 md:mx-6 flex justify-center">
            <Dialog open={isAiOpen} onOpenChange={(open) => !isGenerating && setIsAiOpen(open)}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isGenerating || isTyping}
                  className={`relative group bg-[#0f172a] hover:bg-[#1e293b] border border-purple-500/30 text-gray-300 hover:text-white w-full max-w-md justify-start px-4 py-6 overflow-hidden ${(isGenerating || isTyping) ? 'cursor-wait' : ''
                    }`}
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg transition duration-500 blur ${(isGenerating || isTyping) ? 'opacity-70 animate-pulse' : 'opacity-20 group-hover:opacity-50'
                    }`} />
                  <div className="relative flex items-center gap-3">
                    {(isGenerating || isTyping) ? (
                      <>
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        <span className="text-sm truncate">
                          {isGenerating ? 'AI is thinking...' : 'Typing SQL...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                        <span className="text-sm truncate">Ask AI to generate SQL...</span>
                      </>
                    )}
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1e293b] border-white/10 text-white sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Generate SQL with AI
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Describe what you want to query in plain English
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Schema context info */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">
                    <Info className="w-4 h-4" />
                    <span>
                      Using context from:{' '}
                      <span className="text-purple-400">
                        {selectedSchemas.length > 0 ? selectedSchemas.join(', ') : 'all schemas'}
                      </span>
                    </span>
                  </div>

                  <textarea
                    placeholder="e.g., 'Show me the top 10 customers by total order value with their email addresses'"
                    className="w-full h-32 bg-[#0f172a] border border-white/10 rounded-lg p-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                        e.preventDefault();
                        handleGenerateSQL();
                      }
                    }}
                    disabled={isGenerating}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setIsAiOpen(false)}
                      className="text-gray-400 hover:text-white hover:bg-white/5"
                      disabled={isGenerating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerateSQL}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-none hover:opacity-90"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Query
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                  <Save className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Query</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export Results</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* AI Reasoning Banner */}
        {aiReasoning && (
          <div className="bg-purple-500/10 border-b border-purple-500/20 px-4 py-2">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-purple-300">{aiReasoning.desc}</p>
                {aiReasoning.reasoning && (
                  <details className="mt-1">
                    <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300">
                      View reasoning steps
                    </summary>
                    <ul className="mt-1 text-xs text-gray-400 list-disc list-inside">
                      {aiReasoning.reasoning.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-purple-400 hover:text-white h-6 w-6"
                onClick={() => setAiReasoning(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <ResizablePanelGroup direction="vertical" className="flex-1">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className={`h-full flex flex-col bg-[#0f172a] transition-all duration-300 ${isTyping ? 'ring-2 ring-purple-500/50 ring-inset' : ''}`}>
              <div className="flex-1 flex overflow-hidden relative">
                {/* Typing Indicator Overlay */}
                {isTyping && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/30">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-purple-300 font-medium">AI is typing...</span>
                  </div>
                )}

                {/* Line Numbers */}
                <div className="w-12 bg-[#0f172a] border-r border-white/5 flex flex-col items-end py-4 pr-3 select-none text-gray-600 font-mono text-sm leading-6">
                  {lineNumbers.map(num => (
                    <div key={num} style={{ height: '24px' }}>{num}</div>
                  ))}
                </div>
                {/* Editor */}
                <div className={`flex-1 bg-[#0f172a] overflow-auto scrollbar-thin ${isTyping ? 'cursor-wait pointer-events-none' : ''}`}>
                  <Editor
                    value={query}
                    onValueChange={handleQueryChange}
                    highlight={code => Prism.highlight(code, Prism.languages.sql, 'sql')}
                    padding={16}
                    disabled={isTyping}
                    style={{
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: 14,
                      backgroundColor: '#0f172a',
                      color: '#e2e8f0',
                      minHeight: '100%',
                      lineHeight: '24px',
                      cursor: isTyping ? 'wait' : 'text',
                    }}
                    className={`font-mono ${isTyping ? 'animate-pulse' : ''}`}
                    textareaClassName="focus:outline-none"
                  />
                </div>
              </div>

              {/* Error Bar */}
              {error && (
                <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
              )}

              {/* Status Bar */}
              <div className="h-8 bg-[#1e293b] border-t border-white/5 flex items-center px-4 text-xs text-gray-400 justify-between">
                <span>PostgreSQL</span>
                {isTyping ? (
                  <span className="text-purple-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    Generating SQL...
                  </span>
                ) : (
                  <span>Ln {lineNumbers.length}, Col {query.split('\n').pop()?.length || 0}</span>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-[#1e293b] hover:bg-[#3b82f6] transition-colors h-2 border-y border-white/5" />

          {/* Results Panel */}
          <ResizablePanel defaultSize={60} minSize={20}>
            <div className="h-full bg-[#1B2431] flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#273142]">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-semibold text-white">Query Results</h3>
                    {results && (
                      <span className="text-xs text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">
                        {results.rowCount} rows in {results.executionTime}ms
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'chart' && results && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-8"
                        onClick={() => setShowChartConfig(true)}
                      >
                        <Settings2 className="w-3 h-3 mr-2" />
                        Configure
                      </Button>
                    )}
                    <TabsList className="bg-[#1B2431] border border-white/5">
                      <TabsTrigger value="table" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                        <TableIcon className="w-4 h-4 mr-2" />
                        Table
                      </TabsTrigger>
                      <TabsTrigger value="chart" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Chart
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                  <TabsContent value="table" className="h-full w-full m-0 absolute inset-0">
                    {results ? (
                      <DataTable data={results.rows} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p>Run a query to see results</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="chart" className="h-full w-full m-0 p-6 absolute inset-0">
                    <div className="h-full bg-[#273142] rounded-xl p-4 border border-white/5">
                      {renderChart()}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Chart Configuration Modal */}
        <Dialog open={showChartConfig} onOpenChange={setShowChartConfig}>
          <DialogContent className="bg-[#1e293b] border-white/10 text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Chart Configuration
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Chart Type */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Chart Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['bar', 'line', 'pie', 'doughnut'] as const).map(type => (
                    <Button
                      key={type}
                      variant={chartConfig.type === type ? 'default' : 'outline'}
                      size="sm"
                      className={chartConfig.type === type ? 'bg-blue-600' : 'border-white/10'}
                      onClick={() => setChartConfig(prev => ({ ...prev, type }))}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* X-Axis */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">X-Axis (Category)</label>
                <select
                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white"
                  value={chartConfig.xAxis}
                  onChange={(e) => setChartConfig(prev => ({ ...prev, xAxis: e.target.value }))}
                >
                  {results?.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Y-Axis */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Y-Axis (Values)</label>
                <div className="flex flex-wrap gap-2">
                  {results?.columns.map(col => (
                    <Button
                      key={col}
                      variant={chartConfig.yAxis.includes(col) ? 'default' : 'outline'}
                      size="sm"
                      className={chartConfig.yAxis.includes(col) ? 'bg-blue-600' : 'border-white/10'}
                      onClick={() => {
                        setChartConfig(prev => ({
                          ...prev,
                          yAxis: prev.yAxis.includes(col)
                            ? prev.yAxis.filter(y => y !== col)
                            : [...prev.yAxis, col],
                        }));
                      }}
                    >
                      {col}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Chart Title</label>
                <input
                  type="text"
                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white"
                  value={chartConfig.title}
                  onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
