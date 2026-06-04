import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const IndividualReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState(null);
  const [editCash, setEditCash] = useState('');
  const [editGPay, setEditGPay] = useState('');
  const [editGivenBack, setEditGivenBack] = useState('0');
  const [editLoading, setEditLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('https://printtrack-pro-api.onrender.com/api/reports/transactions');
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    }
  };

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
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditClick = (tx) => {
    setEditingTx(tx);
    setEditCash(tx.cashAmount.toString());
    setEditGPay(tx.gPayAmount.toString());
    setEditGivenBack('0');
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    setEditLoading(true);
    try {
      await axios.put(`https://printtrack-pro-api.onrender.com/api/transactions/${editingTx.transactionId}/payment`, {
        cashAmount: parseFloat(editCash) || 0,
        googlePayAmount: parseFloat(editGPay) || 0,
        givenBackAmount: parseFloat(editGivenBack) || 0
      });
      await fetchTransactions(); // Refresh
      setEditingTx(null);
    } catch (error) {
      console.error("Error saving payment", error);
      alert("Failed to save changes.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = async (tx) => {
    if (window.confirm(`Are you sure you want to completely delete this print record?\n\nCost: ₹${tx.totalAmount.toFixed(2)}\nDescription: ${tx.description}\n\nThis will automatically correct the student's debt balance.`)) {
      try {
        await axios.delete(`https://printtrack-pro-api.onrender.com/api/transactions/${tx.transactionId}`);
        await fetchTransactions(); // Refresh
      } catch (error) {
        console.error("Error deleting transaction", error);
        alert("Failed to delete the transaction.");
      }
    }
  };

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
                <th className="p-4 text-sm font-semibold text-textMuted text-center">Action</th>
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
                    <td className="p-4 text-rose-400 text-right font-medium">{unpaid !== 0 ? unpaid.toFixed(2) : '0.00'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(tx)}
                          className="text-primary hover:text-primaryLight transition-colors p-1"
                          title="Edit Payment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(tx)}
                          className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                          title="Delete Transaction"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-textMuted">No transactions found for this student.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border bg-surfaceHighlight/30">
              <h2 className="text-xl font-bold text-white">Edit Payment</h2>
              <p className="text-textMuted text-sm mt-1">{editingTx.studentName} - {new Date(editingTx.date).toLocaleDateString()}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center p-3 bg-surfaceHighlight rounded-lg">
                <span className="text-textMuted font-medium">Total Print Cost:</span>
                <span className="text-white font-bold text-lg">₹{editingTx.totalAmount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-textMuted font-medium mb-1">Cash Handed To You (₹)</label>
                <input 
                  type="number" 
                  value={editCash} 
                  onChange={e => setEditCash(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-primary outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-textMuted font-medium mb-1">Google Pay Sent (₹)</label>
                <input 
                  type="number" 
                  value={editGPay} 
                  onChange={e => setEditGPay(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-primary outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-textMuted font-medium mb-1">Change Given Back (₹)</label>
                <input 
                  type="number" 
                  value={editGivenBack} 
                  onChange={e => setEditGivenBack(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-primary outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mt-2">
                <span className="text-emerald-400 font-medium">Net Payment Recorded:</span>
                <span className="text-emerald-400 font-bold text-lg">
                  ₹{((parseFloat(editCash) || 0) + (parseFloat(editGPay) || 0) - (parseFloat(editGivenBack) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-surfaceHighlight/30 flex justify-end gap-3">
              <button 
                onClick={() => setEditingTx(null)}
                className="px-5 py-2.5 rounded-lg text-textMuted hover:text-white hover:bg-surfaceHighlight transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primaryLight text-white font-medium transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualReport;
