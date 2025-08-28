// src/pages/inventory/InventoryPage.js - Complete inventory management
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { InventoryService } from '../../services/inventoryService';
import LoadingSpinner, { CardSkeleton } from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const InventoryPage = () => {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [inventoryStats, setInventoryStats] = useState(null);

  useEffect(() => {
    if (user) {
      loadInventory();
      loadInventoryStats();
    }
  }, [user]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await InventoryService.getUserInventory(user.uid);
      setInventoryItems(items);
    } catch (error) {
      toast.error('Failed to load inventory');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryStats = async () => {
    try {
      const stats = await InventoryService.getInventoryValuation(user.uid);
      setInventoryStats(stats);
    } catch (error) {
      console.error('Failed to load inventory stats:', error);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      await InventoryService.addItem(user.uid, itemData);
      toast.success('Item added to inventory');
      setShowAddForm(false);
      loadInventory();
      loadInventoryStats();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleStockUpdate = async (itemId, quantity, type) => {
    try {
      await InventoryService.updateStock(itemId, quantity, type);
      toast.success('Stock updated successfully');
      loadInventory();
      loadInventoryStats();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  // Filter and sort items
  const filteredItems = inventoryItems
    .filter(item => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return (b.currentStock || 0) - (a.currentStock || 0);
        case 'value':
          return (b.stockValue || 0) - (a.stockValue || 0);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });

  const categories = [...new Set(inventoryItems.map(item => item.category).filter(Boolean))];
  const lowStockItems = inventoryItems.filter(item => (item.currentStock || 0) <= (item.reorderLevel || 10));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">Track stock levels, manage products, and monitor inventory value</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary btn-modern flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">
                {inventoryStats?.totalItems || 0}
              </div>
              <div className="text-sm text-blue-600 font-medium">Total Items</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">
                ₹{(inventoryStats?.totalStockValue || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-green-600 font-medium">Total Value</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">
                {lowStockItems.length}
              </div>
              <div className="text-sm text-yellow-600 font-medium">Low Stock</div>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-700">
                {categories.length}
              </div>
              <div className="text-sm text-purple-600 font-medium">Categories</div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800">Low Stock Alert</h3>
            <p className="text-yellow-700 text-sm mt-1">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's are' : ' is'} running low on stock. 
              Consider reordering: {lowStockItems.map(item => item.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="card-modern p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search items..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="form-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select 
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="value">Sort by Value</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>

          {/* View Mode Toggle */}
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

      {/* Inventory Display */}
      {filteredItems.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterCategory !== 'all' ? 'No items match your filters' : 'No inventory items'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Add your first item to start tracking inventory'
            }
          </p>
          {!searchTerm && filterCategory === 'all' && (
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
              Add First Item
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <InventoryCard key={item.id} item={item} onStockUpdate={handleStockUpdate} />
          ))}
        </div>
      ) : (
        // Table View
        <InventoryTable items={filteredItems} onStockUpdate={handleStockUpdate} />
      )}

      {/* Add Item Modal */}
      {showAddForm && (
        <AddItemModal 
          onSubmit={handleAddItem} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}
    </div>
  );
};

// Individual Inventory Card Component
const InventoryCard = ({ item, onStockUpdate }) => {
  const [showStockModal, setShowStockModal] = useState(false);
  
  const stockStatus = (item.currentStock || 0) <= (item.reorderLevel || 10) ? 'low' : 'normal';
  
  return (
    <>
      <div className={`card-modern p-6 hover:shadow-lg transition-all duration-200 ${stockStatus === 'low' ? 'border-yellow-300 bg-yellow-50' : ''}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{item.category || 'Uncategorized'}</p>
          </div>
          {stockStatus === 'low' && (
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Stock</span>
            <span className={`font-semibold ${stockStatus === 'low' ? 'text-yellow-700' : 'text-gray-900'}`}>
              {item.currentStock || 0} {item.unit || 'units'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Unit Cost</span>
            <span className="font-semibold">₹{(item.unitCost || 0).toLocaleString('en-IN')}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Value</span>
            <span className="font-semibold text-green-600">
              ₹{((item.currentStock || 0) * (item.unitCost || 0)).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowStockModal(true)}
            className="w-full btn btn-outline btn-sm text-xs"
          >
            Update Stock
          </button>
        </div>
      </div>

      {showStockModal && (
        <StockUpdateModal
          item={item}
          onSubmit={(quantity, type) => {
            onStockUpdate(item.id, quantity, type);
            setShowStockModal(false);
          }}
          onCancel={() => setShowStockModal(false)}
        />
      )}
    </>
  );
};

// Inventory Table Component
const InventoryTable = ({ items, onStockUpdate }) => {
  return (
    <div className="card-modern overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <InventoryTableRow key={item.id} item={item} onStockUpdate={onStockUpdate} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Table Row Component
const InventoryTableRow = ({ item, onStockUpdate }) => {
  const [showStockModal, setShowStockModal] = useState(false);
  const stockStatus = (item.currentStock || 0) <= (item.reorderLevel || 10) ? 'low' : 'normal';
  
  return (
    <>
      <tr className={stockStatus === 'low' ? 'bg-yellow-50' : ''}>
        <td>
          <div className="font-medium text-gray-900">{item.name}</div>
          <div className="text-sm text-gray-500">{item.sku || item.barcode}</div>
        </td>
        <td>{item.category || 'Uncategorized'}</td>
        <td>
          <span className={stockStatus === 'low' ? 'text-yellow-700 font-medium' : ''}>
            {item.currentStock || 0} {item.unit || 'units'}
          </span>
        </td>
        <td>₹{(item.unitCost || 0).toLocaleString('en-IN')}</td>
        <td className="text-green-600 font-medium">
          ₹{((item.currentStock || 0) * (item.unitCost || 0)).toLocaleString('en-IN')}
        </td>
        <td>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            stockStatus === 'low' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
          </span>
        </td>
        <td>
          <button
            onClick={() => setShowStockModal(true)}
            className="btn btn-outline btn-xs"
          >
            Update Stock
          </button>
        </td>
      </tr>

      {showStockModal && (
        <StockUpdateModal
          item={item}
          onSubmit={(quantity, type) => {
            onStockUpdate(item.id, quantity, type);
            setShowStockModal(false);
          }}
          onCancel={() => setShowStockModal(false)}
        />
      )}
    </>
  );
};

// Add Item Modal Component
const AddItemModal = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    unitCost: '',
    initialStock: '',
    reorderLevel: '10',
    unit: 'pieces',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      unitCost: parseFloat(formData.unitCost) || 0,
      initialStock: parseInt(formData.initialStock) || 0,
      reorderLevel: parseInt(formData.reorderLevel) || 10
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add Inventory Item</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Electronics"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU/Barcode</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="form-input"
                  placeholder="Item identifier"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Unit Cost (₹) *</label>
                <input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({...formData, unitCost: e.target.value})}
                  className="form-input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Stock *</label>
                <input
                  type="number"
                  value={formData.initialStock}
                  onChange={(e) => setFormData({...formData, initialStock: e.target.value})}
                  className="form-input"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="form-select"
                >
                  <option value="pieces">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="liters">Liters</option>
                  <option value="meters">Meters</option>
                  <option value="boxes">Boxes</option>
                  <option value="packs">Packs</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})}
                  className="form-input"
                  placeholder="10"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="form-textarea"
                placeholder="Optional description"
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Stock Update Modal Component
const StockUpdateModal = ({ item, onSubmit, onCancel }) => {
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState('adjustment');
  const [reference, setReference] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = type === 'sale' || type === 'return' 
      ? -Math.abs(parseInt(quantity)) 
      : Math.abs(parseInt(quantity));
    
    onSubmit(qty, type, reference || null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Update Stock</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-600">Current Stock: {item.currentStock || 0} {item.unit || 'units'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="form-select"
                required
              >
                <option value="adjustment">Stock Adjustment</option>
                <option value="purchase">Purchase/Restock</option>
                <option value="sale">Sale/Usage</option>
                <option value="return">Return/Refund</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="form-input"
                placeholder="Enter quantity"
                min="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {type === 'sale' || type === 'return' ? 'Will decrease stock' : 'Will increase stock'}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Reference (Optional)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="form-input"
                placeholder="e.g., Invoice #, PO #"
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;