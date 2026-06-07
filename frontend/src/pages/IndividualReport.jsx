import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const IndividualReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [selectedBatchName, setSelectedBatchName] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState(null);
  const [editCash, setEditCash] = useState('');
  const [editGPay, setEditGPay] = useState('');
  const [editGivenBack, setEditGivenBack] = useState('0');
  const [editLoading, setEditLoading] = useState(false);

  // Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState('');
  const [addPages, setAddPages] = useState('1');
  const [addPrintType, setAddPrintType] = useState('single');
  const [addCost, setAddCost] = useState('3');
  const [addDescription, setAddDescription] = useState('Manual Print');
  const [addCash, setAddCash] = useState('0');
  const [addGPay, setAddGPay] = useState('0');
  const [addLoading, setAddLoading] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('https://printtrack-pro-api.onrender.com/api/reports/transactions');
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, studentsRes] = await Promise.all([
          axios.get('https://printtrack-pro-api.onrender.com/api/reports/transactions'),
          axios.get('https://printtrack-pro-api.onrender.com/api/reports/students')
        ]);
        setTransactions(txRes.data);
        setStudents(studentsRes.data);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Recalculate cost based on pages and type
  useEffect(() => {
    if (addPrintType === 'custom') return;
    const pages = parseInt(addPages) || 0;
    if (pages <= 0) {
      setAddCost('0');
      return;
    }
    let cost = 0;
    if (addPrintType === 'single') {
      cost = pages * 3;
    } else if (addPrintType === 'double') {
      cost = Math.ceil(pages / 2.0) * 4;
    } else if (addPrintType === 'booklet') {
      cost = Math.ceil(pages / 4.0) * 4;
    }
    setAddCost(cost.toString());
  }, [addPages, addPrintType]);

  const addCalculatedDebt = useMemo(() => {
    const cost = parseFloat(addCost) || 0;
    const cash = parseFloat(addCash) || 0;
    const gpay = parseFloat(addGPay) || 0;
    return cost - cash - gpay;
  }, [addCost, addCash, addGPay]);

  const handleOpenAddModal = () => {
    setAddStudentId('');
    setAddPages('1');
    setAddPrintType('single');
    setAddCost('3');
    setAddDescription('Manual Print');
    setAddCash('0');
    setAddGPay('0');
    setAddSearchQuery('');
    setShowStudentDropdown(false);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!addStudentId) {
      alert("Please select a student first.");
      return;
    }
    const student = students.find(s => s.studentId === parseInt(addStudentId));
    if (!student) {
      alert("Selected student not found.");
      return;
    }

    setAddLoading(true);
    try {
      await axios.post('https://printtrack-pro-api.onrender.com/api/transactions/process', {
        studentId: parseInt(addStudentId),
        batchId: student.batchId,
        totalAmount: parseFloat(addCost) || 0,
        pages: parseInt(addPages) || 1,
        description: addDescription || 'Manual Print',
        cashAmount: parseFloat(addCash) || 0,
        googlePayAmount: parseFloat(addGPay) || 0
      });
      
      await fetchTransactions(); // Refresh table
      
      // Also refresh the students list to make sure we have updated info
      const studentsRes = await axios.get('https://printtrack-pro-api.onrender.com/api/reports/students');
      setStudents(studentsRes.data);
      
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error creating transaction", error);
      alert(error.response?.data || "Failed to create transaction.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditClick = (tx) => {
    setEditingTx(tx);
    setEditCash(tx.cashAmount.toString());
    setEditGPay(tx.gPayAmount.toString());
    setEditGivenBack('0');
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    setEditLoading(true);
    try {
      await axios.put(`https://printtrack-pro-api.onrender.com/api/transactions/${editingTx.transactionId}/payment`, {
        cashAmount: parseFloat(editCash) || 0,
        googlePayAmount: parseFloat(editGPay) || 0,
        givenBackAmount: parseFloat(editGivenBack) || 0
      });
      await fetchTransactions(); // Refresh
      setEditingTx(null);
    } catch (error) {
      console.error("Error saving payment", error);
      alert("Failed to save changes.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = async (tx) => {
    if (window.confirm(`Are you sure you want to completely delete this print record?\n\nCost: ₹${tx.totalAmount.toFixed(2)}\nDescription: ${tx.description}\n\nThis will automatically correct the student's debt balance.`)) {
      try {
        await axios.delete(`https://printtrack-pro-api.onrender.com/api/transactions/${tx.transactionId}`);
        await fetchTransactions(); // Refresh
      } catch (error) {
        console.error("Error deleting transaction", error);
        alert("Failed to delete the transaction.");
      }
    }
  };

  const batches = useMemo(() => {
    const uniqueBatches = new Set(students.map(s => s.batchName));
    return Array.from(uniqueBatches).sort();
  }, [students]);

  const filteredStudentsForFilter = useMemo(() => {
    if (selectedBatchName === 'all') return students;
    return students.filter(s => s.batchName === selectedBatchName);
  }, [students, selectedBatchName]);

  const handleBatchChange = (e) => {
    setSelectedBatchName(e.target.value);
    setSelectedStudentId('all');
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    
    if (selectedBatchName !== 'all') {
      const studentIdsInBatch = new Set(
        students.filter(s => s.batchName === selectedBatchName).map(s => s.studentId)
      );
      result = result.filter(t => studentIdsInBatch.has(t.studentId));
    }
    
    if (selectedStudentId !== 'all') {
      result = result.filter(t => t.studentId === parseInt(selectedStudentId));
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.studentName && t.studentName.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
    }
    
    return result;
  }, [transactions, students, selectedBatchName, selectedStudentId, searchTerm]);

  // Search and filter students in the dropdown
  const filteredSearchStudents = useMemo(() => {
    if (!addSearchQuery) return students;
    return students.filter(s => 
      s.studentName.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
      s.batchName.toLowerCase().includes(addSearchQuery.toLowerCase())
    );
  }, [students, addSearchQuery]);

  const selectedStudentObj = useMemo(() => {
    return students.find(s => s.studentId === parseInt(addStudentId));
  }, [students, addStudentId]);

  if (loading) {
    return <div className="p-8 text-white">Loading reports...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Individual Reports</h1>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-primary hover:bg-primaryLight text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            Record Print
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input 
            type="text"
            placeholder="Search student or description..."
            className="bg-surface border border-border text-white rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors text-sm w-full sm:w-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <label className="text-textMuted font-medium text-sm whitespace-nowrap">Filter by Batch:</label>
            <select 
              className="bg-surface border border-border text-white rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors text-sm min-w-[140px]"
              value={selectedBatchName}
              onChange={handleBatchChange}
            >
              <option value="all">-- All Batches --</option>
              {batches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-textMuted font-medium text-sm whitespace-nowrap">Student:</label>
            <select 
              className="bg-surface border border-border text-white rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors text-sm min-w-[180px]"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="all">-- All Students --</option>
              {filteredStudentsForFilter.map(s => (
                <option key={s.studentId} value={s.studentId}>{s.studentName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHighlight border-b border-border">
                <th className="p-4 text-sm font-semibold text-white">Date</th>
                <th className="p-4 text-sm font-semibold text-white">Student</th>
                <th className="p-4 text-sm font-semibold text-white">Description</th>
                <th className="p-4 text-sm font-semibold text-white text-right">Pages</th>
                <th className="p-4 text-sm font-semibold text-white text-right">Cost (₹)</th>
                <th className="p-4 text-sm font-semibold text-emerald-400 text-right">Cash Paid (₹)</th>
                <th className="p-4 text-sm font-semibold text-emerald-400 text-right">GPay Paid (₹)</th>
                <th className="p-4 text-sm font-semibold text-rose-400 text-right">Unpaid (₹)</th>
                <th className="p-4 text-sm font-semibold text-textMuted text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const unpaid = tx.totalAmount - tx.cashAmount - tx.gPayAmount;
                return (
                  <tr key={tx.transactionId} className="border-b border-border hover:bg-surfaceHighlight/50 transition-colors">
                    <td className="p-4 text-textMuted whitespace-nowrap">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-4 font-medium text-white">{tx.studentName}</td>
                    <td className="p-4 text-textMuted max-w-[200px] truncate" title={tx.description}>{tx.description || '-'}</td>
                    <td className="p-4 text-textMuted text-right">{tx.pages}</td>
                    <td className="p-4 text-white font-medium text-right">{tx.totalAmount.toFixed(2)}</td>
                    <td className="p-4 text-emerald-400/90 text-right">{tx.cashAmount.toFixed(2)}</td>
                    <td className="p-4 text-emerald-400/90 text-right">{tx.gPayAmount.toFixed(2)}</td>
                    <td className="p-4 text-rose-400 text-right font-medium">{unpaid !== 0 ? unpaid.toFixed(2) : '0.00'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(tx)}
                          className="text-primary hover:text-primaryLight transition-colors p-1"
                          title="Edit Payment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(tx)}
                          className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                          title="Delete Transaction"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-textMuted">No transactions found for this student.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Print (Add Transaction) Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-border bg-surfaceHighlight/30 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Record Print Job</h2>
                <p className="text-textMuted text-xs mt-1">Manually enter a printing transaction for billing.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-textMuted hover:text-white text-2xl transition-colors font-light leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {/* Searchable Student Field */}
              <div className="relative">
                <label className="block text-textMuted font-medium text-sm mb-1.5">Select Student *</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Type student name to search..."
                    value={addSearchQuery}
                    onChange={(e) => {
                      setAddSearchQuery(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    className="w-full bg-background border border-border rounded-xl p-3 pr-10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  />
                  {addSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => {
                        setAddSearchQuery('');
                        setAddStudentId('');
                      }}
                      className="absolute right-3 top-3 text-textMuted hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  )}
                </div>

                {/* Overlay background to close dropdown when clicking outside */}
                {showStudentDropdown && (
                  <div className="fixed inset-0 z-40" onClick={() => setShowStudentDropdown(false)} />
                )}

                {/* Dropdown Menu */}
                {showStudentDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-surfaceHighlight border border-border rounded-xl max-h-60 overflow-y-auto shadow-2xl">
                    {filteredSearchStudents.map(s => (
                      <div 
                        key={s.studentId}
                        onClick={() => {
                          setAddStudentId(s.studentId.toString());
                          setAddSearchQuery(`${s.studentName} (${s.batchName})`);
                          setShowStudentDropdown(false);
                        }}
                        className="p-3 hover:bg-primary/20 text-white cursor-pointer border-b border-border/30 last:border-none transition-colors text-sm"
                      >
                        <div className="font-semibold text-white">{s.studentName}</div>
                        <div className="text-xs text-textMuted">{s.batchName}</div>
                      </div>
                    ))}
                    {filteredSearchStudents.length === 0 && (
                      <div className="p-3 text-textMuted text-center text-sm">No students found</div>
                    )}
                  </div>
                )}
                
                {selectedStudentObj && (
                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    ✓ Verified student in batch: <span className="underline">{selectedStudentObj.batchName}</span>
                  </p>
                )}
                {!addStudentId && addSearchQuery && (
                  <p className="text-amber-400 text-xs mt-1">⚠️ Please click on a student from the dropdown list to confirm your selection.</p>
                )}
              </div>

              {/* Pages & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-textMuted font-medium text-sm mb-1.5">Number of Pages *</label>
                  <input 
                    type="number"
                    min="1"
                    value={addPages}
                    onChange={(e) => setAddPages(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-white focus:border-primary outline-none text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-textMuted font-medium text-sm mb-1.5">Description / Document Name</label>
                  <input 
                    type="text"
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-white focus:border-primary outline-none text-sm"
                    placeholder="e.g. Practical Print"
                  />
                </div>
              </div>

              {/* Print Type / Rate Mode */}
              <div>
                <label className="block text-textMuted font-medium text-sm mb-2">Billing Mode / Print Rate</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'single', name: 'Single (₹3/pg)' },
                    { id: 'double', name: 'Double (₹4/sht)' },
                    { id: 'booklet', name: 'Booklet (₹4/sht)' },
                    { id: 'custom', name: 'Custom Rate' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAddPrintType(mode.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        addPrintType === mode.id 
                          ? 'bg-primary/25 border-primary text-white ring-1 ring-primary' 
                          : 'bg-background border-border text-textMuted hover:text-white hover:border-border/80'
                      }`}
                    >
                      {mode.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Calculated Cost */}
              <div>
                <label className="block text-textMuted font-medium text-sm mb-1.5">Total Print Cost (₹)</label>
                <input 
                  type="number"
                  step="0.01"
                  disabled={addPrintType !== 'custom'}
                  value={addCost}
                  onChange={(e) => setAddCost(e.target.value)}
                  className={`w-full bg-background border border-border rounded-xl p-3 text-white focus:border-primary outline-none text-sm font-bold ${
                    addPrintType !== 'custom' ? 'opacity-70 cursor-not-allowed bg-surfaceHighlight/25 text-primary' : 'focus:border-primary text-white'
                  }`}
                  placeholder="0.00"
                />
                {addPrintType !== 'custom' && (
                  <p className="text-[11px] text-textMuted/70 mt-1">Cost is auto-computed. Select "Custom Rate" to edit manually.</p>
                )}
              </div>

              <div className="border-t border-border/40 my-2 pt-2"></div>

              {/* Payments Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-textMuted font-medium text-sm mb-1.5">Cash Received (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={addCash}
                    onChange={(e) => setAddCash(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-white focus:border-primary outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-textMuted font-medium text-sm mb-1.5">Google Pay Received (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={addGPay}
                    onChange={(e) => setAddGPay(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-white focus:border-primary outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Debt / Credit Calculation Preview */}
              <div className={`p-4 rounded-xl border flex justify-between items-center transition-all duration-300 ${
                addCalculatedDebt > 0 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                  : addCalculatedDebt < 0 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/80'
              }`}>
                <span className="font-semibold text-sm">
                  {addCalculatedDebt > 0 
                    ? 'Outstanding Balance (Added to Student Debt):' 
                    : addCalculatedDebt < 0 
                      ? 'Overpayment Balance (Credit/Change Owed):' 
                      : 'Payment Status:'}
                </span>
                <span className="font-bold text-lg">
                  {addCalculatedDebt > 0 
                    ? `₹${addCalculatedDebt.toFixed(2)}` 
                    : addCalculatedDebt < 0 
                      ? `₹${Math.abs(addCalculatedDebt).toFixed(2)}` 
                      : '✓ Fully Paid'}
                </span>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-surfaceHighlight/30 flex justify-end gap-3">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-textMuted hover:text-white hover:bg-surfaceHighlight transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAdd}
                disabled={addLoading || !addStudentId}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primaryLight text-white font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/15"
              >
                {addLoading ? 'Saving...' : 'Record Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border bg-surfaceHighlight/30">
              <h2 className="text-xl font-bold text-white">Edit Payment</h2>
              <p className="text-textMuted text-sm mt-1">{editingTx.studentName} - {new Date(editingTx.date).toLocaleDateString()}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center p-3 bg-surfaceHighlight rounded-lg">
                <span className="text-textMuted font-medium">Total Print Cost:</span>
                <span className="text-white font-bold text-lg">₹{editingTx.totalAmount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-textMuted font-medium mb-1">Cash Handed To You (₹)</label>
                <input 
                  type="number" 
                  value={editCash} 
                  onChange={e => setEditCash(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-primary outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-textMuted font-medium mb-1">Google Pay Sent (₹)</label>
                <input 
                  type="number" 
                  value={editGPay} 
                  onChange={e => setEditGPay(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-primary outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-textMuted font-medium mb-1">Change Given Back (₹)</label>
                <input 
                  type="number" 
                  value={editGivenBack} 
                  onChange={e => setEditGivenBack(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-primary outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mt-2">
                <span className="text-emerald-400 font-medium">Net Payment Recorded:</span>
                <span className="text-emerald-400 font-bold text-lg">
                  ₹{((parseFloat(editCash) || 0) + (parseFloat(editGPay) || 0) - (parseFloat(editGivenBack) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-surfaceHighlight/30 flex justify-end gap-3">
              <button 
                onClick={() => setEditingTx(null)}
                className="px-5 py-2.5 rounded-lg text-textMuted hover:text-white hover:bg-surfaceHighlight transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primaryLight text-white font-medium transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualReport;
