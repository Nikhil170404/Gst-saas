// src/pages/gst/GSTFilingPage.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const GSTFilingPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST Filing</h1>
          <p className="text-gray-600">File GST returns and manage compliance</p>
        </div>
        <button className="btn btn-primary">
          Prepare GSTR-1
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">Current</div>
            <div className="text-sm text-gray-600">GST Status</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">Mar 2025</div>
            <div className="text-sm text-gray-600">Last Filed</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-yellow-600">Apr 20</div>
            <div className="text-sm text-gray-600">Next Due</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Direct GST Filing Coming Soon</h3>
            <p className="text-gray-500 mb-4">File GSTR-1, GSTR-3B directly from the platform</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Integration in Progress
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTFilingPage;