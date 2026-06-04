import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-8 text-white">Loading students...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Students Financial Report</h1>
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
              {students.map((student) => (
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
              {students.length === 0 && (
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
