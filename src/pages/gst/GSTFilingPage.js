// src/pages/gst/GSTFilingPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { format, addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const GSTFilingPage = () => {
  const { user, userData } = useAuth();
  const [gstReturns, setGstReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substr(0, 7));
  const [showGSTR1Form, setShowGSTR1Form] = useState(false);
  const [showGSTR3BForm, setShowGSTR3BForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadGSTData();
    }
  }, [user, selectedMonth]);

  const loadGSTData = async () => {
    try {
      setLoading(true);
      
      // Load GST returns
      const returnsQuery = query(collection(db, 'gst_returns'), where('userId', '==', user.uid));
      const returnsSnapshot = await getDocs(returnsQuery);
      setGstReturns(returnsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load invoices for selected month
      const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
      const monthEnd = endOfMonth(new Date(selectedMonth + '-01'));
      
      const invoicesQuery = query(
        collection(db, 'invoices'), 
        where('userId', '==', user.uid)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const allInvoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter invoices by selected month
      const filteredInvoices = allInvoices.filter(invoice => {
        const invoiceDate = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd;
      });
      setInvoices(filteredInvoices);

      // Load expenses for selected month
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const allExpenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter expenses by selected month
      const filteredExpenses = allExpenses.filter(expense => {
        const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      setExpenses(filteredExpenses);
      
    } catch (error) {
      toast.error('Failed to load GST data');
    } finally {
      setLoading(false);
    }
  };

  const calculateGSTSummary = () => {
    // Output GST (from sales/invoices)
    const outputGST = invoices.reduce((sum, invoice) => {
      return sum + (invoice.totalGST || 0);
    }, 0);

    // Input GST (from purchases/expenses)
    const inputGST = expenses.reduce((sum, expense) => {
      return sum + (expense.gstAmount || 0);
    }, 0);

    // Net GST liability
    const netGST = outputGST - inputGST;

    return {
      outputGST,
      inputGST,
      netGST: Math.max(0, netGST), // Cannot be negative for payment
      refund: netGST < 0 ? Math.abs(netGST) : 0
    };
  };

  const generateGSTR1Data = () => {
    const gstr1Data = {
      b2b: [], // B2B supplies
      b2c: [], // B2C supplies
      exports: [],
      summary: {
        totalTaxableValue: 0,
        totalGST: 0
      }
    };

    invoices.forEach(invoice => {
      const taxableValue = (invoice.total || 0) - (invoice.totalGST || 0);
      const gstAmount = invoice.totalGST || 0;

      if (invoice.clientGSTIN) {
        // B2B transaction
        gstr1Data.b2b.push({
          gstin: invoice.clientGSTIN,
          name: invoice.clientName,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: format(invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt), 'dd/MM/yyyy'),
          taxableValue,
          gstRate: invoice.items?.[0]?.gstRate || 18,
          cgst: gstAmount <= 18 ? gstAmount / 2 : 0,
          sgst: gstAmount <= 18 ? gstAmount / 2 : 0,
          igst: gstAmount > 18 ? gstAmount : 0
        });
      } else {
        // B2C transaction
        gstr1Data.b2c.push({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: format(invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt), 'dd/MM/yyyy'),
          taxableValue,
          gstRate: invoice.items?.[0]?.gstRate || 18,
          gstAmount
        });
      }

      gstr1Data.summary.totalTaxableValue += taxableValue;
      gstr1Data.summary.totalGST += gstAmount;
    });

    return gstr1Data;
  };

  const handleFileGSTR1 = async (filingData) => {
    try {
      const gstr1Data = generateGSTR1Data();
      
      const gstReturn = {
        userId: user.uid,
        returnType: 'GSTR-1',
        month: selectedMonth,
        data: gstr1Data,
        status: 'filed',
        filedAt: new Date(),
        filingMethod: 'online',
        ...filingData
      };

      await addDoc(collection(db, 'gst_returns'), gstReturn);
      toast.success('GSTR-1 filed successfully');
      setShowGSTR1Form(false);
      loadGSTData();
    } catch (error) {
      toast.error('Failed to file GSTR-1');
    }
  };

  const handleFileGSTR3B = async (filingData) => {
    try {
      const gstSummary = calculateGSTSummary();
      
      const gstReturn = {
        userId: user.uid,
        returnType: 'GSTR-3B',
        month: selectedMonth,
        data: gstSummary,
        status: 'filed',
        filedAt: new Date(),
        filingMethod: 'online',
        taxPayable: gstSummary.netGST,
        ...filingData
      };

      await addDoc(collection(db, 'gst_returns'), gstReturn);
      toast.success('GSTR-3B filed successfully');
      setShowGSTR3BForm(false);
      loadGSTData();
    } catch (error) {
      toast.error('Failed to file GSTR-3B');
    }
  };

  const getFilingStatus = (returnType) => {
    return gstReturns.find(ret => 
      ret.returnType === returnType && ret.month === selectedMonth
    );
  };

  const getDueDates = () => {
    const selectedDate = new Date(selectedMonth + '-01');
    const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    
    return {
      gstr1: addDays(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 11), 0), // 11th of next month
      gstr3b: addDays(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20), 0)  // 20th of next month
    };
  };

  const gstSummary = calculateGSTSummary();
  const gstr1Data = generateGSTR1Data();
  const dueDates = getDueDates();
  const gstr1Status = getFilingStatus('GSTR-1');
  const gstr3bStatus = getFilingStatus('GSTR-3B');

  const stats = {
    totalSales: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    totalPurchases: expenses.reduce((sum, exp) => sum + (exp.totalAmount || exp.amount || 0), 0),
    outputGST: gstSummary.outputGST,
    inputGST: gstSummary.inputGST,
    netGST: gstSummary.netGST,
    totalReturns: gstReturns.length
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
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            GST Filing & Compliance
          </h1>
          <p className="text-gray-600 mt-1">File GST returns and manage compliance deadlines</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            max={format(subMonths(new Date(), 1), 'yyyy-MM')}
            className="form-input"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">
                ₹{stats.totalSales.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-blue-600 font-medium">Total Sales</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-700">
                ₹{stats.totalPurchases.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-purple-600 font-medium">Total Purchases</div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">
                ₹{stats.outputGST.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-green-600 font-medium">Output GST</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-700">
                ₹{stats.inputGST.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-orange-600 font-medium">Input GST</div>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-700">
                ₹{stats.netGST.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-red-600 font-medium">Net GST</div>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-700">{stats.totalReturns}</div>
              <div className="text-sm text-indigo-600 font-medium">Returns Filed</div>
            </div>
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* GST Returns Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-modern p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">GSTR-1</h3>
              <p className="text-sm text-gray-600">Monthly return of outward supplies</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Due Date</div>
              <div className="font-medium text-gray-900">
                {format(dueDates.gstr1, 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div className="mb-4">
            {gstr1Status ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Filed
                </span>
                <span className="text-sm text-gray-600">
                  on {format(gstr1Status.filedAt.toDate ? gstr1Status.filedAt.toDate() : new Date(gstr1Status.filedAt), 'MMM dd, yyyy')}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Total Invoices:</span>
              <span>{invoices.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxable Value:</span>
              <span>₹{gstr1Data.summary.totalTaxableValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Total GST:</span>
              <span>₹{gstr1Data.summary.totalGST.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {!gstr1Status && (
            <button
              onClick={() => setShowGSTR1Form(true)}
              className="w-full btn btn-primary"
              disabled={invoices.length === 0}
            >
              Prepare GSTR-1
            </button>
          )}
        </div>

        <div className="card-modern p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">GSTR-3B</h3>
              <p className="text-sm text-gray-600">Monthly self-declaration return</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Due Date</div>
              <div className="font-medium text-gray-900">
                {format(dueDates.gstr3b, 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div className="mb-4">
            {gstr3bStatus ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Filed
                </span>
                <span className="text-sm text-gray-600">
                  on {format(gstr3bStatus.filedAt.toDate ? gstr3bStatus.filedAt.toDate() : new Date(gstr3bStatus.filedAt), 'MMM dd, yyyy')}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Output GST:</span>
              <span>₹{gstSummary.outputGST.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Input GST:</span>
              <span>₹{gstSummary.inputGST.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Net GST Payable:</span>
              <span>₹{gstSummary.netGST.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {!gstr3bStatus && (
            <button
              onClick={() => setShowGSTR3BForm(true)}
              className="w-full btn btn-primary"
            >
              Prepare GSTR-3B
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card-modern">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 pt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sales ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Purchases ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'returns'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Filed Returns
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <GSTOverview 
              gstSummary={gstSummary}
              gstr1Data={gstr1Data}
              dueDates={dueDates}
              gstr1Status={gstr1Status}
              gstr3bStatus={gstr3bStatus}
            />
          )}
          
          {activeTab === 'invoices' && (
            <InvoicesTab invoices={invoices} />
          )}
          
          {activeTab === 'expenses' && (
            <ExpensesTab expenses={expenses} />
          )}
          
          {activeTab === 'returns' && (
            <FiledReturnsTab returns={gstReturns.filter(ret => ret.month === selectedMonth)} />
          )}
        </div>
      </div>

      {/* GSTR-1 Filing Modal */}
      {showGSTR1Form && (
        <GSTR1FilingModal
          gstr1Data={gstr1Data}
          month={selectedMonth}
          onSubmit={handleFileGSTR1}
          onCancel={() => setShowGSTR1Form(false)}
        />
      )}

      {/* GSTR-3B Filing Modal */}
      {showGSTR3BForm && (
        <GSTR3BFilingModal
          gstSummary={gstSummary}
          month={selectedMonth}
          onSubmit={handleFileGSTR3B}
          onCancel={() => setShowGSTR3BForm(false)}
        />
      )}
    </div>
  );
};

// GST Overview Component
const GSTOverview = ({ gstSummary, gstr1Data, dueDates, gstr1Status, gstr3bStatus }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Summary (GSTR-1)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>B2B Sales:</span>
              <span className="font-medium">{gstr1Data.b2b.length} transactions</span>
            </div>
            <div className="flex justify-between">
              <span>B2C Sales:</span>
              <span className="font-medium">{gstr1Data.b2c.length} transactions</span>
            </div>
            <div className="flex justify-between">
              <span>Total Taxable Value:</span>
              <span className="font-medium">₹{gstr1Data.summary.totalTaxableValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Total GST Collected:</span>
              <span className="font-medium">₹{gstr1Data.summary.totalGST.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Summary (GSTR-3B)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Output GST:</span>
              <span className="font-medium">₹{gstSummary.outputGST.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Input GST:</span>
              <span className="font-medium">₹{gstSummary.inputGST.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">Net GST Liability:</span>
              <span className="font-semibold text-red-600">₹{gstSummary.netGST.toLocaleString('en-IN')}</span>
            </div>
            {gstSummary.refund > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Refund Available:</span>
                <span className="font-medium">₹{gstSummary.refund.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">GSTR-1 Status</h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700">Due: {format(dueDates.gstr1, 'MMM dd')}</div>
              <div className="text-xs text-blue-600">
                {gstr1Status ? 'Filed' : `${Math.max(0, Math.ceil((dueDates.gstr1 - new Date()) / (1000 * 60 * 60 * 24)))} days left`}
              </div>
            </div>
            <div className={`text-2xl ${gstr1Status ? 'text-green-600' : 'text-yellow-600'}`}>
              {gstr1Status ? '✅' : '⏳'}
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">GSTR-3B Status</h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-orange-700">Due: {format(dueDates.gstr3b, 'MMM dd')}</div>
              <div className="text-xs text-orange-600">
                {gstr3bStatus ? 'Filed' : `${Math.max(0, Math.ceil((dueDates.gstr3b - new Date()) / (1000 * 60 * 60 * 24)))} days left`}
              </div>
            </div>
            <div className={`text-2xl ${gstr3bStatus ? 'text-green-600' : 'text-yellow-600'}`}>
              {gstr3bStatus ? '✅' : '⏳'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Invoices Tab Component
const InvoicesTab = ({ invoices }) => {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No invoices found for this month</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map(invoice => (
            <tr key={invoice.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {invoice.invoiceNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {invoice.clientName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.clientGSTIN || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt), 'dd/MM/yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{((invoice.total || 0) - (invoice.totalGST || 0)).toLocaleString('en-IN')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{(invoice.totalGST || 0).toLocaleString('en-IN')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ₹{(invoice.total || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Expenses Tab Component
const ExpensesTab = ({ expenses }) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No expenses found for this month</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map(expense => (
            <tr key={expense.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(expense.date?.toDate ? expense.date.toDate() : new Date(expense.date), 'dd/MM/yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {expense.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {expense.vendorName || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {expense.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{(expense.amount || 0).toLocaleString('en-IN')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{(expense.gstAmount || 0).toLocaleString('en-IN')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ₹{(expense.totalAmount || expense.amount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Filed Returns Tab Component
const FiledReturnsTab = ({ returns }) => {
  if (returns.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No returns filed for this month</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {returns.map(ret => (
        <div key={ret.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">{ret.returnType}</h4>
              <p className="text-sm text-gray-600">
                Filed on {format(ret.filedAt?.toDate ? ret.filedAt.toDate() : new Date(ret.filedAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Filed
            </span>
          </div>
          
          {ret.returnType === 'GSTR-3B' && ret.taxPayable && (
            <div className="mt-3 text-sm">
              <div className="flex justify-between">
                <span>Tax Payable:</span>
                <span className="font-medium">₹{ret.taxPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// GSTR-1 Filing Modal
const GSTR1FilingModal = ({ gstr1Data, month, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    acknowledgmentNumber: '',
    filingDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              File GSTR-1 for {format(new Date(month + '-01'), 'MMMM yyyy')}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* GSTR-1 Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Return Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>B2B Transactions:</span>
                <span>{gstr1Data.b2b.length}</span>
              </div>
              <div className="flex justify-between">
                <span>B2C Transactions:</span>
                <span>{gstr1Data.b2c.length}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Taxable Value:</span>
                <span>₹{gstr1Data.summary.totalTaxableValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total GST:</span>
                <span>₹{gstr1Data.summary.totalGST.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Filing Date</label>
              <input
                type="date"
                value={formData.filingDate}
                onChange={(e) => setFormData({...formData, filingDate: e.target.value})}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Acknowledgment Number (Optional)</label>
              <input
                type="text"
                value={formData.acknowledgmentNumber}
                onChange={(e) => setFormData({...formData, acknowledgmentNumber: e.target.value})}
                className="form-input"
                placeholder="Enter acknowledgment number from GST portal"
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                File GSTR-1
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// GSTR-3B Filing Modal
const GSTR3BFilingModal = ({ gstSummary, month, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    acknowledgmentNumber: '',
    filingDate: new Date().toISOString().split('T')[0],
    paymentDate: '',
    paymentReference: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              File GSTR-3B for {format(new Date(month + '-01'), 'MMMM yyyy')}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* GSTR-3B Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Liability Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Output GST:</span>
                <span>₹{gstSummary.outputGST.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Input GST Credit:</span>
                <span>₹{gstSummary.inputGST.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>Net Tax Payable:</span>
                <span className="text-red-600">₹{gstSummary.netGST.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Filing Date</label>
              <input
                type="date"
                value={formData.filingDate}
                onChange={(e) => setFormData({...formData, filingDate: e.target.value})}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Acknowledgment Number (Optional)</label>
              <input
                type="text"
                value={formData.acknowledgmentNumber}
                onChange={(e) => setFormData({...formData, acknowledgmentNumber: e.target.value})}
                className="form-input"
                placeholder="Enter acknowledgment number from GST portal"
              />
            </div>

            {gstSummary.netGST > 0 && (
              <>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Reference</label>
                  <input
                    type="text"
                    value={formData.paymentReference}
                    onChange={(e) => setFormData({...formData, paymentReference: e.target.value})}
                    className="form-input"
                    placeholder="Payment transaction reference"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                File GSTR-3B
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GSTFilingPage;