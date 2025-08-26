// src/components/common/Sidebar.js - Enhanced version
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
          <rect x="3" y="3" width="7" height="9" rx="1"></rect>
          <rect x="14" y="3" width="7" height="5" rx="1"></rect>
          <rect x="14" y="12" width="7" height="9" rx="1"></rect>
          <rect x="3" y="16" width="7" height="5" rx="1"></rect>
        </svg>
      ),
      description: 'Overview & Analytics'
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
      description: 'Manage Invoices'
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
      description: 'Track Expenses'
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
      description: 'Business Analytics'
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
      description: 'Account Settings'
    },
  ];

  const handleItemClick = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`sidebar-modern ${isOpen ? 'active' : ''} lg:!left-0`}>
        <div className="sidebar-menu p-6">
          {/* Plan Status Card */}
          {userData?.plan && (
            <div className="mb-8 p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 transition-all duration-300 bg-gradient-to-br from-primary-50 to-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 capitalize">
                    {userData.plan} Plan
                  </div>
                  <div className="text-xs text-gray-500">
                    {userData.plan === 'free' ? 'Free Forever' : 'Pro Features'}
                  </div>
                </div>
              </div>
              
              {userData.plan === 'free' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Invoices used</span>
                    <span className="font-medium">
                      {userData?.usage?.invoicesThisMonth || 0}/10
                    </span>
                  </div>
                  <div className="progress-modern">
                    <div 
                      className="progress-fill-modern" 
                      style={{ 
                        width: `${Math.min(((userData?.usage?.invoicesThisMonth || 0) / 10) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => handleItemClick('/settings')}
                    className="w-full text-xs bg-gradient-primary text-white font-medium py-2 px-3 rounded-lg hover:shadow-lg transition-all duration-200 mt-3"
                  >
                    Upgrade Plan →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
              Main Menu
            </div>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              
              return (
                <div
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={`
                    sidebar-item-modern group cursor-pointer
                    ${isActive ? 'active' : ''}
                  `}
                >
                  <div className="sidebar-item-icon">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-400 group-hover:text-current transition-colors">
                      {item.description}
                    </div>
                  </div>
                  {item.badge && (
                    <span className="status-badge status-info">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
              Quick Actions
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleItemClick('/invoices/create')}
                className="w-full btn btn-primary btn-modern text-sm py-3 px-4 rounded-xl shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Invoice
              </button>
              
              <button
                onClick={() => handleItemClick('/expenses')}
                className="w-full btn btn-outline btn-modern text-sm py-3 px-4 rounded-xl"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Add Expense
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-blue-900 text-sm">Need Help?</div>
                  <div className="text-xs text-blue-700">Get support & tutorials</div>
                </div>
              </div>
              <button className="text-xs text-blue-700 hover:text-blue-800 font-medium">
                Visit Help Center →
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;