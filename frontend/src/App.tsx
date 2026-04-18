import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Shield, Info, Zap, Database, Terminal as TerminalIcon, LayoutDashboard, Trophy, UserPlus } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import TerminalView from './pages/TerminalView';
import AceDashboard from './pages/AceDashboard';

const Sidebar = () => (
  <aside className="w-64 bg-cyber-card border-r border-cyber-border h-screen flex flex-col p-4">
    <div className="flex items-center gap-2 mb-8 px-2">
      <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Zap size={18} className="text-white" />
      </div>
      <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        DT/Bug OS
      </h1>
    </div>
    
    <nav className="flex-1 space-y-2">
      <SidebarLink to="/" icon={<TerminalIcon size={18} />} label="Terminal" />
      <SidebarLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
      <SidebarLink to="/aces" icon={<Trophy size={18} />} label="Ace Elite" />
    </nav>
    
    <div className="mt-auto p-4 bg-cyber-bg rounded-lg border border-cyber-border">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <Activity size={12} />
        <span>System Status</span>
      </div>
      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 w-3/4 animate-pulse"></div>
      </div>
    </div>
  </aside>
);

const SidebarLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        isActive ? 'bg-cyber-primary/10 text-cyber-primary' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

const Header = ({ isConnected }: { isConnected: boolean }) => {
  const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  
  return (
    <header className="h-14 bg-cyber-card border-b border-cyber-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Database size={14} />
          <span>db_v1.sqlite</span>
        </div>
        <div className="h-4 w-px bg-cyber-border"></div>
        <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span>{isConnected ? `System Online: Port ${currentPort}` : 'System Offline: Check Backend'}</span>
        </div>
      </div>
    
    <div className="flex items-center gap-4">
      <Link to="/dashboard" className="flex items-center gap-2 text-[10px] bg-cyber-primary/10 text-cyber-primary px-3 py-1.5 rounded-md border border-cyber-primary/30 hover:bg-cyber-primary/20 transition-all font-bold">
        <UserPlus size={14} />
        ADD STAFF
      </Link>
      <div className="h-4 w-px bg-cyber-border"></div>
      <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
        <Shield size={14} />
        <span>YOLO Mode</span>
        <div className="w-8 h-4 bg-gray-700 rounded-full relative">
          <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-gray-400 rounded-full"></div>
        </div>
      </button>
    </div>
  </header>
  );
};

const Footer = ({ report }: { report: any[] }) => {
  const dtCommission = report.filter(s => s.club === 'DT').reduce((acc, s) => acc + (s.clubCut || 0), 0);
  const bugCommission = report.filter(s => s.club === 'Bug').reduce((acc, s) => acc + (s.clubCut || 0), 0);
  
  const dtAces = report.filter(s => s.club === 'DT' && s.isAce).sort((a, b) => b.hours - a.hours);
  const bugAces = report.filter(s => s.club === 'Bug' && s.isAce).sort((a, b) => b.hours - a.hours);

  return (
    <footer className="h-10 bg-cyber-card border-t border-cyber-border flex items-center justify-between px-6 text-[10px] text-gray-500 uppercase tracking-widest">
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <span className="text-cyber-dt">DT Commission</span>
          <span className="text-white font-bold">RM {dtCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyber-bug">Bug Commission</span>
          <span className="text-white font-bold">RM {bugCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      <div className="flex gap-4 items-center">
        <span>DT Aces:</span>
        <div className="flex gap-2">
          {dtAces.length > 0 ? dtAces.map(ace => (
            <span key={ace.id} className="text-cyber-dt border border-cyber-dt/30 px-2 rounded">
              {ace.name}
            </span>
          )) : <span className="text-gray-700">-</span>}
        </div>
        <div className="h-3 w-px bg-cyber-border mx-1"></div>
        <span>Bug Aces:</span>
        <div className="flex gap-2">
          {bugAces.length > 0 ? bugAces.map(ace => (
            <span key={ace.id} className="text-cyber-bug border border-cyber-bug/30 px-2 rounded">
              {ace.name}
            </span>
          )) : <span className="text-gray-700">-</span>}
        </div>
      </div>
    </footer>
  );
};

function App() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchGlobalData = async () => {
    try {
      const res = await fetch(`/api/report/${month}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (e) {
      console.error("Error fetching footer data", e);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [month]);

  return (
    <Router>
      <div className="flex h-screen bg-cyber-bg overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header isConnected={isConnected} />
          
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<TerminalView />} />
              <Route path="/dashboard" element={<Dashboard month={month} setMonth={setMonth} />} />
              <Route path="/aces" element={<AceDashboard month={month} setMonth={setMonth} />} />
            </Routes>
          </main>
          
          <Footer report={report} />
        </div>
        
        {/* Right Drawer (Context Panel) */}
        <div className="w-72 bg-cyber-card border-l border-cyber-border p-4 hidden lg:flex flex-col">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Info size={14} />
            Context Drawer
          </h3>
          
          <div className="space-y-4">
            <div className="p-3 bg-cyber-bg rounded border border-cyber-border">
              <div className="text-[10px] text-blue-400 mb-1">Active File</div>
              <div className="text-sm font-medium">staff_records.db</div>
            </div>
            
            <div className="p-3 bg-cyber-bg rounded border border-cyber-border">
              <div className="text-[10px] text-purple-400 mb-1">AI Thinking</div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Usage</span>
                <span className="text-xs text-gray-400">124 tokens</span>
              </div>
            </div>
            
            <div className="p-3 bg-cyber-bg rounded border border-cyber-border">
              <div className="text-[10px] text-orange-400 mb-1">Upcoming Task</div>
              <div className="text-xs text-gray-300">Generate {new Date(month + '-01').toLocaleString('default', { month: 'long' })} Payroll CSV</div>
            </div>
          </div>
          
          <div className="mt-auto text-[10px] text-gray-600">
            v1.0.4-alpha // DT-BUG-ADMIN
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
