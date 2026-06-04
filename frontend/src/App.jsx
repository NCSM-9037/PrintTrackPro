import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentsList from './pages/StudentsList';
import PrintersList from './pages/PrintersList';
import TransactionsList from './pages/TransactionsList';

// Placeholder for Batches
const BatchesList = () => <div className="p-8"><h1 className="text-3xl text-white font-bold">Batches</h1><p className="text-textMuted mt-2">Batches management coming soon.</p></div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="batches" element={<BatchesList />} />
          <Route path="printers" element={<PrintersList />} />
          <Route path="transactions" element={<TransactionsList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
