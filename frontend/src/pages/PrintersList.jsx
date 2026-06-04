import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Printer, Edit2, Settings, X } from 'lucide-react';

const PrintersList = () => {
  const [printers, setPrinters] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    printerName: '',
    location: '',
    blackWhiteRate: 2.0,
    colorRate: 10.0
  });

  const fetchPrinters = async () => {
    try {
      const res = await axios.get('http://localhost:5015/api/printers');
      setPrinters(res.data);
    } catch (error) {
      console.error("Error fetching printers", error);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5015/api/printers', {
        ...formData,
        blackWhiteRate: parseFloat(formData.blackWhiteRate),
        colorRate: parseFloat(formData.colorRate)
      });
      setIsModalOpen(false);
      setFormData({ printerName: '', location: '', blackWhiteRate: 2.0, colorRate: 10.0 });
      fetchPrinters();
    } catch (error) {
      console.error("Error creating printer", error);
      alert("Failed to add printer.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Printers</h1>
          <p className="text-textMuted">Manage network printers and set printing rates.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors">
          <Plus size={20} />
          Add Printer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {printers.map(printer => (
          <div key={printer.id} className="glass-card p-6 relative group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Printer size={24} />
              </div>
              <button className="text-textMuted hover:text-white p-2 bg-surfaceHighlight/50 rounded-lg transition-colors">
                <Edit2 size={18} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{printer.printerName}</h3>
            <p className="text-textMuted text-sm mb-6 flex items-center gap-2">
              <Settings size={14} />
              Location: {printer.location || "Default Lab"}
            </p>

            <div className="grid grid-cols-2 gap-4 bg-surfaceHighlight/30 p-4 rounded-xl border border-white/5">
              <div>
                <p className="text-xs text-textMuted uppercase tracking-wider mb-1">B&W Rate</p>
                <p className="text-lg font-bold text-white">₹{printer.blackWhiteRate}</p>
              </div>
              <div>
                <p className="text-xs text-textMuted uppercase tracking-wider mb-1">Color Rate</p>
                <p className="text-lg font-bold text-white">₹{printer.colorRate}</p>
              </div>
            </div>
          </div>
        ))}

        {printers.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-textMuted border-2 border-dashed border-border rounded-2xl">
            <Printer size={48} className="mb-4 opacity-20" />
            <p>No printers added yet.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-primary hover:text-primaryHover font-medium">
              Setup your first printer
            </button>
          </div>
        )}
      </div>

      {/* Add Printer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add New Printer</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-textMuted hover:text-white transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Printer Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.printerName}
                  onChange={e => setFormData({...formData, printerName: e.target.value})}
                  className="glass-input w-full px-4 py-2"
                  placeholder="e.g. HP LaserJet Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Location</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="glass-input w-full px-4 py-2"
                  placeholder="e.g. Main Lab"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">B&W Rate (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.5"
                    value={formData.blackWhiteRate}
                    onChange={e => setFormData({...formData, blackWhiteRate: e.target.value})}
                    className="glass-input w-full px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-1">Color Rate (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.5"
                    value={formData.colorRate}
                    onChange={e => setFormData({...formData, colorRate: e.target.value})}
                    className="glass-input w-full px-4 py-2"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-white font-medium hover:bg-surfaceHighlight transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-primary hover:bg-primaryHover text-white font-medium shadow-lg shadow-primary/20 transition-all"
                >
                  Save Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintersList;
