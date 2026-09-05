import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerPortal from './pages/CustomerPortal';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/portal/:customerId" element={<CustomerPortal />} />
        <Route path="/:customerId" element={<CustomerPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
