// src/components/common/Navbar.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button className="nav-toggle md-hidden" onClick={onMenuClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand */}
          <a href="/" className="nav-brand">
            GST SaaS
          </a>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Desktop navigation */}
              <div className="nav-menu hidden md-flex">
                <a href="/dashboard" className="nav-link">Dashboard</a>
                <a href="/invoices" className="nav-link">Invoices</a>
                <a href="/expenses" className="nav-link">Expenses</a>
                <a href="/reports" className="nav-link">Reports</a>
              </div>

              {/* User dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  
                  <div className="hidden sm-block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName || 'User'}
                    </div>
                    {userData?.plan && (
                      <div className="text-xs text-gray-500 capitalize">
                        {userData.plan} Plan
                      </div>
                    )}
                  </div>

                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Billing
                      </button>

                      <hr className="my-1" />
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <a href="/login" className="btn btn-outline btn-sm">
                Login
              </a>
              <a href="/register" className="btn btn-primary btn-sm">
                Get Started
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;