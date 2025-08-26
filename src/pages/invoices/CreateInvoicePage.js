// src/pages/invoices/CreateInvoicePage.js - Fixed Item Management
import React, { useState, useEffect, useCallback } from 'react';
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
  const [showPreview, setShowPreview] = useState(false);

  const { register, control, watch, setValue, handleSubmit, formState: { errors }, trigger } = useForm({
    defaultValues: {
      clientName: '',
      clientGSTIN: '',
      clientAddress: '',
      items: [
        { description: '', quantity: 1, rate: 0, gstRate: 18 }
      ],
      notes: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    mode: 'onChange'
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");
  const watchedForm = watch();

  // Calculate totals with proper number conversion
  const calculateTotals = useCallback(() => {
    const items = watchedItems || [];
    let subtotal = 0;
    let totalGST = 0;

    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gstRate = parseFloat(item.gstRate) || 0;
      
      if (quantity > 0 && rate > 0) {
        const itemSubtotal = quantity * rate;
        const itemGST = (itemSubtotal * gstRate) / 100;
        
        subtotal += itemSubtotal;
        totalGST += itemGST;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalGST: Math.round(totalGST * 100) / 100,
      total: Math.round((subtotal + totalGST) * 100) / 100
    };
  }, [watchedItems]);

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
        }
      } catch (error) {
        console.log('AI suggestion error:', error);
      }
    }
  };

  // Add new item
  const addItem = () => {
    append({ 
      description: '', 
      quantity: 1, 
      rate: 0, 
      gstRate: 18 
    });
  };

  // Remove item
  const removeItem = (index) => {
    if (fields.length > 1) {
      remove(index);
      // Clean up AI suggestions for removed item
      setAiSuggestions(prev => {
        const newSuggestions = { ...prev };
        delete newSuggestions[index];
        return newSuggestions;
      });
    }
  };

  // Update item with validation
  const updateItem = (index, field, value) => {
    const currentItem = watchedItems[index];
    const updatedItem = {
      ...currentItem,
      [field]: value
    };
    
    // Validate numeric fields
    if (['quantity', 'rate', 'gstRate'].includes(field)) {
      const numValue = parseFloat(value) || 0;
      if (numValue < 0) {
        toast.error(`${field} cannot be negative`);
        return;
      }
      updatedItem[field] = numValue;
    }
    
    update(index, updatedItem);
    trigger(`items.${index}.${field}`);
  };

  // Generate PDF preview
  const handleGeneratePDF = async (invoiceData = null) => {
    try {
      setLoading(true);
      
      // Validate form first
      const isValid = await trigger();
      if (!isValid) {
        toast.error('Please fix form errors before generating PDF');
        return;
      }

      const dataToUse = invoiceData || {
        ...watchedForm,
        invoiceNumber: `PREVIEW-${Date.now()}`,
        items: watchedItems?.filter(item => 
          item.description && 
          parseFloat(item.quantity) > 0 && 
          parseFloat(item.rate) > 0
        ) || [],
        subtotal: totals.subtotal,
        totalGST: totals.totalGST,
        total: totals.total,
        createdAt: new Date(),
        status: 'draft'
      };

      if (dataToUse.items.length === 0) {
        toast.error('Please add at least one valid item to generate PDF');
        return;
      }

      const pdf = await InvoiceService.generatePDF(dataToUse, {
        businessName: userData?.businessName || 'Your Business',
        gstNumber: userData?.settings?.gstNumber,
        address: userData?.settings?.address
      });
      
      pdf.save(`${dataToUse.invoiceNumber || 'invoice-preview'}.pdf`);
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please check your form data.');
    } finally {
      setLoading(false);
    }
  };

  // Submit form
  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      // Filter and validate items
      const validItems = data.items?.filter(item => 
        item.description && 
        item.description.trim() &&
        parseFloat(item.quantity) > 0 && 
        parseFloat(item.rate) > 0
      );

      if (!validItems || validItems.length === 0) {
        toast.error('Please add at least one valid item with description, quantity, and rate');
        return;
      }

      // Check plan limits for free users
      if (userData?.plan === 'free' && (userData?.usage?.invoicesThisMonth || 0) >= 10) {
        toast.error('You have reached the free plan limit of 10 invoices per month. Please upgrade.');
        return;
      }

      // Prepare invoice data
      const invoiceData = {
        ...data,
        items: validItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          gstRate: parseFloat(item.gstRate) || 0
        })),
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

  // Mobile Item Card Component
  const MobileItemCard = ({ item, index }) => {
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const gstRate = parseFloat(item.gstRate) || 0;
    const itemSubtotal = quantity * rate;
    const itemGST = (itemSubtotal * gstRate) / 100;
    const itemTotal = itemSubtotal + itemGST;
    const suggestion = aiSuggestions[index];
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Item {index + 1}</h3>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Description */}
        <div className="form-group mb-4 relative">
          <label className="form-label">Description *</label>
          <input
            {...register(`items.${index}.description`, { 
              required: 'Description is required',
              minLength: { value: 2, message: 'Description too short' }
            })}
            className={`form-input ${errors.items?.[index]?.description ? 'border-red-500' : ''}`}
            placeholder="Enter item description"
            onChange={(e) => {
              handleDescriptionChange(index, e.target.value);
            }}
          />
          {errors.items?.[index]?.description && (
            <div className="form-error mt-1 text-red-600 text-sm">
              {errors.items[index].description.message}
            </div>
          )}
          
          {suggestion && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-lg"
                onClick={() => {
                  setValue(`items.${index}.description`, suggestion.description);
                  setValue(`items.${index}.gstRate`, suggestion.suggestedGSTRate);
                  setAiSuggestions(prev => ({ ...prev, [index]: null }));
                }}
              >
                <div className="font-medium">{suggestion.description}</div>
                <div className="text-gray-500 text-xs">HSN: {suggestion.code} • GST: {suggestion.suggestedGSTRate}%</div>
              </button>
            </div>
          )}
        </div>

        {/* Quantity and Rate */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input
              {...register(`items.${index}.quantity`, { 
                required: 'Quantity is required',
                min: { value: 0.01, message: 'Quantity must be greater than 0' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              min="0.01"
              className={`form-input ${errors.items?.[index]?.quantity ? 'border-red-500' : ''}`}
              placeholder="1"
            />
            {errors.items?.[index]?.quantity && (
              <div className="form-error mt-1 text-red-600 text-sm">
                {errors.items[index].quantity.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Rate (₹) *</label>
            <input
              {...register(`items.${index}.rate`, { 
                required: 'Rate is required',
                min: { value: 0, message: 'Rate cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              min="0"
              className={`form-input ${errors.items?.[index]?.rate ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
            {errors.items?.[index]?.rate && (
              <div className="form-error mt-1 text-red-600 text-sm">
                {errors.items[index].rate.message}
              </div>
            )}
          </div>
        </div>

        {/* GST Rate and Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">GST Rate</label>
            <select
              {...register(`items.${index}.gstRate`, { valueAsNumber: true })}
              className="form-select"
            >
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="form-label">Amount</label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-lg text-center">
              ₹{itemTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Item breakdown */}
        {itemSubtotal > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{itemSubtotal.toFixed(2)}</span>
            </div>
            {gstRate > 0 && (
              <div className="flex justify-between">
                <span>GST ({gstRate}%):</span>
                <span>₹{itemGST.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Invoice</h1>
            <p className="text-gray-600 mt-1">Generate a GST-compliant invoice for your client</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleGeneratePDF()}
              disabled={loading}
              className="btn btn-outline btn-modern"
            >
              {loading ? (
                <div className="spinner w-4 h-4 border-2 mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Preview PDF
            </button>
            
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="btn btn-secondary btn-modern sm:hidden"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Information */}
          <div className="card-modern">
            <div className="card-body">
              <h2 className="text-lg font-semibold mb-6 pb-4 border-b border-gray-200">
                Client Information
              </h2>
              
              <div className="space-y-6">
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    {...register('clientName', { 
                      required: 'Client name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    className={`form-input ${errors.clientName ? 'border-red-500' : ''}`}
                    placeholder="Enter client name"
                  />
                  {errors.clientName && (
                    <div className="form-error mt-2 text-red-600 text-sm">{errors.clientName.message}</div>
                  )}
                </div>

                <div className="form-group relative">
                  <label className="form-label">Client GSTIN</label>
                  <input
                    {...register('clientGSTIN')}
                    className="form-input"
                    placeholder="22AAAAA0000A1Z5 (optional)"
                    onBlur={(e) => validateGSTIN(e.target.value)}
                  />
                  {validatingGSTIN && (
                    <div className="absolute right-3 top-8">
                      <div className="spinner w-4 h-4 border-2"></div>
                    </div>
                  )}
                  <div className="form-help mt-1 text-xs text-gray-500">Leave blank if client is not GST registered</div>
                </div>

                <div className="form-group">
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

          {/* Items Section - Desktop */}
          <div className="card-modern hidden sm:block">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Invoice Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn btn-primary btn-sm btn-modern"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="table-modern w-full">
                  <thead>
                    <tr>
                      <th className="min-w-[200px]">Description *</th>
                      <th className="w-20">Qty</th>
                      <th className="w-24">Rate (₹)</th>
                      <th className="w-20">GST %</th>
                      <th className="w-24">Amount</th>
                      <th className="w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const item = watchedItems[index] || {};
                      const quantity = parseFloat(item.quantity) || 0;
                      const rate = parseFloat(item.rate) || 0;
                      const gstRate = parseFloat(item.gstRate) || 0;
                      const itemSubtotal = quantity * rate;
                      const itemGST = (itemSubtotal * gstRate) / 100;
                      const itemTotal = itemSubtotal + itemGST;
                      const suggestion = aiSuggestions[index];
                      
                      return (
                        <tr key={field.id}>
                          <td>
                            <div className="relative">
                              <input
                                {...register(`items.${index}.description`, { 
                                  required: 'Description is required' 
                                })}
                                className={`form-input w-full ${errors.items?.[index]?.description ? 'border-red-500' : ''}`}
                                placeholder="Item description"
                                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                              />
                              {suggestion && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-lg"
                                    onClick={() => {
                                      setValue(`items.${index}.description`, suggestion.description);
                                      setValue(`items.${index}.gstRate`, suggestion.suggestedGSTRate);
                                      setAiSuggestions(prev => ({ ...prev, [index]: null }));
                                    }}
                                  >
                                    <div className="font-medium">{suggestion.description}</div>
                                    <div className="text-gray-500 text-xs">HSN: {suggestion.code} • GST: {suggestion.suggestedGSTRate}%</div>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <input
                              {...register(`items.${index}.quantity`, { 
                                required: true, 
                                min: 0.01,
                                valueAsNumber: true
                              })}
                              type="number"
                              step="0.01"
                              min="0.01"
                              className={`form-input w-full ${errors.items?.[index]?.quantity ? 'border-red-500' : ''}`}
                              placeholder="1"
                            />
                          </td>
                          <td>
                            <input
                              {...register(`items.${index}.rate`, { 
                                required: true, 
                                min: 0,
                                valueAsNumber: true
                              })}
                              type="number"
                              step="0.01"
                              min="0"
                              className={`form-input w-full ${errors.items?.[index]?.rate ? 'border-red-500' : ''}`}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            <select
                              {...register(`items.${index}.gstRate`, { valueAsNumber: true })}
                              className="form-select w-full"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </select>
                          </td>
                          <td>
                            <div className="font-semibold text-right">
                              ₹{itemTotal.toFixed(2)}
                            </div>
                          </td>
                          <td>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="Remove item"
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

          {/* Items Section - Mobile */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Invoice Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-primary btn-sm btn-modern"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <MobileItemCard key={field.id} item={watchedItems[index] || {}} index={index} />
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="card-modern">
            <div className="card-body">
              <h2 className="text-lg font-semibold mb-4 pb-4 border-b border-gray-200">
                Invoice Summary
              </h2>
              
              <div className="space-y-3 max-w-sm ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total GST:</span>
                  <span className="font-medium">₹{totals.totalGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total Amount:</span>
                  <span className="text-primary-600">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="card-modern">
            <div className="card-body">
              <h2 className="text-lg font-semibold mb-6 pb-4 border-b border-gray-200">
                Additional Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    {...register('dueDate')}
                    type="date"
                    className="form-input"
                  />
                </div>

                <div className="sm:row-span-2">
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      {...register('notes')}
                      className="form-textarea"
                      rows="4"
                      placeholder="Any additional notes or terms..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section - Mobile */}
          {showPreview && (
            <div className="card-modern sm:hidden">
              <div className="card-body">
                <h2 className="text-lg font-semibold mb-4 pb-4 border-b border-gray-200">
                  Invoice Preview
                </h2>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold">Client:</div>
                    <div className="text-gray-600">{watchedForm.clientName || 'Client Name'}</div>
                  </div>
                  
                  <div>
                    <div className="font-semibold">Items:</div>
                    {watchedItems?.filter(item => item.description && parseFloat(item.quantity) > 0 && parseFloat(item.rate) > 0).map((item, index) => {
                      const quantity = parseFloat(item.quantity) || 0;
                      const rate = parseFloat(item.rate) || 0;
                      const itemTotal = quantity * rate;
                      return (
                        <div key={index} className="flex justify-between py-1 border-b border-gray-100">
                          <span>{item.description} (×{quantity})</span>
                          <span>₹{itemTotal.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary-600">₹{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 mt-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/invoices')}
                className="btn btn-secondary btn-modern"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading || totals.total <= 0}
                className="btn btn-primary btn-modern"
              >
                {loading ? (
                  <>
                    <div className="spinner w-4 h-4 border-2 mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Invoice ({totals.total > 0 ? `₹${totals.total.toFixed(2)}` : 'Enter items'})
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoicePage;