// src/pages/vendors/VendorsPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const VendorsPage = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (user) {
      loadVendors();
    }
  }, [user]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'vendors'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const vendorData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorData);
    } catch (error) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (vendorData) => {
    try {
      const vendor = {
        ...vendorData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalPurchases: 0,
        totalOutstanding: 0,
        status: 'active'
      };

      await addDoc(collection(db, 'vendors'), vendor);
      toast.success('Vendor added successfully');
      setShowAddForm(false);
      loadVendors();
    } catch (error) {
      toast.error('Failed to add vendor');
    }
  };

  const handleEditVendor = async (vendorId, vendorData) => {
    try {
      await updateDoc(doc(db, 'vendors', vendorId), {
        ...vendorData,
        updatedAt: new Date()
      });
      toast.success('Vendor updated successfully');
      setSelectedVendor(null);
      loadVendors();
    } catch (error) {
      toast.error('Failed to update vendor');
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await deleteDoc(doc(db, 'vendors', vendorId));
        toast.success('Vendor deleted successfully');
        loadVendors();
      } catch (error) {
        toast.error('Failed to delete vendor');
      }
    }
  };

  const filteredVendors = vendors
    .filter(vendor => {
      if (filterStatus !== 'all' && vendor.status !== filterStatus) return false;
      if (searchTerm && !vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    inactive: vendors.filter(v => v.status === 'inactive').length,
    totalPurchases: vendors.reduce((sum, v) => sum + (v.totalPurchases || 0), 0),
    totalOutstanding: vendors.reduce((sum, v) => sum + (v.totalOutstanding || 0), 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Vendor Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your suppliers and vendor relationships</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary btn-modern flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Vendor
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card-modern p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-700">{stats.total}</div>
              <div className="text-sm text-orange-600 font-medium">Total Vendors</div>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">{stats.active}</div>
              <div className="text-sm text-green-600 font-medium">Active</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">
                ₹{stats.totalPurchases.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-blue-600 font-medium">Total Purchases</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 8l1.6 8H19M7 13v8a2 2 0 002 2h8a2 2 0 002-2v-8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v4.01" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">
                ₹{stats.totalOutstanding.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-yellow-600 font-medium">Outstanding</div>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-700">{stats.inactive}</div>
              <div className="text-sm text-red-600 font-medium">Inactive</div>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card-modern p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search vendors..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Display */}
      {filteredVendors.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No vendors match your filters' : 'No vendors added'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Add vendors to manage your supplier relationships and purchases'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
              Add First Vendor
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <VendorCard 
              key={vendor.id} 
              vendor={vendor} 
              onEdit={setSelectedVendor}
              onDelete={handleDeleteVendor}
            />
          ))}
        </div>
      ) : (
        <VendorTable 
          vendors={filteredVendors}
          onEdit={setSelectedVendor}
          onDelete={handleDeleteVendor}
        />
      )}

      {/* Add/Edit Vendor Modal */}
      {(showAddForm || selectedVendor) && (
        <VendorModal 
          vendor={selectedVendor}
          onSubmit={selectedVendor ? 
            (data) => handleEditVendor(selectedVendor.id, data) : 
            handleAddVendor
          }
          onCancel={() => {
            setShowAddForm(false);
            setSelectedVendor(null);
          }}
        />
      )}
    </div>
  );
};

// Vendor Card Component
const VendorCard = ({ vendor, onEdit, onDelete }) => {
  return (
    <div className="card-modern p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{vendor.email}</p>
          <p className="text-xs text-gray-500 mt-1">{vendor.category || 'General'}</p>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              vendor.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {vendor.status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Purchases</span>
          <span className="font-medium">₹{(vendor.totalPurchases || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Outstanding</span>
          <span className={`font-medium ${(vendor.totalOutstanding || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            ₹{(vendor.totalOutstanding || 0).toLocaleString('en-IN')}
          </span>
        </div>
        {vendor.paymentTerms && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Terms</span>
            <span className="text-sm">{vendor.paymentTerms}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(vendor)}
          className="btn btn-outline btn-sm flex-1 text-xs"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(vendor.id)}
          className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 text-xs"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Vendor Table Component
const VendorTable = ({ vendors, onEdit, onDelete }) => {
  return (
    <div className="card-modern overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Contact</th>
              <th>Category</th>
              <th>Status</th>
              <th>Total Purchases</th>
              <th>Outstanding</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(vendor => (
              <tr key={vendor.id}>
                <td>
                  <div className="font-medium text-gray-900">{vendor.name}</div>
                  <div className="text-sm text-gray-500">{vendor.company}</div>
                </td>
                <td>
                  <div className="text-sm text-gray-900">{vendor.email}</div>
                  <div className="text-sm text-gray-500">{vendor.phone}</div>
                </td>
                <td className="text-sm">{vendor.category || 'General'}</td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vendor.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {vendor.status}
                  </span>
                </td>
                <td className="font-medium">₹{(vendor.totalPurchases || 0).toLocaleString('en-IN')}</td>
                <td className={`font-medium ${(vendor.totalOutstanding || 0) > 0 ? 'text-red-600' : ''}`}>
                  ₹{(vendor.totalOutstanding || 0).toLocaleString('en-IN')}
                </td>
                <td>
                  {format(vendor.createdAt?.toDate ? vendor.createdAt.toDate() : new Date(vendor.createdAt), 'MMM dd, yyyy')}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(vendor)}
                      className="btn btn-outline btn-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(vendor.id)}
                      className="btn btn-outline btn-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Vendor Modal Component
const VendorModal = ({ vendor, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    company: vendor?.company || '',
    gstin: vendor?.gstin || '',
    address: vendor?.address || '',
    category: vendor?.category || '',
    paymentTerms: vendor?.paymentTerms || '',
    status: vendor?.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {vendor ? 'Edit Vendor' : 'Add Vendor'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Vendor Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                placeholder="Enter vendor name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                  placeholder="vendor@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="form-input"
                  placeholder="Company name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="form-select"
                >
                  <option value="">Select category</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Services">Services</option>
                  <option value="Technology">Technology</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
                  className="form-input"
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Terms</label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                  className="form-select"
                >
                  <option value="">Select terms</option>
                  <option value="Net 15">Net 15 days</option>
                  <option value="Net 30">Net 30 days</option>
                  <option value="Net 45">Net 45 days</option>
                  <option value="Net 60">Net 60 days</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="Advance">Advance Payment</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="form-textarea"
                placeholder="Vendor address"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="form-select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {vendor ? 'Update Vendor' : 'Add Vendor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorsPage;