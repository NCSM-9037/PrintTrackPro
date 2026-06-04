import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Receipt, Printer, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDebt: 0,
    totalBatches: 0,
    totalPrinters: 0
  });

  useEffect(() => {
    // In a real app, we would have a specific /api/dashboard endpoint
    // For now, we'll fetch basic data to show stats
    const fetchStats = async () => {
      try {
        const [studentsRes, printersRes] = await Promise.all([
          axios.get('https://printtrack-pro-api.onrender.com/api/students', { verify: false }),
          axios.get('https://printtrack-pro-api.onrender.com/api/printers', { verify: false })
        ]);
        
        const students = studentsRes.data;
        // Mock some aggregated data
        setStats({
          totalStudents: students.length,
          totalDebt: students.reduce((acc, s) => acc + (s.debt || 0), 0),
          totalBatches: new Set(students.map(s => s.batchId)).size,
          totalPrinters: printersRes.data.length
        });
      } catch (error) {
        console.error("Error fetching stats", error);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-textMuted font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-success' : 'text-danger'}`}>
              {trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-surfaceHighlight flex items-center justify-center text-primary">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-textMuted">Welcome back to PrintTrack Pro Admin Portal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} trend="+12 this month" trendUp={true} />
        <StatCard title="Total Outstanding Debt" value={`₹${stats.totalDebt}`} icon={Receipt} trend="₹450 collected today" trendUp={true} />
        <StatCard title="Active Printers" value={stats.totalPrinters} icon={Printer} />
        <StatCard title="Total Batches" value={stats.totalBatches} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-6">Recent Print Jobs</h3>
          <div className="flex flex-col items-center justify-center h-64 text-textMuted border-2 border-dashed border-border rounded-xl">
            <Printer size={48} className="mb-4 opacity-20" />
            <p>Connect backend to view live print jobs stream</p>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Top Debtors</h3>
          <div className="flex flex-col items-center justify-center h-64 text-textMuted border-2 border-dashed border-border rounded-xl">
            <Users size={48} className="mb-4 opacity-20" />
            <p>Analytics loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
