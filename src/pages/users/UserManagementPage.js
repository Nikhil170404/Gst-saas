// src/pages/users/UserManagementPage.js
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const UserManagementPage = () => {
  const { userData } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage team access and permissions</p>
        </div>
        <button className="btn btn-primary">
          Invite User
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Multi-User Access</h3>
            <p className="text-gray-500 mb-4">
              {userData?.plan === 'free' 
                ? 'Upgrade to Professional plan to add team members'
                : 'Invite team members and manage their access levels'
              }
            </p>
            {userData?.plan === 'free' ? (
              <button className="btn btn-primary">Upgrade Plan</button>
            ) : (
              <button className="btn btn-primary">Invite First Team Member</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;