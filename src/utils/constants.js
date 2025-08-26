// src/utils/constants.js
export const GST_RATES = [0, 5, 12, 18, 28];

export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Marketing',
  'Professional Services',
  'Utilities',
  'Food & Beverages',
  'Equipment',
  'Software',
  'Insurance',
  'Rent',
  'Internet & Phone',
  'Training',
  'Legal & Compliance',
  'Other'
];

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' }
];

export const PAYMENT_TERMS = [
  { value: 0, label: 'Due on receipt' },
  { value: 15, label: 'Net 15 days' },
  { value: 30, label: 'Net 30 days' },
  { value: 45, label: 'Net 45 days' },
  { value: 60, label: 'Net 60 days' }
];

export const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '25', name: 'Daman and Diu' },
  { code: '26', name: 'Dadra and Nagar Haveli' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' }
];

export const HSN_CODES = {
  // IT Services
  '9983': { description: 'Information technology software', gstRate: 18 },
  '9984': { description: 'Information technology consultancy', gstRate: 18 },
  
  // Professional Services
  '9991': { description: 'Business support services', gstRate: 18 },
  '9954': { description: 'Legal services', gstRate: 18 },
  '9992': { description: 'Accounting services', gstRate: 18 },
  
  // Common Products
  '8471': { description: 'Computers and laptops', gstRate: 18 },
  '8517': { description: 'Mobile phones', gstRate: 18 },
  '4820': { description: 'Stationery items', gstRate: 12 },
  '9403': { description: 'Office furniture', gstRate: 18 },
  '2106': { description: 'Food preparations', gstRate: 5 },
  '8704': { description: 'Motor vehicles', gstRate: 28 },
  '6109': { description: 'T-shirts and apparel', gstRate: 12 }
};

// src/utils/storage.js
class Storage {
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
      return false;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  }
}

// Session storage wrapper
class SessionStorage {
  static get(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Error writing to sessionStorage:', error);
      return false;
    }
  }

  static remove(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Error removing from sessionStorage:', error);
      return false;
    }
  }
}

export { Storage, SessionStorage };