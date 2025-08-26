// src/pages/expenses/ExpensesPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { aiService } from '../../services/aiService';
import { GSTService } from '../../services/gstService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ExpensesPage = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      gstRate: 18
    }
  });

  // Load expenses
  useEffect(() => {
    if (!user) return;

    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesList = [];
      snapshot.forEach((doc) => {
        expensesList.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(expensesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Receipt scanning functionality
  const handleReceiptScan = async (file) => {
    setScanLoading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Simulate OCR by using the filename and some dummy text
          const mockReceiptText = `
            Receipt from ${file.name.replace('.jpg', '').replace('.png', '')}
            Date: ${new Date().toLocaleDateString()}
            Amount: ₹250.00
            GST: ₹45.00
            Total: ₹295.00
            Category: Office Supplies
          `;

          const result = await aiService.processReceipt(mockReceiptText);
          setScanResult(result);
          
          // Pre-fill form with extracted data
          setValue('vendor', result.vendor_name || '');
          setValue('amount', result.total_amount || 0);
          setValue('gstRate', result.gst_details?.total_gst ? 
            Math.round((result.gst_details.total_gst / (result.total_amount - result.gst_details.total_gst)) * 100) : 18
          );
          setValue('category', result.category || 'Other');
          setValue('description', result.items?.[0]?.description || '');
          
          toast.success('Receipt processed successfully!');
        } catch (error) {
          toast.error('Failed to process receipt. Please enter details manually.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to scan receipt');
    } finally {
      setScanLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const gstCalculation = GSTService.calculateGSTFromInclusive(data.amount, data.gstRate);
      
      const expense = {
        ...data,
        userId: user.uid,
        ...gstCalculation,
        createdAt: new Date(),
        month: new Date(data.date).getMonth() + 1,
        year: new Date(data.date).getFullYear()
      };

      await addDoc(collection(db, 'expenses'), expense);
      toast.success('Expense added successfully!');
      reset();
      setShowAddModal(false);
      setScanResult(null);
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);
  const totalGST = expenses.reduce((sum, expense) => sum + (expense.gstAmount || 0), 0);

  const ExpenseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Add Expense</h2>
            <button
              onClick={() => {
                setShowAddModal(false);
                setScanResult(null);
                reset();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scan Receipt Button */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <label className="btn btn-outline w-full cursor-pointer">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {scanLoading ? 'Processing...' : 'Scan Receipt'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleReceiptScan(e.target.files[0]);
                  }
                }}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">Upload receipt image for AI processing</p>
          </div>

          {scanResult && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">✓ Receipt processed successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Vendor/Company *</label>
              <input
                {...register('vendor', { required: 'Vendor is required' })}
                className={`form-input ${errors.vendor ? 'error' : ''}`}
                placeholder="Enter vendor name"
              />
              {errors.vendor && <div className="form-error">{errors.vendor.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <input
                {...register('description', { required: 'Description is required' })}
                className={`form-input ${errors.description ? 'error' : ''}`}
                placeholder="What was this expense for?"
              />
              {errors.description && <div className="form-error">{errors.description.message}</div>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className={`form-input ${errors.amount ? 'error' : ''}`}
                  placeholder="0.00"
                />
                {errors.amount && <div className="form-error">{errors.amount.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">GST Rate</label>
                <select {...register('gstRate')} className="form-select">
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select {...register('category')} className="form-select">
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Travel">Travel</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className={`form-input ${errors.date ? 'error' : ''}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  reset();
                  setScanResult(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm-flex-row sm-items-center sm-justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track and manage your business expenses</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md-grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString('en-IN')}</div>
            <div className="text-sm text-gray-600">Total Expenses</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-primary-600">₹{totalGST.toLocaleString('en-IN')}</div>
            <div className="text-sm text-gray-600">Total GST Paid</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-success-600">{expenses.length}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="card-body p-0">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your business expenses by adding your first record.</p>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                Add Your First Expense
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vendor</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>GST</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                      <td className="font-medium">{expense.vendor}</td>
                      <td>{expense.description}</td>
                      <td>
                        <span className="badge badge-info text-xs">
                          {expense.category}
                        </span>
                      </td>
                      <td>₹{expense.baseAmount?.toFixed(2)}</td>
                      <td>
                        <span className="text-sm">
                          ₹{expense.gstAmount?.toFixed(2)}
                          <span className="text-gray-400 ml-1">({expense.gstRate}%)</span>
                        </span>
                      </td>
                      <td className="font-medium">₹{expense.totalAmount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <ExpenseModal />}
    </div>
  );
};

export default ExpensesPage;
