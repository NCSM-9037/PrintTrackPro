import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Lock, Unlock } from 'lucide-react';

const AddGuestModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPassword('');
      setName('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (e) => {
    e.preventDefault();
    if (password === '##print##guest##') {
      setStep(2);
      setError('');
    } else {
      setError('Incorrect authorization password.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // 1. Fetch all batches to find the "Guests" batch
      const batchesRes = await axios.get('https://printtrack-pro-api.onrender.com/api/batches');
      const batches = batchesRes.data;
      
      let guestBatch = batches.find(b => b.batchName.toLowerCase() === 'guests');
      let guestBatchId;

      // 2. If "Guests" batch doesn't exist, create it
      if (!guestBatch) {
        const createBatchRes = await axios.post('https://printtrack-pro-api.onrender.com/api/batches', {
          batchName: 'Guests',
          year: 'N/A',
          department: 'Guest User'
        });
        guestBatchId = createBatchRes.data.id;
      } else {
        guestBatchId = guestBatch.id;
      }

      // 3. Create the guest student
      const guestId = `GUEST-${Date.now().toString().slice(-6)}`;
      await axios.post('https://printtrack-pro-api.onrender.com/api/students', {
        name: name.trim(),
        studentId: guestId,
        batchId: guestBatchId,
        status: 'Active'
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating guest", error);
      alert("Failed to create guest. Ensure the server is reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden slide-in-from-bottom-4 animate-in duration-300">
        <div className="p-5 border-b border-border flex justify-between items-center bg-surfaceHighlight/30">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {step === 1 ? <Lock size={20} className="text-rose-400" /> : <Unlock size={20} className="text-emerald-400" />}
            Add Guest Profile
          </h2>
          <button onClick={onClose} className="p-2 text-textMuted hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {step === 1 ? (
          <form onSubmit={handleVerify} className="p-6 space-y-5">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-2">
              <p className="text-rose-400 text-sm font-medium">Guest creation is restricted. Please enter the authorization password to continue.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">Authorization Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className={`glass-input w-full px-4 py-2.5 transition-colors ${error ? 'border-rose-500/50 focus:border-rose-500' : 'focus:border-primary'}`}
                placeholder="Enter password..."
              />
              {error && <p className="text-rose-400 text-sm mt-1.5">{error}</p>}
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-textMuted hover:text-white transition-colors font-medium">
                Cancel
              </button>
              <button type="submit" disabled={!password} className="bg-primary hover:bg-primaryHover disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary/20">
                Verify
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-2">
              <p className="text-emerald-400 text-sm font-medium">Access verified! The guest will automatically be assigned to the "Guests" batch.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-textMuted mb-1.5">Guest Full Name *</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full px-4 py-2.5 focus:border-emerald-500 transition-colors"
                placeholder="e.g. Science Fair Judge"
              />
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-textMuted hover:text-white transition-colors font-medium">
                Cancel
              </button>
              <button type="submit" disabled={loading || !name.trim()} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20">
                {loading ? 'Saving...' : 'Add Guest'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddGuestModal;
