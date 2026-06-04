import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, Printer, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('https://printtrack-pro-api.onrender.com/api/reports/dashboard');
        setReport(res.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Loading dashboard...</div>;
  }

  const kpis = [
    {
      title: 'Total Income',
      value: `₹${report?.totalIncome.toFixed(2)}`,
      icon: IndianRupee,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      desc: `Cash: ₹${report?.totalCash} | GPay: ₹${report?.totalGPay}`
    },
    {
      title: 'To Get (Total Debt)',
      value: `₹${report?.totalToGet.toFixed(2)}`,
      icon: ArrowUpRight,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      desc: 'Total unpaid debt across all students'
    },
    {
      title: 'To Give Others (Change/Credit)',
      value: `₹${report?.totalToGiveOthers.toFixed(2)}`,
      icon: ArrowDownRight,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
      desc: 'Total credit/change owed to students'
    },
    {
      title: 'Total Pages Printed',
      value: report?.totalPagesPrinted,
      icon: Printer,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      desc: 'Overall lifetime pages printed'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Financial Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-surface border border-border p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon size={24} className={kpi.color} />
              </div>
              <h3 className="text-textMuted font-medium">{kpi.title}</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{kpi.value}</p>
            <p className="text-sm text-textMuted/70">{kpi.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
