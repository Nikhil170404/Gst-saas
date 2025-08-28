// src/pages/purchase-orders/PurchaseOrdersPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PurchaseOrdersPage = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    if (user) {
      loadPurchaseOrders();
      loadVendors();
    }
  }, [user]);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'purchase_orders'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const poData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPurchaseOrders(poData);
    } catch (error) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const q = query(collection(db, 'vendors'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const vendorData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorData);
    } catch (error) {
      console.error('Failed to load vendors');
    }
  };

  const handleCreatePO = async (poData) => {
    try {
      const po = {
        ...poData,
        userId: user.uid,
        poNumber: await generatePONumber(),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'purchase_orders'), po);
      toast.success('Purchase order created successfully');
      setShowCreateForm(false);
      loadPurchaseOrders();
    } catch (error) {
      toast.error('Failed to create purchase order');
    }
  };

  const generatePONumber = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = purchaseOrders.length + 1;
    return `PO-${year}${month}-${String(count).padStart(3, '0')}`;
  };

  const handleStatusUpdate = async (poId, newStatus) => {
    try {
      await updateDoc(doc(db, 'purchase_orders', poId), {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'delivered' && { deliveredAt: new Date() })
      });
      toast.success('Status updated successfully');
      loadPurchaseOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredPOs = purchaseOrders
    .filter(po => {
      if (filterStatus !== 'all' && po.status !== filterStatus) return false;
      if (searchTerm && !po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !po.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = {
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(po => po.status === 'draft').length,
    sent: purchaseOrders.filter(po => po.status === 'sent').length,
    delivered: purchaseOrders.filter(po => po.status === 'delivered').length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0)
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
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Purchase Orders
          </h1>
          <p className="text-gray-600 mt-1">Create and manage purchase orders for inventory</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary btn-modern flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create PO
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card-modern p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-700">{stats.total}</div>
              <div className="text-sm text-purple-600 font-medium">Total POs</div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{stats.draft}</div>
              <div className="text-sm text-blue-600 font-medium">Draft</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">{stats.sent}</div>
              <div className="text-sm text-yellow-600 font-medium">Sent</div>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">{stats.delivered}</div>
              <div className="text-sm text-green-600 font-medium">Delivered</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-700">
                ₹{stats.totalValue.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-indigo-600 font-medium">Total Value</div>
            </div>
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
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
                placeholder="Search purchase orders..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Display */}
      {filteredPOs.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No purchase orders match your filters' : 'No purchase orders yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first purchase order to manage inventory procurement'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
              Create First PO
            </button>
          )}
        </div>
      ) : (
        <PurchaseOrdersTable 
          purchaseOrders={filteredPOs}
          onStatusUpdate={handleStatusUpdate}
          onView={setSelectedPO}
        />
      )}

      {/* Create PO Modal */}
      {showCreateForm && (
        <CreatePOModal 
          vendors={vendors}
          onSubmit={handleCreatePO} 
          onCancel={() => setShowCreateForm(false)} 
        />
      )}

      {/* View PO Modal */}
      {selectedPO && (
        <ViewPOModal 
          po={selectedPO}
          onStatusUpdate={handleStatusUpdate}
          onClose={() => setSelectedPO(null)}
        />
      )}
    </div>
  );
};

// Purchase Orders Table Component
const PurchaseOrdersTable = ({ purchaseOrders, onStatusUpdate, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card-modern overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Vendor</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map(po => (
              <tr key={po.id}>
                <td>
                  <div className="font-medium text-gray-900">{po.poNumber}</div>
                  <div className="text-sm text-gray-500">
                    Expected: {po.expectedDate ? format(new Date(po.expectedDate), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="font-medium text-gray-900">{po.vendorName}</div>
                  <div className="text-sm text-gray-500">{po.vendorEmail}</div>
                </td>
                <td>{po.items?.length || 0} items</td>
                <td className="font-medium">₹{(po.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                    {po.status}
                  </span>
                </td>
                <td>
                  {format(po.createdAt?.toDate ? po.createdAt.toDate() : new Date(po.createdAt), 'MMM dd, yyyy')}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(po)}
                      className="btn btn-outline btn-xs"
                    >
                      View
                    </button>
                    {po.status === 'sent' && (
                      <button
                        onClick={() => onStatusUpdate(po.id, 'delivered')}
                        className="btn btn-outline btn-xs text-green-600 hover:bg-green-50"
                      >
                        Mark Delivered
                      </button>
                    )}
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

// Create PO Modal
const CreatePOModal = ({ vendors, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    vendorId: '',
    vendorName: '',
    vendorEmail: '',
    expectedDate: '',
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]
  });

  const handleVendorSelect = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        vendorId: vendorId,
        vendorName: vendor.name,
        vendorEmail: vendor.email || ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, totalAmount });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Purchase Order</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vendor Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Vendor *</label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => handleVendorSelect(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Delivery Date</label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="form-label">Items</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn btn-outline btn-sm"
                >
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 items-end p-4 border border-gray-200 rounded-lg">
                    <div className="col-span-2">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="form-input"
                        placeholder="Item description"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="form-input"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Unit Price (₹)</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="form-input"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        ₹{item.amount.toFixed(2)}
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <div className="text-lg font-semibold">
                  Total: ₹{totalAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="form-textarea"
                placeholder="Additional notes or terms"
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!formData.vendorId}>
                Create Purchase Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View PO Modal
const ViewPOModal = ({ po, onStatusUpdate, onClose }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Purchase Order {po.poNumber}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(po.status)}`}>
                {po.status}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* PO Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Vendor Information</h3>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{po.vendorName}</div>
                  <div>{po.vendorEmail}</div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Order Details</h3>
                <div className="text-sm text-gray-600">
                  <div>Created: {format(po.createdAt?.toDate ? po.createdAt.toDate() : new Date(po.createdAt), 'MMM dd, yyyy')}</div>
                  {po.expectedDate && (
                    <div>Expected: {format(new Date(po.expectedDate), 'MMM dd, yyyy')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {po.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">₹{item.unitPrice?.toFixed(2)}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">₹{item.amount?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                <div className="text-lg font-semibold">
                  Total: ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {po.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                <div className="text-sm text-gray-600 whitespace-pre-wrap">{po.notes}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <div className="flex gap-3">
              {po.status === 'draft' && (
                <button
                  onClick={() => onStatusUpdate(po.id, 'sent')}
                  className="btn btn-outline text-blue-600 hover:bg-blue-50"
                >
                  Send to Vendor
                </button>
              )}
              {po.status === 'sent' && (
                <button
                  onClick={() => onStatusUpdate(po.id, 'delivered')}
                  className="btn btn-success"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;