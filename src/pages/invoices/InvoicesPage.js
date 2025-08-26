// src/pages/invoices/InvoicesPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { InvoiceService } from '../../services/invoiceService';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const InvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
      const pdf = await InvoiceService.generatePDF(invoice, user);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm-flex-row sm-items-center sm-justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage and track your invoices</p>
        </div>
        
        <Link to="/invoices/create" className="btn btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md-grid-cols-4 lg-grid-cols-5 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-success-600">{stats.paid}</div>
            <div className="text-sm text-gray-600">Paid</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-warning-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-error-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm-flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`btn btn-sm ${filter === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Draft
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`btn btn-sm ${filter === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Paid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-body p-0">
          {filteredInvoices.length === 0 ? (
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
                          <span className={`badge ${
                            invoice.status === 'paid' 
                              ? 'badge-success'
                              : invoice.status === 'pending'
                              ? isOverdue ? 'badge-danger' : 'badge-warning'
                              : 'badge-info'
                          }`}>
                            {isOverdue && invoice.status === 'pending' ? 'Overdue' : invoice.status}
                          </span>
                        </td>
                        <td>{format(invoice.createdAt?.toDate?.() || new Date(invoice.createdAt), 'MMM dd, yyyy')}</td>
                        <td className={isOverdue ? 'text-error-600 font-medium' : ''}>
                          {format(dueDate, 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {/* Status dropdown */}
                            <select
                              value={invoice.status}
                              onChange={(e) => handleStatusUpdate(invoice.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="draft">Draft</option>
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                            </select>
                            
                            {/* Download PDF */}
                            <button
                              onClick={() => handleDownloadPDF(invoice)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="Download PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;