// src/components/common/Sidebar.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      ),
    },
    {
      name: 'Invoices',
      path: '/invoices',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
      ),
      badge: userData?.usage?.invoicesThisMonth,
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m15 9-6 6"></path>
          <path d="m9 9 .01 0"></path>
          <path d="m15 15 .01 0"></path>
        </svg>
      ),
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 3v18h18"></path>
          <path d="m19 9-5 5-4-4-3 3"></path>
        </svg>
      ),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6"></path>
          <path d="m15.5 3.5-3 3 2 2 3-3"></path>
          <path d="m6.5 16.5 3-3-2-2-3 3"></path>
          <path d="m20.5 6.5-3 3 2 2 3-3"></path>
          <path d="m3.5 17.5 3-3-2-2-3 3"></path>
        </svg>
      ),
    },
  ];

  const handleItemClick = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md-hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'active' : ''} md-block`}>
        <div className="sidebar-menu">
          {/* Plan status */}
          {userData?.plan && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="text-sm font-medium text-primary-900 capitalize">
                {userData.plan} Plan
              </div>
              {userData.plan === 'free' && (
                <div className="text-xs text-primary-700 mt-1">
                  {10 - (userData?.usage?.invoicesThisMonth || 0)} invoices left this month
                </div>
              )}
              {userData.plan === 'free' && (
                <button 
                  onClick={() => handleItemClick('/settings')}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2"
                >
                  Upgrade Plan →
                </button>
              )}
            </div>
          )}

          {/* Menu items */}
          <nav>
            {menuItems.map((item) => (
              <div
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={`sidebar-item ${
                  location.pathname === item.path ? 'active' : ''
                }`}
              >
                <div className="sidebar-item-icon">
                  {item.icon}
                </div>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="badge badge-info">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </nav>

          {/* Quick actions */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-3">Quick Actions</div>
            
            <button
              onClick={() => handleItemClick('/invoices/create')}
              className="w-full btn btn-primary btn-sm mb-2"
            >
              + New Invoice
            </button>
            
            <button
              onClick={() => handleItemClick('/expenses')}
              className="w-full btn btn-secondary btn-sm"
            >
              + Add Expense
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
