import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('https://printtrack-pro-api.onrender.com/api/reports/students');
        setStudents(res.data);
      } catch (error) {
        console.error("Error fetching students report", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

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
        <h1 className="text-3xl font-bold text-white">Students Financial Report</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input 
            type="text"
            placeholder="Search student name..."
            className="bg-surface border border-border text-white rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors w-full sm:w-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select 
            className="bg-surface border border-border text-white rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors w-full sm:w-auto"
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
    </div>
  );
};

export default Students;
