// src/pages/invoices/CreateInvoicePage.js
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { InvoiceService } from '../../services/invoiceService';
import { GSTService } from '../../services/gstService';
import { aiService } from '../../services/aiService';
import toast from 'react-hot-toast';

const CreateInvoicePage = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [validatingGSTIN, setValidatingGSTIN] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({});

  const { register, control, watch, setValue, getValues, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      clientName: '',
      clientGSTIN: '',
      clientAddress: '',
      items: [
        { description: '', quantity: 1, rate: 0, gstRate: 18 }
      ],
      notes: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");
  const clientGSTIN = watch("clientGSTIN");

  // Calculate totals
  const calculateTotals = () => {
    const items = watchedItems || [];
    let subtotal = 0;
    let totalGST = 0;

    items.forEach(item => {
      if (item.quantity && item.rate) {
        const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
        const itemGST = (itemSubtotal * parseFloat(item.gstRate || 0)) / 100;
        
        subtotal += itemSubtotal;
        totalGST += itemGST;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalGST: Math.round(totalGST * 100) / 100,
      total: Math.round((subtotal + totalGST) * 100) / 100
    };
  };

  const totals = calculateTotals();

  // Validate GSTIN
  const validateGSTIN = async (gstin) => {
    if (!gstin) return;
    
    setValidatingGSTIN(true);
    try {
      const validation = GSTService.validateGSTIN(gstin);
      if (!validation.valid) {
        toast.error(validation.error);
      } else {
        toast.success('Valid GSTIN');
      }
    } catch (error) {
      toast.error('GSTIN validation failed');
    } finally {
      setValidatingGSTIN(false);
    }
  };

  // AI-powered item description suggestions
  const handleDescriptionChange = async (index, description) => {
    if (description.length > 3) {
      try {
        const suggestions = GSTService.getHSNSuggestions(description);
        if (suggestions.length > 0) {
          setAiSuggestions(prev => ({
            ...prev,
            [index]: suggestions[0]
          }));
          
          // Auto-set GST rate if confident match
          if (suggestions[0].description.toLowerCase().includes(description.toLowerCase())) {
            setValue(`items.${index}.gstRate`, suggestions[0].suggestedGSTRate);
          }
        }

        // Get AI categorization
        const category = await aiService.categorizeExpense(description, 0, '');
        if (category.suggested_gst_rate) {
          setValue(`items.${index}.gstRate`, category.suggested_gst_rate);
        }
      } catch (error) {
        console.log('AI suggestion error:', error);
      }
    }
  };

  // Add new item
  const addItem = () => {
    append({ description: '', quantity: 1, rate: 0, gstRate: 18 });
  };

  // Remove item
  const removeItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Submit form
  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      // Validate items
      if (!data.items || data.items.length === 0 || !data.items[0].description) {
        toast.error('Please add at least one item');
        return;
      }

      // Check plan limits for free users
      if (userData?.plan === 'free' && (userData?.usage?.invoicesThisMonth || 0) >= 10) {
        toast.error('You have reached the free plan limit of 10 invoices per month. Please upgrade.');
        return;
      }

      const invoiceData = {
        ...data,
        items: data.items.filter(item => item.description && item.quantity && item.rate),
        subtotal: totals.subtotal,
        totalGST: totals.totalGST,
        total: totals.total,
        status: 'pending'
      };

      const result = await InvoiceService.createInvoice(user.uid, invoiceData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Invoice created successfully!');
        navigate('/invoices');
      }
    } catch (error) {
      toast.error('Failed to create invoice');
      console.error('Invoice creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600">Generate a GST-compliant invoice for your client</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Client Information</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  {...register('clientName', { required: 'Client name is required' })}
                  className={`form-input ${errors.clientName ? 'error' : ''}`}
                  placeholder="Enter client name"
                />
                {errors.clientName && <div className="form-error">{errors.clientName.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Client GSTIN</label>
                <div className="relative">
                  <input
                    {...register('clientGSTIN')}
                    className="form-input"
                    placeholder="22AAAAA0000A1Z5 (optional)"
                    onBlur={(e) => validateGSTIN(e.target.value)}
                  />
                  {validatingGSTIN && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="spinner w-4 h-4 border-2"></div>
                    </div>
                  )}
                </div>
                <div className="form-help">Leave blank if client is not GST registered</div>
              </div>

              <div className="form-group md-col-span-2">
                <label className="form-label">Client Address</label>
                <textarea
                  {...register('clientAddress')}
                  className="form-textarea"
                  rows="3"
                  placeholder="Enter client billing address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invoice Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-primary btn-sm"
              >
                + Add Item
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description *</th>
                    <th>Qty</th>
                    <th>Rate (₹)</th>
                    <th>GST %</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const item = watchedItems[index] || {};
                    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                    const suggestion = aiSuggestions[index];
                    
                    return (
                      <tr key={field.id}>
                        <td>
                          <div className="relative">
                            <input
                              {...register(`items.${index}.description`, { required: true })}
                              className="form-input"
                              placeholder="Item description"
                              onChange={(e) => handleDescriptionChange(index, e.target.value)}
                            />
                            {suggestion && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                  onClick={() => {
                                    setValue(`items.${index}.description`, suggestion.description);
                                    setValue(`items.${index}.gstRate`, suggestion.suggestedGSTRate);
                                    setAiSuggestions(prev => ({ ...prev, [index]: null }));
                                  }}
                                >
                                  <div className="font-medium">{suggestion.description}</div>
                                  <div className="text-gray-500">HSN: {suggestion.code} • GST: {suggestion.suggestedGSTRate}%</div>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            {...register(`items.${index}.quantity`, { required: true, min: 0.01 })}
                            type="number"
                            step="0.01"
                            className="form-input"
                            placeholder="1"
                          />
                        </td>
                        <td>
                          <input
                            {...register(`items.${index}.rate`, { required: true, min: 0 })}
                            type="number"
                            step="0.01"
                            className="form-input"
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <select
                            {...register(`items.${index}.gstRate`)}
                            className="form-select"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>
                        <td>
                          <div className="font-medium">
                            ₹{itemTotal.toFixed(2)}
                          </div>
                        </td>
                        <td>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-error-500 hover:text-error-700 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Totals Section */}
        <div className="card">
          <div className="card-body">
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total GST:</span>
                  <span>₹{totals.totalGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Additional Information</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  {...register('dueDate')}
                  type="date"
                  className="form-input"
                />
              </div>

              <div className="form-group md-col-span-2">
                <label className="form-label">Notes</label>
                <textarea
                  {...register('notes')}
                  className="form-textarea"
                  rows="3"
                  placeholder="Any additional notes or terms..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner w-4 h-4 border-2 mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;