import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Receipt, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { format } from 'date-fns';

const TransactionsList = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get('http://localhost:5015/api/transactions');
        setTransactions(res.data);
      } catch (error) {
        console.error("Error fetching transactions", error);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Financial Ledger</h1>
          <p className="text-textMuted">View all print charges and received payments.</p>
        </div>
        <button className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors">
          Record Payment
        </button>
      </div>

      <div className="glass-card flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
            <input 
              type="text" 
              placeholder="Search descriptions or students..." 
              className="glass-input w-full pl-10 pr-4 py-2.5"
            />
          </div>
          <button className="glass-input px-4 py-2.5 flex items-center gap-2 text-textMuted hover:text-white transition-colors">
            <Filter size={18} />
            Filter
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur z-10 border-b border-border text-xs uppercase text-textMuted font-semibold">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map(t => {
                const isPayment = t.description && t.description.toLowerCase().includes('payment');
                return (
                  <tr key={t.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{t.description || "Print Job"}</td>
                    <td className="px-6 py-4">
                      {isPayment ? (
                        <span className="flex items-center gap-1 text-success text-sm font-medium">
                          <ArrowDownLeft size={16} /> Payment Received
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-danger text-sm font-medium">
                          <ArrowUpRight size={16} /> Print Charge
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-textMuted">Student: {t.studentId}</td>
                    <td className="px-6 py-4 text-textMuted">
                      {t.date ? format(new Date(t.date), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${isPayment ? 'text-success' : 'text-danger'}`}>
                      {isPayment ? '+' : '-'}₹{t.totalAmount}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-textMuted">
                    <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No transactions recorded yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsList;
