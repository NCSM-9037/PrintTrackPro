import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const IndividualReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, studentsRes] = await Promise.all([
          axios.get('https://printtrack-pro-api.onrender.com/api/reports/transactions'),
          axios.get('https://printtrack-pro-api.onrender.com/api/reports/students')
        ]);
        setTransactions(txRes.data);
        setStudents(studentsRes.data);
      } catch (error) {
        console.error("Error fetching individual reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (selectedStudentId === 'all') return transactions;
    return transactions.filter(t => t.studentId === parseInt(selectedStudentId));
  }, [transactions, selectedStudentId]);

  if (loading) {
    return <div className="p-8 text-white">Loading reports...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Individual Reports</h1>
        
        <div className="flex items-center gap-3">
          <label className="text-textMuted font-medium">Filter by Student:</label>
          <select 
            className="bg-surface border border-border text-white rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <option value="all">-- All Students --</option>
            {students.map(s => (
              <option key={s.studentId} value={s.studentId}>{s.studentName} ({s.batchName})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHighlight border-b border-border">
                <th className="p-4 text-sm font-semibold text-white">Date</th>
                <th className="p-4 text-sm font-semibold text-white">Student</th>
                <th className="p-4 text-sm font-semibold text-white">Description</th>
                <th className="p-4 text-sm font-semibold text-white text-right">Pages</th>
                <th className="p-4 text-sm font-semibold text-white text-right">Cost (₹)</th>
                <th className="p-4 text-sm font-semibold text-emerald-400 text-right">Cash Paid (₹)</th>
                <th className="p-4 text-sm font-semibold text-emerald-400 text-right">GPay Paid (₹)</th>
                <th className="p-4 text-sm font-semibold text-rose-400 text-right">Unpaid (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const unpaid = tx.totalAmount - tx.cashAmount - tx.gPayAmount;
                return (
                  <tr key={tx.transactionId} className="border-b border-border hover:bg-surfaceHighlight/50 transition-colors">
                    <td className="p-4 text-textMuted whitespace-nowrap">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-4 font-medium text-white">{tx.studentName}</td>
                    <td className="p-4 text-textMuted max-w-[200px] truncate" title={tx.description}>{tx.description || '-'}</td>
                    <td className="p-4 text-textMuted text-right">{tx.pages}</td>
                    <td className="p-4 text-white font-medium text-right">{tx.totalAmount.toFixed(2)}</td>
                    <td className="p-4 text-emerald-400/90 text-right">{tx.cashAmount.toFixed(2)}</td>
                    <td className="p-4 text-emerald-400/90 text-right">{tx.gPayAmount.toFixed(2)}</td>
                    <td className="p-4 text-rose-400 text-right font-medium">{unpaid > 0 ? unpaid.toFixed(2) : '0.00'}</td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-textMuted">No transactions found for this student.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IndividualReport;
