import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Terminal as TerminalIcon, ChevronRight, Zap, Save } from 'lucide-react';

const API_URL = '/api';

interface ReportItem {
  id: string;
  name: string;
  club: 'DT' | 'Bug';
  hours: number;
  gifts: number;
  isAce: boolean;
  baseSalary: number;
  giftValue: number;
  clubCut: number;
  finalSalary: number;
}

const TerminalView = () => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<{ type: 'cmd' | 'resp' | 'ai', content: string | React.ReactNode }[]>([
    { type: 'ai', content: 'INITIALIZING DT/BUG OS v1.0.4...' },
    { type: 'ai', content: 'SYSTEM READY. TYPE /help FOR COMMANDS.' },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const commands = [
    { cmd: '/help', desc: 'Show all available commands' },
    { cmd: '/ace', desc: 'Display current monthly Aces for both clubs' },
    { cmd: '/stats', desc: 'Show club commission statistics' },
    { cmd: '/payroll', desc: 'Calculate payroll summary' },
    { cmd: '/clear', desc: 'Clear the terminal screen' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.startsWith('/')) {
      setSuggestions(commands.filter(c => c.cmd.startsWith(val)).map(c => c.cmd));
    } else {
      setSuggestions([]);
    }
  };

  const executeCommand = async (cmd: string) => {
    setLogs(prev => [...prev, { type: 'cmd', content: cmd }]);
    setInput('');
    setSuggestions([]);

    const parts = cmd.trim().split(' ');
    const cleanCmd = parts[0].toLowerCase();
    const month = parts[1] || new Date().toISOString().slice(0, 7); // Use provided month or default to current

    if (cleanCmd === '/help') {
      setLogs(prev => [...prev, { type: 'ai', content: (
        <div className="space-y-1 mt-2">
          {commands.map(c => (
            <div key={c.cmd} className="flex gap-4">
              <span className="text-cyber-primary font-bold min-w-[100px]">{c.cmd}</span>
              <span className="text-gray-500">{c.desc}</span>
            </div>
          ))}
        </div>
      ) }]);
    } else if (cleanCmd === '/ace') {
      setLogs(prev => [...prev, { type: 'ai', content: 'FETCHING REAL-TIME ACE DATA...' }]);
      try {
        const res = await axios.get(`${API_URL}/report/${month}`);
        const data: ReportItem[] = res.data;
        const aces = data.filter(r => r.isAce);
        const dtAces = aces.filter(r => r.club === 'DT').sort((a, b) => b.hours - a.hours);
        const bugAces = aces.filter(r => r.club === 'Bug').sort((a, b) => b.hours - a.hours);

        setLogs(prev => [...prev, { type: 'ai', content: (
          <div className="space-y-4 mt-2">
            <div>
              <div className="text-[10px] text-cyber-dt font-bold mb-2 uppercase">DT Club Elite</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {dtAces.map((ace, i) => (
                  <div key={ace.id} className="bg-cyber-card border border-cyber-dt/20 p-2 rounded flex items-center gap-2">
                    <span className="text-cyber-dt font-black">#{i+1}</span>
                    <span className="text-xs text-white">{ace.name}</span>
                  </div>
                ))}
                {dtAces.length === 0 && <span className="text-xs text-gray-600">No Aces recorded.</span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-cyber-bug font-bold mb-2 uppercase">Bug Club Elite</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {bugAces.map((ace, i) => (
                  <div key={ace.id} className="bg-cyber-card border border-cyber-bug/20 p-2 rounded flex items-center gap-2">
                    <span className="text-cyber-bug font-black">#{i+1}</span>
                    <span className="text-xs text-white">{ace.name}</span>
                  </div>
                ))}
                {bugAces.length === 0 && <span className="text-xs text-gray-600">No Aces recorded.</span>}
              </div>
            </div>
          </div>
        ) }]);
      } catch (e) {
        setLogs(prev => [...prev, { type: 'resp', content: 'Error: Failed to connect to registry API.' }]);
      }
    } else if (cleanCmd === '/stats') {
      setLogs(prev => [...prev, { type: 'ai', content: 'ANALYZING COMMISSION YIELDS...' }]);
      try {
        const res = await axios.get(`${API_URL}/report/${month}`);
        const data: ReportItem[] = res.data;
        const dtComm = data.filter(r => r.club === 'DT').reduce((sum, r) => sum + r.clubCut, 0);
        const bugComm = data.filter(r => r.club === 'Bug').reduce((sum, r) => sum + r.clubCut, 0);
        const totalComm = dtComm + bugComm;

        setLogs(prev => [...prev, { type: 'ai', content: (
          <div className="mt-4 p-4 bg-cyber-bg border border-cyber-border rounded-xl max-w-md">
            <div className="flex justify-between items-end mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Commission Breakdown</h4>
              <span className="text-[10px] text-cyber-accent font-bold">RM {totalComm.toFixed(2)} TOTAL</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-cyber-dt">DT CLUB</span>
                  <span className="text-white">RM {dtComm.toFixed(2)}</span>
                </div>
                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyber-dt" style={{ width: `${(dtComm / totalComm) * 100}%` }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-cyber-bug">BUG CLUB</span>
                  <span className="text-white">RM {bugComm.toFixed(2)}</span>
                </div>
                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyber-bug" style={{ width: `${(bugComm / totalComm) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ) }]);
      } catch (e) {
        setLogs(prev => [...prev, { type: 'resp', content: 'Error: Critical failure in analytics engine.' }]);
      }
    } else if (cleanCmd === '/payroll') {
      setLogs(prev => [...prev, { type: 'ai', content: 'SUMMARIZING PAYROLL DEPLOYMENT...' }]);
      try {
        const res = await axios.get(`${API_URL}/report/${month}`);
        const data: ReportItem[] = res.data;
        const totalPayout = data.reduce((sum, r) => sum + r.finalSalary, 0);
        const totalHours = data.reduce((sum, r) => sum + r.hours, 0);

        setLogs(prev => [...prev, { type: 'ai', content: (
          <div className="flex gap-4 mt-2">
            <div className="bg-cyber-card p-3 rounded border border-cyber-border">
              <div className="text-[9px] text-gray-500 uppercase">Total Duty Hours</div>
              <div className="text-lg font-black text-white">{totalHours.toFixed(1)}H</div>
            </div>
            <div className="bg-cyber-card p-3 rounded border border-cyber-border">
              <div className="text-[9px] text-gray-500 uppercase">Active Payroll</div>
              <div className="text-lg font-black text-cyber-primary">RM {totalPayout.toLocaleString()}</div>
            </div>
          </div>
        ) }]);
      } catch (e) {
        setLogs(prev => [...prev, { type: 'resp', content: 'Error: Payroll records inaccessible.' }]);
      }
    } else if (cleanCmd === '/clear') {
      setLogs([]);
    } else {
      setLogs(prev => [...prev, { type: 'resp', content: `Unknown command: ${cmd}. Type /help for assistance.` }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-cyber-bg/50 rounded-2xl border border-cyber-border overflow-hidden shadow-2xl relative">
      {/* Terminal Title Bar */}
      <div className="bg-cyber-card px-4 py-2 border-b border-cyber-border flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
          <TerminalIcon size={12} />
          Interactive Admin Shell
        </div>
        <div className="w-12"></div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto terminal-scroll space-y-3 font-mono text-sm"
      >
        {logs.map((log, i) => (
          <div key={i} className={`flex gap-3 ${log.type === 'cmd' ? 'text-cyber-primary' : log.type === 'ai' ? 'text-cyber-secondary' : 'text-gray-400'}`}>
            <span className="shrink-0 opacity-50">
              {log.type === 'cmd' ? '$' : log.type === 'ai' ? '✦' : '>'}
            </span>
            <div className="break-words w-full">
              {log.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-cyber-card border-t border-cyber-border relative">
        {suggestions.length > 0 && (
          <div className="absolute bottom-full left-4 bg-cyber-card border border-cyber-border rounded-lg mb-2 shadow-2xl p-1 min-w-[200px] z-10">
            {suggestions.map(s => (
              <button 
                key={s}
                onClick={() => executeCommand(s)}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-cyber-primary/10 hover:text-cyber-primary rounded transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <div className="relative flex items-center">
          <ChevronRight className="absolute left-3 text-cyber-primary animate-pulse" size={18} />
          <input 
            type="text" 
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && executeCommand(input)}
            placeholder="Type a command or ask Gemini..."
            className="w-full bg-cyber-bg border border-cyber-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-cyber-primary transition-all gemini-glow"
          />
          <div className="absolute right-3 flex gap-2">
            <button className="p-1.5 text-gray-500 hover:text-cyber-primary transition-colors">
              <Zap size={16} />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-cyber-secondary transition-colors">
              <Save size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalView;
