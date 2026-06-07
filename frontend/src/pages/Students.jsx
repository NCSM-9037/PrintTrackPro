import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, UserPlus } from 'lucide-react';
import AddStudentModal from '../components/AddStudentModal';
import AddGuestModal from '../components/AddGuestModal';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('https://printtrack-pro-api.onrender.com/api/reports/students');
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching students report", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchStudents();
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post('https://printtrack-pro-api.onrender.com/api/firebase-sync/students');
      const data = res.data;
      if (data.success) {
        alert(`Sync complete!\n\nSeen in Firebase: ${data.firebaseStudentsSeen}\nBatches Created: ${data.batchesCreated}\nStudents Created: ${data.studentsCreated}\nStudents Updated: ${data.studentsUpdated}\nStudents Skipped: ${data.studentsSkipped}`);
        await fetchStudents();
      } else {
        alert(`Sync Failed!\n\nError: ${data.errorMessage || "Unknown error occurred on the server."}`);
      }
    } catch (error) {
      console.error("Error during manual sync", error);
      alert("Failed to initiate sync request. Check if the server is running and try again.");
    } finally {
      setSyncing(false);
    }
  };

  const batches = useMemo(() => {
    const uniqueBatches = new Set(students.map(s => s.batchName));
    return Array.from(uniqueBatches).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchName = s.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBatch = selectedBatch === 'all' || s.batchName === selectedBatch;
      return matchName && matchBatch;
    });
  }, [students, searchTerm, selectedBatch]);

  if (loading) {
    return <div className="p-8 text-white">Loading students...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Students Financial Report</h1>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-primary hover:bg-primaryLight text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                Sync Now
              </>
            )}
          </button>
          <button 
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/35 hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Add Student
          </button>
          <button 
            onClick={() => setIsGuestModalOpen(true)}
            className="flex items-center gap-2 bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm border border-border hover:-translate-y-0.5"
          >
            <UserPlus size={16} />
            Add Guest
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input 
            type="text"
            placeholder="Search student name..."
            className="bg-surface border border-border text-white rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors w-full sm:w-auto text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select 
            className="bg-surface border border-border text-white rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors w-full sm:w-auto text-sm"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="all">-- All Batches --</option>
            {batches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHighlight border-b border-border">
                <th className="p-4 text-sm font-semibold text-white">Student Name</th>
                <th className="p-4 text-sm font-semibold text-white">Batch</th>
                <th className="p-4 text-sm font-semibold text-white text-right">Pages Printed</th>
                <th className="p-4 text-sm font-semibold text-white text-right">Total Cost (₹)</th>
                <th className="p-4 text-sm font-semibold text-rose-400 text-right">Debt / Unpaid (₹)</th>
                <th className="p-4 text-sm font-semibold text-emerald-400 text-right">Cash Paid (₹)</th>
                <th className="p-4 text-sm font-semibold text-emerald-400 text-right">GPay Paid (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.studentId} className="border-b border-border hover:bg-surfaceHighlight/50 transition-colors">
                  <td className="p-4 font-medium text-white">{student.studentName}</td>
                  <td className="p-4 text-textMuted">{student.batchName}</td>
                  <td className="p-4 text-textMuted text-right">{student.totalPagesPrinted}</td>
                  <td className="p-4 text-textMuted text-right">{student.totalCost.toFixed(2)}</td>
                  <td className="p-4 text-rose-400 font-medium text-right">{student.totalDebt.toFixed(2)}</td>
                  <td className="p-4 text-emerald-400/90 text-right">{student.totalCashPaid.toFixed(2)}</td>
                  <td className="p-4 text-emerald-400/90 text-right">{student.totalGPayPaid.toFixed(2)}</td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-textMuted">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentModal 
        isOpen={isStudentModalOpen} 
        onClose={() => setIsStudentModalOpen(false)} 
        onSuccess={fetchStudents} 
      />
      <AddGuestModal 
        isOpen={isGuestModalOpen} 
        onClose={() => setIsGuestModalOpen(false)} 
        onSuccess={fetchStudents} 
      />
    </div>
  );
};

export default Students;
