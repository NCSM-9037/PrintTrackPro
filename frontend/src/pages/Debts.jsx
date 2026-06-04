import { useState } from 'react';
import { Search, IndianRupee, History } from 'lucide-react';

export default function Debts() {
  const [debts, setDebts] = useState([
    { id: 1, studentName: 'John Doe', batch: 'CS 2024', amount: 50, lastPrintDate: '2026-06-03 14:30' },
    { id: 2, studentName: 'Sam Wilson', batch: 'MECH 2024', amount: 120, lastPrintDate: '2026-06-02 09:15' },
    { id: 3, studentName: 'Alice Green', batch: 'IT 2024', amount: 15, lastPrintDate: '2026-06-04 11:20' },
  ]);
  const [search, setSearch] = useState('');

  const filteredDebts = debts.filter(d => 
    d.studentName.toLowerCase().includes(search.toLowerCase()) || 
    d.batch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Debt Management</h1>
          <p className="text-gray-500">Track and clear pending student printing debts.</p>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 flex flex-col items-end">
          <span className="text-xs uppercase font-bold tracking-wider opacity-70">Total Pending</span>
          <span className="text-xl font-bold">₹{debts.reduce((sum, d) => sum + d.amount, 0)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by student or batch..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
            <History className="w-4 h-4 mr-1" /> View History
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Student Name</th>
                <th className="px-6 py-3 font-medium">Batch</th>
                <th className="px-6 py-3 font-medium">Last Print Date</th>
                <th className="px-6 py-3 font-medium">Debt Amount</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDebts.map(debt => (
                <tr key={debt.id} className="hover:bg-red-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{debt.studentName}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">{debt.batch}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{debt.lastPrintDate}</td>
                  <td className="px-6 py-4 font-bold text-red-600">₹{debt.amount}</td>
                  <td className="px-6 py-4 flex justify-end space-x-2">
                    <button className="bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                      Partial
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center">
                      <IndianRupee className="w-3.5 h-3.5 mr-1" /> Clear
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No debts found. Great!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
