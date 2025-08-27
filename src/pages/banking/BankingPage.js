// src/pages/banking/BankingPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { BankingService } from '../../services/bankingService';
import toast from 'react-hot-toast';

const BankingPage = () => {
  const { user, userData } = useAuth();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reconciliationData, setReconciliationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBankForm, setShowAddBankForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadBankAccounts();
      loadTransactions();
    }
  }, [user]);

  const loadBankAccounts = async () => {
    try {
      const accounts = await BankingService.getUserBankAccounts(user.uid);
      setBankAccounts(accounts);
    } catch (error) {
      toast.error('Failed to load bank accounts');
    }
  };

  const loadTransactions = async () => {
    try {
      // Load mock transactions for demo
      const mockTransactions = BankingService.generateMockTransactions();
      setTransactions(mockTransactions);
      
      // Auto-reconcile
      const reconciled = await BankingService.reconcileTransactions(user.uid, mockTransactions.slice(0, 5));
      setReconciliationData(reconciled);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load transactions');
      setLoading(false);
    }
  };

  const addBankAccount = async (bankData) => {
    try {
      await BankingService.linkBankAccount(user.uid, bankData);
      toast.success('Bank account added successfully');
      setShowAddBankForm(false);
      loadBankAccounts();
    } catch (error) {
      toast.error('Failed to add bank account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading banking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banking & Payments</h1>
          <p className="text-gray-600">Manage bank accounts and reconcile transactions</p>
        </div>
        <button
          onClick={() => setShowAddBankForm(true)}
          className="btn btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Bank Account
        </button>
      </div>

      {/* Bank Accounts */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Connected Bank Accounts</h2>
        </div>
        <div className="card-body">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bank accounts connected</h3>
              <p className="text-gray-500 mb-4">Connect your bank account to enable automatic reconciliation</p>
              <button onClick={() => setShowAddBankForm(true)} className="btn btn-primary">
                Connect Your First Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map(account => (
                <div key={account.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.bankName}</h3>
                      <p className="text-gray-600 text-sm">****{account.accountNumber?.slice(-4)}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                        account.isVerified 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {account.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ₹{(account.balance || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-500">Current Balance</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{account.accountType || 'Savings'}</span>
                    <span>Last sync: Today</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <p className="text-gray-600 text-sm">Latest bank transactions from your connected accounts</p>
        </div>
        <div className="card-body p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{new Date(transaction.date).toLocaleDateString('en-IN')}</td>
                      <td>{transaction.description}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'credit' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === 'credit' ? '↗' : '↙'} {transaction.type}
                        </span>
                      </td>
                      <td className={`font-medium ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                      </td>
                      <td>₹{transaction.balance.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'matched' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Reconciliation */}
      {reconciliationData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Transaction Reconciliation</h2>
            <p className="text-gray-600 text-sm">Match bank transactions with your invoices and expenses</p>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {reconciliationData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        item.confidence > 0.8 ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{item.bankTransaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(item.bankTransaction.date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mx-4">
                    <p className="font-semibold text-lg">₹{item.bankTransaction.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">
                      Matched: {item.matched.type} #{item.matched.invoiceNumber || item.matched.id}
                    </p>
                    <div className="text-xs text-gray-400">
                      Confidence: {Math.round(item.confidence * 100)}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-success btn-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accept
                    </button>
                    <button className="btn btn-outline btn-sm">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {showAddBankForm && (
        <BankAccountForm 
          onSubmit={addBankAccount} 
          onCancel={() => setShowAddBankForm(false)} 
        />
      )}
    </div>
  );
};

// Bank Account Form Component
const BankAccountForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'savings',
    accountHolderName: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Add Bank Account</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Bank Name *</label>
              <select 
                value={formData.bankName}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                className="form-select"
                required
              >
                <option value="">Select Bank</option>
                <option value="State Bank of India">State Bank of India</option>
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                <option value="Punjab National Bank">Punjab National Bank</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Number *</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                className="form-input"
                placeholder="Enter account number"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">IFSC Code *</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})}
                className="form-input"
                placeholder="e.g., SBIN0001234"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                className="form-select"
              >
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
                <option value="cc">Credit Card</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Holder Name *</label>
              <input
                type="text"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                className="form-input"
                placeholder="As per bank records"
                required
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BankingPage;