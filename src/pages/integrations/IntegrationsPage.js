// src/pages/integrations/IntegrationsPage.js
import React from 'react';

const IntegrationsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600">Connect with third-party apps and services</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">API Integrations Coming Soon</h3>
            <p className="text-gray-500 mb-4">Connect with Shopify, Amazon, payment gateways, and more</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Feature in Development
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;