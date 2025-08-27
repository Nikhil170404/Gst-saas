// src/pages/purchase-orders/PurchaseOrdersPage.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const PurchaseOrdersPage = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Create and manage purchase orders for inventory</p>
        </div>
        <button className="btn btn-primary">
          Create PO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Total POs</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-purple-600">₹0</div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders yet</h3>
            <p className="text-gray-500 mb-4">Create your first purchase order to manage inventory procurement</p>
            <button className="btn btn-primary">Create First PO</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PurchaseOrdersPage as default };