import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, Save } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SQLEditor() {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [aiPrompt, setAiPrompt] = useState('');

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#273142]">
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-green-500/20">
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button size="sm" variant="outline" className="border-none bg-[#1B2431] hover:bg-[#1B2431]/80 text-white">
            <Save className="w-4 h-4 mr-2" />
            Save Query
          </Button>
        </div>
        <div className="flex items-center gap-2 bg-[#1B2431] rounded-full px-3 py-1.5 border-none w-[400px] focus-within:ring-1 focus-within:ring-[#3b82f6] transition-all">
          <Sparkles className="w-4 h-4 text-[#3b82f6]" />
          <input
            type="text"
            placeholder="Ask AI to write SQL..."
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-500"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
        </div>
      </div>

      {/* Editor & Results */}
      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="h-full bg-[#1B2431] p-4 font-mono text-sm text-gray-300">
            <textarea
              className="w-full h-full bg-transparent border-none outline-none resize-none focus:ring-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle className="bg-[#273142] hover:bg-[#3b82f6]" />
        <ResizablePanel defaultSize={60} minSize={20}>
          <div className="h-full bg-[#273142] overflow-auto">
            <Table>
              <TableHeader className="bg-[#323d52] sticky top-0">
                <TableRow className="border-none hover:bg-[#323d52]">
                  <TableHead className="text-gray-300 font-medium">id</TableHead>
                  <TableHead className="text-gray-300 font-medium">name</TableHead>
                  <TableHead className="text-gray-300 font-medium">email</TableHead>
                  <TableHead className="text-gray-300 font-medium">role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-700/50 hover:bg-[#323d52]/50">
                    <TableCell className="text-gray-300">{i + 1}</TableCell>
                    <TableCell className="text-gray-300">User {i + 1}</TableCell>
                    <TableCell className="text-gray-300">user{i + 1}@example.com</TableCell>
                    <TableCell className="text-gray-300">user</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
