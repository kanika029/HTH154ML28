import React, { useState } from 'react';
import { DashboardPage } from './pages/Dashboard';
import { ReportsPage } from './pages/Reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-100 font-sans">
      {currentPage === 'dashboard' ? (
        <DashboardPage onViewReports={() => setCurrentPage('reports')} />
      ) : (
        <ReportsPage onBack={() => setCurrentPage('dashboard')} />
      )}
    </div>
  );
}
