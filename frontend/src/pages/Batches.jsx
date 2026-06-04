import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Batches() {
  const [batches, setBatches] = useState([
    { id: 1, batchName: 'CS 2024', year: '2024', department: 'Computer Science', studentCount: 45 },
    { id: 2, batchName: 'IT 2024', year: '2024', department: 'Information Tech', studentCount: 30 },
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Batches</h1>
          <p className="text-gray-500">Manage student batches and departments.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add Batch</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map(batch => (
          <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{batch.batchName}</h3>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                <button className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Department:</span>
                <span>{batch.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Year:</span>
                <span>{batch.year}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Registered Students</span>
              <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full">{batch.studentCount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
