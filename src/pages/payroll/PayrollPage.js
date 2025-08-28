// src/pages/payroll/PayrollPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const PayrollPage = () => {
  const { user, userData } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substr(0, 7));

  useEffect(() => {
    if (user) {
      loadEmployees();
      loadPayrollRecords();
    }
  }, [user]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'employees'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const employeeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(employeeData);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollRecords = async () => {
    try {
      const q = query(collection(db, 'payroll_records'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const payrollData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayrollRecords(payrollData);
    } catch (error) {
      console.error('Failed to load payroll records');
    }
  };

  const handleAddEmployee = async (employeeData) => {
    try {
      const employee = {
        ...employeeData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      await addDoc(collection(db, 'employees'), employee);
      toast.success('Employee added successfully');
      setShowAddEmployeeForm(false);
      loadEmployees();
    } catch (error) {
      toast.error('Failed to add employee');
    }
  };

  const processPayroll = async (employeeId, payrollData) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      const basicSalary = parseFloat(payrollData.basicSalary || employee.basicSalary);
      
      // Calculate deductions
      const pf = basicSalary * 0.12; // 12% PF
      const esi = basicSalary * 0.0175; // 1.75% ESI
      const tds = calculateTDS(basicSalary);
      const totalDeductions = pf + esi + tds + (parseFloat(payrollData.otherDeductions) || 0);
      
      // Calculate allowances
      const hra = basicSalary * 0.4; // 40% HRA
      const da = basicSalary * 0.1; // 10% DA
      const totalAllowances = hra + da + (parseFloat(payrollData.otherAllowances) || 0);
      
      const grossSalary = basicSalary + totalAllowances;
      const netSalary = grossSalary - totalDeductions;

      const payroll = {
        employeeId,
        employeeName: employee.name,
        userId: user.uid,
        month: selectedMonth,
        basicSalary,
        hra,
        da,
        otherAllowances: parseFloat(payrollData.otherAllowances) || 0,
        grossSalary,
        pf,
        esi,
        tds,
        otherDeductions: parseFloat(payrollData.otherDeductions) || 0,
        totalDeductions,
        netSalary,
        workingDays: parseInt(payrollData.workingDays) || 30,
        leaveDays: parseInt(payrollData.leaveDays) || 0,
        processedAt: new Date(),
        status: 'processed'
      };

      await addDoc(collection(db, 'payroll_records'), payroll);
      toast.success('Payroll processed successfully');
      setShowPayrollModal(false);
      loadPayrollRecords();
    } catch (error) {
      toast.error('Failed to process payroll');
    }
  };

  const calculateTDS = (salary) => {
    // Simplified TDS calculation for demo
    if (salary > 25000) return salary * 0.1; // 10% TDS
    return 0;
  };

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === 'active').length,
    monthlyPayroll: payrollRecords
      .filter(p => p.month === selectedMonth)
      .reduce((sum, p) => sum + (p.netSalary || 0), 0),
    totalDeductions: payrollRecords
      .filter(p => p.month === selectedMonth)
      .reduce((sum, p) => sum + (p.totalDeductions || 0), 0)
  };

  const currentMonthRecords = payrollRecords.filter(p => p.month === selectedMonth);

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
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Payroll Management
          </h1>
          <p className="text-gray-600 mt-1">Manage employees, salaries, and payroll processing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddEmployeeForm(true)}
            className="btn btn-outline btn-modern flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Add Employee
          </button>
          <button
            onClick={() => setShowPayrollModal(true)}
            className="btn btn-primary btn-modern flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            disabled={employees.length === 0}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Process Payroll
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{stats.totalEmployees}</div>
              <div className="text-sm text-blue-600 font-medium">Total Employees</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">{stats.activeEmployees}</div>
              <div className="text-sm text-green-600 font-medium">Active Employees</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-700">
                ₹{stats.monthlyPayroll.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-purple-600 font-medium">Monthly Payroll</div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">
                ₹{stats.totalDeductions.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-yellow-600 font-medium">Total Deductions</div>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m16 0l-4-4m4 4l-4 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selector and Tabs */}
      <div className="card-modern p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'employees' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'payroll' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payroll Records
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'employees' ? (
        <EmployeesList employees={employees} onEdit={setSelectedEmployee} />
      ) : (
        <PayrollRecords records={currentMonthRecords} />
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeForm && (
        <AddEmployeeModal 
          onSubmit={handleAddEmployee} 
          onCancel={() => setShowAddEmployeeForm(false)} 
        />
      )}

      {/* Process Payroll Modal */}
      {showPayrollModal && (
        <ProcessPayrollModal 
          employees={employees}
          selectedMonth={selectedMonth}
          onSubmit={processPayroll}
          onCancel={() => setShowPayrollModal(false)} 
        />
      )}
    </div>
  );
};

// Employees List Component
const EmployeesList = ({ employees, onEdit }) => {
  if (employees.length === 0) {
    return (
      <div className="card-modern p-12 text-center">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No employees added</h3>
        <p className="text-gray-500 mb-6">Add employees to start managing payroll</p>
        <button className="btn btn-primary">Add First Employee</button>
      </div>
    );
  }

  return (
    <div className="card-modern overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Position</th>
              <th>Department</th>
              <th>Basic Salary</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                  </div>
                </td>
                <td>{employee.position}</td>
                <td>{employee.department}</td>
                <td className="font-medium">₹{(employee.basicSalary || 0).toLocaleString('en-IN')}</td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status}
                  </span>
                </td>
                <td>
                  {format(employee.createdAt?.toDate ? employee.createdAt.toDate() : new Date(employee.createdAt), 'MMM dd, yyyy')}
                </td>
                <td>
                  <button
                    onClick={() => onEdit(employee)}
                    className="btn btn-outline btn-xs"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Payroll Records Component
const PayrollRecords = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="card-modern p-12 text-center">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll processed</h3>
        <p className="text-gray-500 mb-6">Process payroll for employees for this month</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {records.map(record => (
        <div key={record.id} className="card-modern p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{record.employeeName}</h3>
              <p className="text-sm text-gray-600">Month: {format(new Date(record.month + '-01'), 'MMMM yyyy')}</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {record.status}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Basic Salary</span>
              <div className="font-medium">₹{record.basicSalary?.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <span className="text-gray-600">Gross Salary</span>
              <div className="font-medium">₹{record.grossSalary?.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <span className="text-gray-600">Total Deductions</span>
              <div className="font-medium text-red-600">₹{record.totalDeductions?.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <span className="text-gray-600">Net Salary</span>
              <div className="font-semibold text-green-600">₹{record.netSalary?.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Working Days: {record.workingDays} | Leave Days: {record.leaveDays}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline btn-xs">View Details</button>
                <button className="btn btn-outline btn-xs">Generate Slip</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add Employee Modal
const AddEmployeeModal = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    basicSalary: '',
    panNumber: '',
    aadharNumber: '',
    address: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      basicSalary: parseFloat(formData.basicSalary) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add Employee</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                  placeholder="employee@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Position *</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="form-input"
                  placeholder="Software Engineer"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="form-select"
                  required
                >
                  <option value="">Select department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Basic Salary (₹) *</label>
                <input
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({...formData, basicSalary: e.target.value})}
                  className="form-input"
                  placeholder="50000"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                  className="form-input"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Aadhar Number</label>
                <input
                  type="text"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData({...formData, aadharNumber: e.target.value})}
                  className="form-input"
                  placeholder="1234 5678 9012"
                />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="form-textarea"
                  placeholder="Employee address"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Process Payroll Modal
const ProcessPayrollModal = ({ employees, selectedMonth, onSubmit, onCancel }) => {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [payrollData, setPayrollData] = useState({
    workingDays: '30',
    leaveDays: '0',
    otherAllowances: '0',
    otherDeductions: '0'
  });

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    selectedEmployees.forEach(employeeId => {
      onSubmit(employeeId, payrollData);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Process Payroll - {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
              <label className="form-label">Select Employees</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-2">
                {employees.filter(e => e.status === 'active').map(employee => (
                  <label key={employee.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeToggle(employee.id)}
                      className="form-checkbox"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">
                        {employee.position} - ₹{employee.basicSalary?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payroll Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Working Days</label>
                <input
                  type="number"
                  value={payrollData.workingDays}
                  onChange={(e) => setPayrollData({...payrollData, workingDays: e.target.value})}
                  className="form-input"
                  min="1"
                  max="31"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Leave Days</label>
                <input
                  type="number"
                  value={payrollData.leaveDays}
                  onChange={(e) => setPayrollData({...payrollData, leaveDays: e.target.value})}
                  className="form-input"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Other Allowances (₹)</label>
                <input
                  type="number"
                  value={payrollData.otherAllowances}
                  onChange={(e) => setPayrollData({...payrollData, otherAllowances: e.target.value})}
                  className="form-input"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Other Deductions (₹)</label>
                <input
                  type="number"
                  value={payrollData.otherDeductions}
                  onChange={(e) => setPayrollData({...payrollData, otherDeductions: e.target.value})}
                  className="form-input"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={selectedEmployees.length === 0}
              >
                Process Payroll ({selectedEmployees.length} employees)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;