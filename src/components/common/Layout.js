// src/components/common/Layout.js - Enhanced version
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navbar */}
      <Navbar 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />
      
      {/* Main Layout */}
      <div className="flex">
        {/* Enhanced Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main Content Area */}
        <main className={`
          main-content transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'with-sidebar' : ''}
          flex-1 min-h-screen
        `}>
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Content Wrapper with Animation */}
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;