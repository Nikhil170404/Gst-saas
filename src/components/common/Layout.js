// src/components/common/Layout.js
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`main-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
          <div className="container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;