import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, User, MoreVertical } from 'lucide-react';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('http://localhost:5015/api/students');
        setStudents(res.data);
      } catch (error) {
        console.error("Error fetching students", error);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Students</h1>
          <p className="text-textMuted">Manage all {students.length} students across all batches.</p>
        </div>
        <button className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors">
          <Plus size={20} />
          Add Student
        </button>
      </div>

      <div className="glass-card flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="glass-input px-4 py-2.5 min-w-[150px]">
              <option value="">All Batches</option>
              {/* Batches options would go here */}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur z-10 border-b border-border text-xs uppercase text-textMuted font-semibold">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-surfaceHighlight/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div className="font-medium text-white">{student.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-textMuted font-mono text-sm">{student.studentId}</td>
                  <td className="px-6 py-4 text-textMuted">{student.batch?.batchName || `Batch ID: ${student.batchId}`}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-textMuted hover:text-white p-2 rounded-lg hover:bg-surfaceHighlight transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-textMuted">
                    <User size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No students found.</p>
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

export default StudentsList;
