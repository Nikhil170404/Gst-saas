// src/pages/invoices/InvoicesPage.js - Enhanced with Working PDF Downloads
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { InvoiceService } from '../../services/invoiceService';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const InvoicesPage = () => {
  const { user, userData } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [showFilters, setShowFilters] = useState(false);
  const [pdfLoading, setPdfLoading] = useState({});

  useEffect(() => {
    if (!user) return;

    const invoicesRef = collection(db, 'invoices');
    const q = query(
      invoicesRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesList = [];
      snapshot.forEach((doc) => {
        invoicesList.push({ id: doc.id, ...doc.data() });
      });
      setInvoices(invoicesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesFilter = filter === 'all' || invoice.status === filter;
    const matchesSearch = invoice.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      await InvoiceService.updateInvoice(invoiceId, { status: newStatus });
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      setPdfLoading(prev => ({ ...prev, [invoice.id]: true }));
      
      const pdf = await InvoiceService.generatePDF(invoice, {
        businessName: userData?.businessName || 'Your Business',
        gstNumber: userData?.settings?.gstNumber,
        address: userData?.settings?.address
      });
      
      pdf.save(`${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoading(prev => ({ ...prev, [invoice.id]: false }));
    }
  };

  const handleBulkDownloadPDF = async () => {
    if (filteredInvoices.length === 0) {
      toast.error('No invoices to download');
      return;
    }

    if (filteredInvoices.length > 10) {
      toast.error('Maximum 10 invoices can be downloaded at once');
      return;
    }

    try {
      setPdfLoading(prev => ({ ...prev, bulk: true }));
      
      for (const invoice of filteredInvoices.slice(0, 10)) {
        const pdf = await InvoiceService.generatePDF(invoice, {
          businessName: userData?.businessName || 'Your Business',
          gstNumber: userData?.settings?.gstNumber,
          address: userData?.settings?.address
        });
        
        pdf.save(`${invoice.invoiceNumber}.pdf`);
        
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success(`Downloaded ${Math.min(filteredInvoices.length, 10)} invoices`);
    } catch (error) {
      console.error('Bulk PDF generation error:', error);
      toast.error('Failed to download some invoices');
    } finally {
      setPdfLoading(prev => ({ ...prev, bulk: false }));
    }
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    draft: invoices.filter(i => i.status === 'draft').length,
    overdue: invoices.filter(i => 
      i.status !== 'paid' && 
      new Date(i.dueDate?.toDate?.() || i.dueDate) < new Date()
    ).length
  };

  const getStatusColor = (status, isOverdue = false) => {
    if (isOverdue) return 'bg-red-100 text-red-700 border-red-200';
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status, isOverdue = false) => {
    if (isOverdue) return '⚠️';
    switch (status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'draft': return '📝';
      default: return '📄';
    }
  };

  // Mobile Card Component
  const InvoiceCard = ({ invoice }) => {
    const dueDate = invoice.dueDate?.toDate?.() || new Date(invoice.dueDate);
    const isOverdue = invoice.status !== 'paid' && dueDate < new Date();
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/invoices/${invoice.id}`}
              className="font-semibold text-gray-900 hover:text-primary-600 transition-colors block truncate"
            >
              {invoice.invoiceNumber}
            </Link>
            <p className="text-sm text-gray-600 truncate">{invoice.clientName}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status, isOverdue)}`}>
              <span>{getStatusIcon(invoice.status, isOverdue)}</span>
              {isOverdue ? 'Overdue' : invoice.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-lg">₹{invoice.total?.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Due Date</p>
            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
              {format(dueDate, 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Created {format(invoice.createdAt?.toDate?.() || new Date(invoice.createdAt), 'MMM dd, yyyy')}
          </p>
          
          <div className="flex items-center gap-2">
            {/* PDF Download Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDownloadPDF(invoice);
              }}
              disabled={pdfLoading[invoice.id]}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Download PDF"
            >
              {pdfLoading[invoice.id] ? (
                <div className="spinner w-4 h-4 border-2"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </button>
            
            {/* Status Update Dropdown */}
            <select
              value={invoice.status}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStatusUpdate(invoice.id, e.target.value);
              }}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:border-primary-500 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
            
            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Toggle dropdown menu - you can implement this
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track your invoices</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bulk PDF Download */}
          {filteredInvoices.length > 0 && (
            <button
              onClick={handleBulkDownloadPDF}
              disabled={pdfLoading.bulk}
              className="btn btn-outline btn-sm btn-modern"
              title="Download all visible invoices as PDF (max 10)"
            >
              {pdfLoading.bulk ? (
                <div className="spinner w-4 h-4 border-2 mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="hidden sm:inline">Download All PDF</span>
              <span className="sm:hidden">PDF All</span>
            </button>
          )}

          {/* View Toggle - Desktop Only */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'card' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          <Link to="/invoices/create" className="btn btn-primary whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Create Invoice</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-xs sm:text-sm text-gray-600">Paid</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs sm:text-sm text-gray-600">Pending</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-xs sm:text-sm text-gray-600">Draft</div>
          </div>
        </div>
        
        <div className="card col-span-2 sm:col-span-1">
          <div className="card-body text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs sm:text-sm text-gray-600">Overdue</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 w-full"
              />
            </div>
            
            {/* Mobile Filter Toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg text-left"
              >
                <span className="font-medium text-gray-700">
                  Filter: {filter === 'all' ? 'All Invoices' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Filter Buttons */}
            <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: stats.total },
                  { key: 'draft', label: 'Draft', count: stats.draft },
                  { key: 'pending', label: 'Pending', count: stats.pending },
                  { key: 'paid', label: 'Paid', count: stats.paid }
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilter(key);
                      setShowFilters(false);
                    }}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === key 
                        ? 'bg-primary-100 text-primary-700 border-primary-200' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    } border`}
                  >
                    {label}
                    {count > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredInvoices.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filter !== 'all' ? 'No invoices found' : 'No invoices yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first invoice to get started.'
                }
              </p>
              {(!searchTerm && filter === 'all') && (
                <Link to="/invoices/create" className="btn btn-primary">
                  Create Your First Invoice
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View (Default on mobile) */}
          <div className="sm:hidden space-y-3">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>

          {/* Desktop View (Card or Table based on toggle) */}
          <div className="hidden sm:block">
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInvoices.map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} />
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="card-body p-0">
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Client</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Due Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((invoice) => {
                          const dueDate = invoice.dueDate?.toDate?.() || new Date(invoice.dueDate);
                          const isOverdue = invoice.status !== 'paid' && dueDate < new Date();
                          
                          return (
                            <tr key={invoice.id}>
                              <td className="font-medium">
                                <Link 
                                  to={`/invoices/${invoice.id}`}
                                  className="text-primary-600 hover:text-primary-700"
                                >
                                  {invoice.invoiceNumber}
                                </Link>
                              </td>
                              <td>{invoice.clientName}</td>
                              <td className="font-medium">₹{invoice.total?.toLocaleString('en-IN')}</td>
                              <td>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status, isOverdue)}`}>
                                  <span>{getStatusIcon(invoice.status, isOverdue)}</span>
                                  {isOverdue ? 'Overdue' : invoice.status}
                                </span>
                              </td>
                              <td>{format(invoice.createdAt?.toDate?.() || new Date(invoice.createdAt), 'MMM dd, yyyy')}</td>
                              <td className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                {format(dueDate, 'MMM dd, yyyy')}
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleDownloadPDF(invoice)}
                                    disabled={pdfLoading[invoice.id]}
                                    className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded"
                                    title="Download PDF"
                                  >
                                    {pdfLoading[invoice.id] ? (
                                      <div className="spinner w-4 h-4 border-2"></div>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    )}
                                  </button>
                                  
                                  <select
                                    value={invoice.status}
                                    onChange={(e) => handleStatusUpdate(invoice.id, e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                  >
                                    <option value="draft">Draft</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InvoicesPage;