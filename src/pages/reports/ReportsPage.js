// src/pages/reports/ReportsPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    revenue: [],
    expenses: [],
    gstSummary: [],
    categoryBreakdown: [],
    monthlyTrends: []
  });
  const [dateRange, setDateRange] = useState('6months');

  useEffect(() => {
    if (!user) return;
    fetchReportData();
  }, [user, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthsBack = dateRange === '3months' ? 3 : dateRange === '6months' ? 6 : 12;
      const startDate = subMonths(now, monthsBack);

      // Fetch invoices
      const invoicesRef = collection(db, 'invoices');
      const invoicesQuery = query(
        invoicesRef,
        where('userId', '==', user.uid),
        where('createdAt', '>=', startDate)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch expenses
      const expensesRef = collection(db, 'expenses');
      const expensesQuery = query(
        expensesRef,
        where('userId', '==', user.uid),
        where('createdAt', '>=', startDate)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Process data
      const monthlyData = eachMonthOfInterval({
        start: startDate,
        end: now
      }).map(month => {
        const monthInvoices = invoices.filter(inv => {
          const invDate = inv.createdAt?.toDate?.() || new Date(inv.createdAt);
          return invDate >= startOfMonth(month) && invDate <= endOfMonth(month);
        });

        const monthExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.date || exp.createdAt?.toDate?.() || exp.createdAt);
          return expDate >= startOfMonth(month) && expDate <= endOfMonth(month);
        });

        const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const expenseTotal = monthExpenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
        const gstCollected = monthInvoices.reduce((sum, inv) => sum + (inv.totalGST || 0), 0);
        const gstPaid = monthExpenses.reduce((sum, exp) => sum + (exp.gstAmount || 0), 0);

        return {
          month: format(month, 'MMM yyyy'),
          revenue,
          expenses: expenseTotal,
          profit: revenue - expenseTotal,
          gstCollected,
          gstPaid,
          netGST: gstCollected - gstPaid
        };
      });

      // Category breakdown for expenses
      const categoryData = expenses.reduce((acc, expense) => {
        const category = expense.category || 'Other';
        if (!acc[category]) {
          acc[category] = { name: category, value: 0, count: 0 };
        }
        acc[category].value += expense.totalAmount || 0;
        acc[category].count += 1;
        return acc;
      }, {});

      // GST Summary
      const totalGSTCollected = invoices.reduce((sum, inv) => sum + (inv.totalGST || 0), 0);
      const totalGSTPaid = expenses.reduce((sum, exp) => sum + (exp.gstAmount || 0), 0);

      setReportData({
        revenue: monthlyData.map(d => ({ month: d.month, value: d.revenue })),
        expenses: monthlyData.map(d => ({ month: d.month, value: d.expenses })),
        gstSummary: [
          { name: 'GST Collected', value: totalGSTCollected, color: '#10b981' },
          { name: 'GST Paid', value: totalGSTPaid, color: '#ef4444' }
        ],
        categoryBreakdown: Object.values(categoryData),
        monthlyTrends: monthlyData
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Generating reports...</p>
      </div>
    );
  }

  const totalRevenue = reportData.monthlyTrends.reduce((sum, d) => sum + d.revenue, 0);
  const totalExpenses = reportData.monthlyTrends.reduce((sum, d) => sum + d.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm-flex-row sm-items-center sm-justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Insights into your business performance</p>
        </div>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="form-select w-auto"
        >
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md-grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-success-600">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-error-600">{formatCurrency(totalExpenses)}</div>
            <div className="text-sm text-gray-600">Total Expenses</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {formatCurrency(totalProfit)}
            </div>
            <div className="text-sm text-gray-600">Net Profit</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(reportData.gstSummary[0]?.value - reportData.gstSummary[1]?.value || 0)}
            </div>
            <div className="text-sm text-gray-600">Net GST Liability</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg-grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Revenue vs Expenses</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GST Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">GST Overview</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.gstSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.gstSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {reportData.gstSummary.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Expense Categories</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                >
                  {reportData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {reportData.categoryBreakdown.map((item, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Profit Trend</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
              <p className="text-gray-600">Download your financial reports</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm">
                Export PDF
              </button>
              <button className="btn btn-outline btn-sm">
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;