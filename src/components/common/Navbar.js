// src/components/common/Navbar.js - Fixed responsive dropdowns
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ onMenuClick, sidebarOpen }) => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // Refs for dropdown positioning
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock notifications - replace with real data
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Invoice Paid',
      message: 'Invoice #INV-2024-001 has been paid',
      time: '2 minutes ago',
      unread: true
    },
    {
      id: 2,
      type: 'warning',
      title: 'GST Filing Due',
      message: 'Your GST return is due in 3 days',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      type: 'info',
      title: 'New Feature',
      message: 'AI receipt scanning is now available',
      time: '1 day ago',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className="navbar-modern sticky top-0 z-40">
      <div className="nav-container">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button 
            className={`
              nav-toggle lg:hidden p-2 rounded-lg transition-all duration-200
              ${sidebarOpen ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 text-gray-600'}
            `}
            onClick={onMenuClick}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              className={`transition-transform duration-200 ${sidebarOpen ? 'rotate-90' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand */}
          <a href="/" className="nav-brand-modern">
            GST SaaS
          </a>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Desktop navigation */}
              <div className="nav-menu hidden lg:flex items-center gap-6">
                <a 
                  href="/dashboard" 
                  className={`nav-link-modern ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                  Dashboard
                </a>
                <a 
                  href="/invoices" 
                  className={`nav-link-modern ${location.pathname.startsWith('/invoices') ? 'active' : ''}`}
                >
                  Invoices
                </a>
                <a 
                  href="/expenses" 
                  className={`nav-link-modern ${location.pathname === '/expenses' ? 'active' : ''}`}
                >
                  Expenses
                </a>
                <a 
                  href="/reports" 
                  className={`nav-link-modern ${location.pathname === '/reports' ? 'active' : ''}`}
                >
                  Reports
                </a>
              </div>

              {/* Quick Actions */}
              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={() => navigate('/invoices/create')}
                  className="btn btn-primary btn-sm btn-modern"
                  data-tooltip="Create New Invoice"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Invoice
                </button>
              </div>

              {/* Notifications - Responsive */}
              <div className="relative" ref={notificationRef}>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a2.828 2.828 0 000-4L13 6" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Enhanced Responsive Notifications Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-200 ease-out animate-scale-in">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`
                            p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer
                            ${notification.unread ? 'bg-blue-50/50' : ''}
                            active:bg-gray-100 sm:active:bg-gray-50
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                              ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 
                                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                                'bg-blue-100 text-blue-600'}
                            `}>
                              <div className="w-2 h-2 rounded-full bg-current"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 text-sm line-clamp-1">{notification.title}</p>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-gray-400 text-xs mt-2">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-4 text-center bg-gray-50 border-t border-gray-200">
                      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors">
                        View all notifications →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User dropdown - Responsive */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full ring-2 ring-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-gray-900">
                      {user.displayName || 'User'}
                    </div>
                    {userData?.plan && (
                      <div className="text-xs text-gray-500 capitalize">
                        {userData.plan} Plan
                      </div>
                    )}
                  </div>

                  <svg className={`
                    w-4 h-4 text-gray-400 transition-transform duration-200
                    ${dropdownOpen ? 'rotate-180' : ''}
                  `} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Enhanced Responsive User Dropdown Menu */}
                {dropdownOpen && (
                  <div className={`
                    absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden
                    transform transition-all duration-200 ease-out animate-scale-in
                    
                    /* Positioning: Always right-aligned, contained within viewport */
                    right-0 w-72 max-w-[calc(100vw-2rem)]
                    
                    /* Mobile adjustments */
                    sm:w-72 sm:max-w-72
                  `}>
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.displayName}
                            className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm">
                            {user.displayName?.[0] || user.email?.[0] || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {user.displayName || 'User'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                          {userData?.plan && (
                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {userData.plan} Plan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats - Mobile Optimized */}
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {userData?.usage?.invoicesThisMonth || 0}
                          </div>
                          <div className="text-xs text-gray-500">Invoices</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            ₹{(userData?.revenue?.thisMonth || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-xs text-gray-500">Revenue</div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items - Touch Friendly */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/dashboard');
                          setDropdownOpen(false);
                        }}
                        className="dropdown-item-modern w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        Dashboard
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/invoices/create');
                          setDropdownOpen(false);
                        }}
                        className="dropdown-item-modern w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Invoice
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setDropdownOpen(false);
                        }}
                        className="dropdown-item-modern w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setDropdownOpen(false);
                        }}
                        className="dropdown-item-modern w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Billing
                      </button>

                      <div className="my-2 h-px bg-gray-200"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="dropdown-item-modern w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors active:bg-red-100"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <a href="/login" className="btn btn-outline btn-sm btn-modern">
                Login
              </a>
              <a href="/register" className="btn btn-primary btn-sm btn-modern">
                Get Started
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;