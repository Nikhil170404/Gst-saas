// src/pages/dashboard/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { InvoiceService } from '../../services/invoiceService';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    pendingPayments: 0,
    gstCollected: 0,
    monthlyRevenue: 0,
    overdueInvoices: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Real-time dashboard data
    const invoicesRef = collection(db, 'invoices');
    const q = query(
      invoicesRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoices = [];
      let totalRevenue = 0;
      let totalGST = 0;
      let pendingCount = 0;
      let monthlyRevenue = 0;
      let overdueCount = 0;

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      snapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() };
        invoices.push(invoice);

        const amount = invoice.total || 0;
        const gst = invoice.totalGST || 0;
        const createdAt = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt);
        const dueDate = invoice.dueDate?.toDate?.() || new Date(invoice.dueDate);

        totalRevenue += amount;
        totalGST += gst;

        if (invoice.status === 'pending') {
          pendingCount++;
        }

        if (createdAt >= monthStart && createdAt <= monthEnd) {
          monthlyRevenue += amount;
        }

        if (invoice.status !== 'paid' && dueDate < now) {
          overdueCount++;
        }
      });

      setStats({
        totalRevenue,
        totalInvoices: invoices.length,
        pendingPayments: pendingCount,
        gstCollected: totalGST,
        monthlyRevenue,
        overdueInvoices: overdueCount
      });

      setRecentInvoices(invoices.slice(0, 5));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const StatCard = ({ title, value, icon, color, change, trend }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
            {change && (
              <div className={`flex items-center text-sm ${
                trend === 'up' ? 'text-success-500' : trend === 'down' ? 'text-error-500' : 'text-gray-500'
              }`}>
                {trend === 'up' && (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon, onClick, color = 'btn-primary' }) => (
    <button onClick={onClick} className={`card hover:shadow-md transition-shadow text-left w-full`}>
      <div className="card-body">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary-50 rounded-lg flex-shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          color="bg-success-500"
        />

        <StatCard
          title="This Month"
          value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          color="bg-primary-500"
        />

        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="bg-blue-500"
        />

        <StatCard
          title="GST Collected"
          value={`₹${stats.gstCollected.toLocaleString('en-IN')}`}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="bg-purple-500"
        />
      </div>

      {/* Alerts */}
      {(stats.pendingPayments > 0 || stats.overdueInvoices > 0) && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                Action Required
              </h3>
              <div className="mt-2 text-sm text-warning-700">
                <ul className="list-disc pl-5 space-y-1">
                  {stats.pendingPayments > 0 && (
                    <li>You have {stats.pendingPayments} pending payment{stats.pendingPayments > 1 ? 's' : ''}</li>
                  )}
                  {stats.overdueInvoices > 0 && (
                    <li>{stats.overdueInvoices} invoice{stats.overdueInvoices > 1 ? 's are' : ' is'} overdue</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg-grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg-col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              title="Create Invoice"
              description="Generate a new GST invoice"
              icon={
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
              onClick={() => window.location.href = '/invoices/create'}
            />

            <QuickAction
              title="Scan Receipt"
              description="Add expense from receipt photo"
              icon={
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              onClick={() => window.location.href = '/expenses?scan=true'}
            />

            <QuickAction
              title="View Reports"
              description="Check your business analytics"
              icon={
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              onClick={() => window.location.href = '/reports'}
            />
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="lg-col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <a href="/invoices" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all →
            </a>
          </div>

          <div className="card">
            <div className="card-body p-0">
              {recentInvoices.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first invoice.</p>
                  <a href="/invoices/create" className="btn btn-primary">
                    Create Invoice
                  </a>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((invoice) => (
                        <tr key={invoice.id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/invoices/${invoice.id}`}>
                          <td className="font-medium">{invoice.invoiceNumber}</td>
                          <td>{invoice.clientName}</td>
                          <td className="font-medium">₹{invoice.total?.toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`badge ${
                              invoice.status === 'paid' 
                                ? 'badge-success'
                                : invoice.status === 'pending'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>{format(invoice.createdAt?.toDate?.() || new Date(invoice.createdAt), 'MMM dd, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
