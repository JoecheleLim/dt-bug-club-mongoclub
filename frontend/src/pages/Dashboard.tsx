import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit3, Calendar, Users, Award, Activity, FileText, Zap, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

interface Staff {
  id: number;
  name: string;
  club: 'DT' | 'Bug';
}

interface ReportItem extends Staff {
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

const Dashboard = ({ month, setMonth }: Props) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [report, setReport] = useState<ReportItem[]>([]);
  const [newName, setNewName] = useState('');
  const [newClub, setNewClub] = useState<'DT' | 'Bug'>('DT');
  const [editStaffId, setEditStaffId] = useState<number | null>(null);
  const [editHours, setEditHours] = useState(0);
  const [editGifts, setEditGifts] = useState(0);
  
  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API_URL}/staff`);
      setStaffList(res.data);
    } catch (e) {
      console.error("Backend unreachable", e);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${API_URL}/report/${month}`);
      setReport(res.data);
    } catch (e) {
      console.error("Backend unreachable", e);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchReport();
  }, [month]);

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await axios.post(`${API_URL}/staff`, { name: newName, club: newClub });
    setNewName('');
    fetchStaff();
    fetchReport();
  };

  const deleteStaff = async (id: number) => {
    if (window.confirm('Terminate staff record?')) {
      await axios.delete(`${API_URL}/staff/${id}`);
      fetchStaff();
      fetchReport();
    }
  };

  const saveRecord = async () => {
    if (editStaffId === null) return;
    await axios.post(`${API_URL}/records`, {
      staff_id: editStaffId,
      month,
      hours: editHours,
      gifts: editGifts
    });
    setEditStaffId(null);
    fetchReport();
  };

  const dtReport = report.filter(r => r.club === 'DT');
  const bugReport = report.filter(r => r.club === 'Bug');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="text-cyber-primary" />
          Payroll Dashboard
        </h2>
        
        <div className="cyber-month-container group">
          <Calendar size={18} className="text-gray-400 group-hover:text-cyber-primary transition-colors" />
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-500 uppercase font-bold">Active Period</span>
            <input 
              type="month" 
              value={month} 
              onChange={e => setMonth(e.target.value)}
              className="cyber-month-input"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-cyber-card border border-cyber-border p-4 rounded-xl">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Total Staff Payout</div>
          <div className="text-xl font-black text-white">RM {report.reduce((sum, r) => sum + r.finalSalary, 0).toLocaleString()}</div>
        </div>
        <div className="bg-cyber-card border border-cyber-border p-4 rounded-xl border-l-4 border-l-cyber-accent">
          <div className="text-[10px] text-cyber-accent font-bold uppercase">Total Club Commission</div>
          <div className="text-xl font-black text-white">RM {report.reduce((sum, r) => sum + r.clubCut, 0).toLocaleString()}</div>
        </div>
        <div className="bg-cyber-card border border-cyber-border p-4 rounded-xl border-l-4 border-l-cyber-dt">
          <div className="text-[10px] text-cyber-dt font-bold uppercase">DT Commission</div>
          <div className="text-xl font-black text-white">RM {dtReport.reduce((sum, r) => sum + r.clubCut, 0).toLocaleString()}</div>
        </div>
        <div className="bg-cyber-card border border-cyber-border p-4 rounded-xl border-l-4 border-l-cyber-bug">
          <div className="text-[10px] text-cyber-bug font-bold uppercase">Bug Commission</div>
          <div className="text-xl font-black text-white">RM {bugReport.reduce((sum, r) => sum + r.clubCut, 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Onboarding */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-lg shadow-cyber-primary/5">
            <h3 className="text-sm font-black text-white uppercase mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-cyber-primary" />
              Add New Staff
            </h3>
            <form onSubmit={addStaff} className="space-y-4">
              <input 
                type="text" 
                placeholder="Staff Identity Name" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-cyber-primary focus:outline-none transition-all"
              />
              <div className="flex gap-2">
                {(['DT', 'Bug'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewClub(c)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                      newClub === c 
                        ? 'bg-cyber-primary/20 border-cyber-primary text-cyber-primary' 
                        : 'bg-cyber-bg border-cyber-border text-gray-500'
                    }`}
                  >
                    {c} CLUB
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full bg-cyber-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-blue-500/10">
                Execute Onboarding
              </button>
            </form>
          </div>
          
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
              <Users size={16} />
              Staff Registry
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto terminal-scroll pr-2">
              {staffList.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-cyber-bg/50 rounded-lg border border-cyber-border/50 group">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">{s.name}</span>
                    <span className={`text-[10px] font-bold ${s.club === 'DT' ? 'text-cyber-dt' : 'text-cyber-bug'}`}>{s.club} UNIT</span>
                  </div>
                  <button onClick={() => deleteStaff(s.id)} className="p-1.5 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Split Tables */}
        <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ClubTable title="DT CLUB" data={dtReport} color="dt" onEdit={(id, h, g) => { setEditStaffId(id); setEditHours(h); setEditGifts(g); }} />
          <ClubTable title="BUG CLUB" data={bugReport} color="bug" onEdit={(id, h, g) => { setEditStaffId(id); setEditHours(h); setEditGifts(g); }} />
        </div>
      </div>

      {/* Edit Overlay */}
      {editStaffId !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl w-full max-w-md shadow-2xl gemini-glow">
            <div className="p-6 border-b border-cyber-border">
              <h3 className="text-xl font-bold text-white">Modify Record Parameters</h3>
              <p className="text-xs text-gray-500 mt-1">Staff Member: {report.find(r => r.id === editStaffId)?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Accumulated Hours</label>
                <div className="relative">
                  <Zap size={14} className="absolute left-3 top-3.5 text-cyber-primary" />
                  <input type="number" value={editHours} onChange={e => setEditHours(Number(e.target.value))} className="w-full bg-cyber-bg border border-cyber-border rounded-xl p-3 pl-10 text-white focus:outline-none focus:ring-1 focus:ring-cyber-primary transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Gift Units Received</label>
                <div className="relative">
                  <Award size={14} className="absolute left-3 top-3.5 text-cyber-ace" />
                  <input type="number" value={editGifts} onChange={e => setEditGifts(Number(e.target.value))} className="w-full bg-cyber-bg border border-cyber-border rounded-xl p-3 pl-10 text-white focus:outline-none focus:ring-1 focus:ring-cyber-primary transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveRecord} className="flex-1 bg-cyber-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors">Apply Changes</button>
                <button onClick={() => setEditStaffId(null)} className="flex-1 bg-cyber-bg hover:bg-gray-800 text-gray-400 font-bold py-3 rounded-xl transition-colors border border-cyber-border">Abort</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ClubTable = ({ title, data, color, onEdit }: { title: string, data: ReportItem[], color: 'dt' | 'bug', onEdit: (id: number, h: number, g: number) => void }) => (
  <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden shadow-xl h-fit">
    <div className={`p-4 border-b border-cyber-border bg-cyber-bg/20 flex items-center justify-between`}>
      <h3 className={`text-sm font-bold uppercase flex items-center gap-2 ${color === 'dt' ? 'text-cyber-dt' : 'text-cyber-bug'}`}>
        <FileText size={16} />
        {title}
      </h3>
      <div className="text-[10px] text-gray-500 font-mono">{data.length} UNITS</div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-gray-500 border-b border-cyber-border/50">
            <th className="px-4 py-3 font-bold uppercase text-[9px]">Identity</th>
            <th className="px-4 py-3 font-bold uppercase text-[9px]">Hrs</th>
            <th className="px-4 py-3 font-bold uppercase text-[9px]">Gifts</th>
            <th className="px-4 py-3 font-bold uppercase text-[9px]">Commission</th>
            <th className="px-4 py-3 font-bold uppercase text-[9px]">Net Yield</th>
            <th className="px-4 py-3 font-bold uppercase text-[9px]">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cyber-border/10">
          {data.map(r => (
            <tr key={r.id} className="hover:bg-white/5 transition-colors group">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    {r.name}
                    {r.isAce && <Award size={10} className="text-cyber-ace" />}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400 font-mono">{r.hours.toFixed(0)}</td>
              <td className="px-4 py-3 text-gray-400 font-mono">{r.gifts}</td>
              <td className="px-4 py-3 text-gray-500 font-mono">RM{r.clubCut.toFixed(0)}</td>
              <td className="px-4 py-3">
                <span className={`font-bold font-mono ${color === 'dt' ? 'text-cyber-dt' : 'text-cyber-bug'}`}>RM{r.finalSalary.toFixed(0)}</span>
              </td>
              <td className="px-4 py-3">
                <button onClick={() => onEdit(r.id, r.hours, r.gifts)} className="p-1.5 bg-cyber-bg hover:bg-cyber-border rounded-md text-cyber-primary border border-cyber-border">
                  <Edit3 size={12} />
                </button>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-gray-600 italic">No data records found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="p-3 bg-cyber-bg/10 border-t border-cyber-border/30 flex justify-between items-center">
      <div className="flex gap-4">
        <div>
          <span className="text-[9px] text-gray-600 uppercase block">Club Commission</span>
          <span className="text-xs font-bold text-cyber-accent">RM {data.reduce((sum, r) => sum + r.clubCut, 0).toLocaleString()}</span>
        </div>
      </div>
      <div>
        <span className="text-[9px] text-gray-500 uppercase block">Total Payout</span>
        <span className="text-sm font-bold text-white">RM {data.reduce((sum, r) => sum + r.finalSalary, 0).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

export default Dashboard;
