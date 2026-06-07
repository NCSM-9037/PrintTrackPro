import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const AddStudentModal = ({ isOpen, onClose, onSuccess }) => {
  const [batches, setBatches] = useState([]);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch batches when modal opens
      const fetchBatches = async () => {
        try {
          const res = await axios.get('https://printtrack-pro-api.onrender.com/api/batches');
          setBatches(res.data);
          if (res.data.length > 0) {
            setBatchId(res.data[0].id.toString());
          }
        } catch (error) {
          console.error("Error fetching batches", error);
        }
      };
      fetchBatches();
      
      // Reset form
      setName('');
      setStudentId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !batchId) return;

    setLoading(true);
    try {
      // Generate a temporary ID if none provided
      const finalStudentId = studentId.trim() || `CUSTOM-${Date.now().toString().slice(-6)}`;
      
      await axios.post('https://printtrack-pro-api.onrender.com/api/students', {
        name: name.trim(),
        studentId: finalStudentId,
        batchId: parseInt(batchId),
        status: 'Active'
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating student", error);
      alert("Failed to create student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden slide-in-from-bottom-4 animate-in duration-300">
        <div className="p-5 border-b border-border flex justify-between items-center bg-surfaceHighlight/30">
          <h2 className="text-xl font-bold text-white">Add Custom Student</h2>
          <button onClick={onClose} className="p-2 text-textMuted hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Student Name *</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full px-4 py-2.5 focus:border-primary transition-colors"
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Student ID / Roll No (Optional)</label>
            <input 
              type="text" 
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="glass-input w-full px-4 py-2.5 focus:border-primary transition-colors"
              placeholder="e.g. S12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Batch *</label>
            <select 
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="glass-input w-full px-4 py-2.5 focus:border-primary transition-colors"
            >
              <option value="" disabled>Select a Batch</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.batchName}</option>
              ))}
            </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-textMuted hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !name.trim() || !batchId}
              className="bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary/20"
            >
              {loading ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;
