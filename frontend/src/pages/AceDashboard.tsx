import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Star, Trophy, Target, Calendar } from 'lucide-react';

const API_URL = '/api';

interface ReportItem {
  id: number;
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

interface Props {
  month: string;
  setMonth: (month: string) => void;
}

const AceDashboard = ({ month, setMonth }: Props) => {
  const [report, setReport] = useState<ReportItem[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`${API_URL}/report/${month}`);
        setReport(res.data);
      } catch (e) {
        console.error("Failed to fetch report", e);
      }
    };
    fetchReport();
  }, [month]);

  const aces = report.filter(r => r.isAce);
  const dtAces = aces.filter(r => r.club === 'DT').sort((a, b) => b.hours - a.hours);
  const bugAces = aces.filter(r => r.club === 'Bug').sort((a, b) => b.hours - a.hours);

  return (
    <div className="space-y-8">
      {/* Header with Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
            <Trophy className="text-cyber-ace animate-bounce" size={32} />
            ACE ELITE DASHBOARD
          </h2>
          <p className="text-gray-500 text-sm mt-1">RECOGNIZING THE TOP PERFORMERS OF THE MONTH</p>
        </div>
        
        <div className="cyber-month-container group gemini-glow">
          <Calendar size={18} className="text-gray-400 group-hover:text-cyber-primary transition-colors" />
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-500 uppercase font-bold">Select Month</span>
            <input 
              type="month" 
              value={month} 
              onChange={e => setMonth(e.target.value)}
              className="cyber-month-input"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* DT CLUB ACES */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-cyber-dt pl-4">
            <h3 className="text-xl font-bold text-cyber-dt uppercase tracking-widest">DT Club Hall of Fame</h3>
          </div>
          <div className="grid gap-4">
            {dtAces.map((ace, index) => (
              <AceCard key={ace.id} ace={ace} rank={index + 1} color="dt" />
            ))}
            {dtAces.length === 0 && <EmptyAce club="DT" />}
          </div>
        </div>

        {/* BUG CLUB ACES */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-cyber-bug pl-4">
            <h3 className="text-xl font-bold text-cyber-bug uppercase tracking-widest">Bug Club Hall of Fame</h3>
          </div>
          <div className="grid gap-4">
            {bugAces.map((ace, index) => (
              <AceCard key={ace.id} ace={ace} rank={index + 1} color="bug" />
            ))}
            {bugAces.length === 0 && <EmptyAce club="Bug" />}
          </div>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-cyber-card/30 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-gray-500 text-xs font-bold uppercase mb-2">Total Ace Payouts</div>
          <div className="text-2xl font-black text-white">
            RM {aces.reduce((sum, a) => sum + a.finalSalary, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-cyber-card/30 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-gray-500 text-xs font-bold uppercase mb-2">Avg Ace Hours</div>
          <div className="text-2xl font-black text-white">
            {aces.length > 0 ? (aces.reduce((sum, a) => sum + a.hours, 0) / aces.length).toFixed(1) : 0}h
          </div>
        </div>
        <div className="bg-cyber-card/30 border border-cyber-border rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-gray-500 text-xs font-bold uppercase mb-2">Gift Contribution</div>
          <div className="text-2xl font-black text-white">
            {aces.reduce((sum, a) => sum + a.gifts, 0)} Units
          </div>
        </div>
      </div>
    </div>
  );
};

const AceCard = ({ ace, rank, color }: { ace: ReportItem, rank: number, color: 'dt' | 'bug' }) => {
  const rankColors = {
    1: 'from-yellow-400 to-orange-500',
    2: 'from-gray-300 to-gray-500',
    3: 'from-orange-400 to-orange-700'
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 relative overflow-hidden group hover:border-cyber-ace/50 transition-all duration-500">
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[80px] opacity-10 transition-opacity group-hover:opacity-20 ${color === 'dt' ? 'bg-cyber-dt' : 'bg-cyber-bug'}`}></div>
      
      <div className="flex items-center gap-6 relative z-10">
        {/* Rank Circle */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${rankColors[rank as keyof typeof rankColors]} flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform`}>
          <span className="text-2xl font-black text-cyber-bg">{rank}</span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-bold text-white">{ace.name}</h4>
            <div className={`w-2 h-2 rounded-full animate-pulse ${color === 'dt' ? 'bg-cyber-dt' : 'bg-cyber-bug'}`}></div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Zap size={14} className="text-cyber-primary" />
              <span className="font-mono">{ace.hours} Hours Logged</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Star size={14} className="text-cyber-ace" />
              <span className="font-mono">{ace.gifts} Gifts Received</span>
            </div>
          </div>
        </div>

        {/* Salary Highlight */}
        <div className="text-right">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Final Yield</div>
          <div className="text-xl font-black text-cyber-ace tracking-tighter">RM {ace.finalSalary.toFixed(2)}</div>
        </div>
      </div>

      {/* Progress Bar (Visual of workload) */}
      <div className="mt-6 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${color === 'dt' ? 'from-blue-600 to-cyber-dt' : 'from-green-600 to-cyber-bug'} transition-all duration-1000`} 
          style={{ width: `${Math.min((ace.hours / 150) * 100, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

const EmptyAce = ({ club }: { club: string }) => (
  <div className="bg-cyber-card/20 border border-dashed border-cyber-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
    <Target size={40} className="text-gray-700 mb-4" />
    <p className="text-gray-500 font-bold italic">No {club} Aces identified for this period.</p>
    <p className="text-[10px] text-gray-700 uppercase mt-1">Pending system sync or low hour deployment.</p>
  </div>
);

export default AceDashboard;
