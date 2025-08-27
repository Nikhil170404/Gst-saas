// src/components/common/Sidebar.js - Enhanced version with all new pages
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();

  const menuSections = [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1"></rect>
              <rect x="14" y="3" width="7" height="5" rx="1"></rect>
              <rect x="14" y="12" width="7" height="9" rx="1"></rect>
              <rect x="3" y="16" width="7" height="5" rx="1"></rect>
            </svg>
          ),
          description: 'Business Overview'
        }
      ]
    },
    {
      title: 'Sales & Revenue',
      items: [
        {
          name: 'Invoices',
          path: '/invoices',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          ),
          badge: userData?.usage?.invoicesThisMonth,
          description: 'Create & Manage Invoices'
        },
        {
          name: 'Customers',
          path: '/customers',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          ),
          description: 'Customer Management'
        },
        {
          name: 'Projects',
          path: '/projects',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          ),
          description: 'Project Tracking',
          beta: true
        }
      ]
    },
    {
      title: 'Operations',
      items: [
        {
          name: 'Expenses',
          path: '/expenses',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M16 8l-8 8"></path>
              <path d="M16 16H8"></path>
            </svg>
          ),
          description: 'Track Business Expenses'
        },
        {
          name: 'Inventory',
          path: '/inventory',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27A2 2 0 0 0 21 16z"></path>
              <polyline points="7.5,9.5 12,7 16.5,9.5"></polyline>
            </svg>
          ),
          description: 'Stock Management',
          enabled: isFeatureEnabled('inventory_management')
        },
        {
          name: 'Purchase Orders',
          path: '/purchase-orders',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          ),
          description: 'Procurement Management'
        },
        {
          name: 'Vendors',
          path: '/vendors',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          ),
          description: 'Supplier Management'
        }
      ]
    },
    {
      title: 'Finance & Banking',
      items: [
        {
          name: 'Banking',
          path: '/banking',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <path d="M16 8h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4"></path>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="M6 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"></path>
            </svg>
          ),
          description: 'Bank Reconciliation',
          enabled: isFeatureEnabled('banking_integration')
        },
        {
          name: 'Payroll',
          path: '/payroll',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          ),
          description: 'Employee Payroll',
          enabled: isFeatureEnabled('payroll_system'),
          beta: true
        }
      ]
    },
    {
      title: 'Compliance & Tax',
      items: [
        {
          name: 'GST Filing',
          path: '/gst-filing',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          ),
          description: 'GST Return Filing',
          beta: true
        },
        {
          name: 'Compliance',
          path: '/compliance',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
          ),
          description: 'Regulatory Compliance'
        }
      ]
    },
    {
      title: 'Analytics & Reports',
      items: [
        {
          name: 'Reports',
          path: '/reports',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"></path>
              <path d="M18 17l-5-5-4 4-3-3"></path>
            </svg>
          ),
          description: 'Business Analytics'
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          name: 'Integrations',
          path: '/integrations',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          ),
          description: 'Third-party Apps',
          enabled: isFeatureEnabled('api_integrations'),
          beta: true
        },
        ...(userData?.plan !== 'free' ? [{
          name: 'User Management',
          path: '/users',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          ),
          description: 'Team Management',
          enabled: isFeatureEnabled('multi_user_access')
        }] : []),
        {
          name: 'Settings',
          path: '/settings',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6"></path>
              <path d="M15.5 3.5l-3 3 2 2 3-3"></path>
              <path d="M6.5 16.5l3-3-2-2-3 3"></path>
              <path d="M20.5 6.5l-3 3 2 2 3-3"></path>
              <path d="M3.5 17.5l3-3-2-2-3 3"></path>
            </svg>
          ),
          description: 'Account Settings'
        }
      ]
    }
  ];

  const handleItemClick = (path) => {
    navigate(path);
    onClose();
  };

  const isItemActive = (path) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`sidebar-modern ${isOpen ? 'active' : ''} lg:!left-0`}>
        <div className="sidebar-menu p-4 sm:p-6">
          {/* Plan Status Card */}
          {userData?.plan && (
            <div className="mb-6 p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 transition-all duration-300 bg-gradient-to-br from-primary-50 to-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 capitalize truncate">
                    {userData.plan} Plan
                  </div>
                  <div className="text-xs text-gray-500">
                    {userData.plan === 'free' ? 'Free Forever' : 'Pro Features'}
                  </div>
                </div>
                {userData.plan === 'free' && (
                  <div className="text-xs bg-gradient-primary text-white px-2 py-1 rounded-full font-medium">
                    Upgrade
                  </div>
                )}
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
                    className="w-full text-xs bg-gradient-primary text-white font-medium py-2 px-3 rounded-lg hover:shadow-lg transition-all duration-200 mt-2"
                  >
                    Upgrade Now →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation Menu */}
          <div className="space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Title */}
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                  {section.title}
                </div>
                
                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = isItemActive(item.path);
                    const isEnabled = item.enabled !== false;
                    
                    if (!isEnabled) return null;
                    
                    return (
                      <div
                        key={item.path}
                        onClick={() => isEnabled && handleItemClick(item.path)}
                        className={`sidebar-item-modern group cursor-pointer ${
                          isActive ? 'active' : ''
                        } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="sidebar-item-icon flex-shrink-0">
                          {item.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{item.name}</span>
                            {item.beta && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                Beta
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 group-hover:text-current transition-colors">
                            {item.description}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.badge && (
                            <span className="status-badge status-info text-xs">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
              Quick Actions
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleItemClick('/invoices/create')}
                className="w-full btn btn-primary btn-modern text-sm py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Invoice
              </button>
              
              <button
                onClick={() => handleItemClick('/expenses')}
                className="w-full btn btn-outline btn-modern text-sm py-3 px-4 rounded-xl hover:scale-105 transition-all duration-200"
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
          <div className="mt-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-blue-900 text-sm">Need Help?</div>
                  <div className="text-xs text-blue-700">Get support & tutorials</div>
                </div>
              </div>
              <button className="text-xs text-blue-700 hover:text-blue-800 font-medium transition-colors">
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