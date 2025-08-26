// src/utils/formatters.js
export const formatCurrency = (amount, currency = 'INR') => {
  const formatters = {
    INR: (value) => `₹${value.toLocaleString('en-IN')}`,
    USD: (value) => `$${value.toLocaleString('en-US')}`,
    EUR: (value) => `€${value.toLocaleString('de-DE')}`
  };
  
  return formatters[currency]?.(amount) || `${amount}`;
};

export const formatNumber = (number, decimals = 2) => {
  return parseFloat(number).toFixed(decimals);
};

export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  const formats = {
    short: 'MMM dd, yyyy',
    long: 'MMMM dd, yyyy',
    full: 'EEEE, MMMM dd, yyyy',
    iso: 'yyyy-MM-dd'
  };
  
  try {
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: '2-digit'
    });
  } catch (error) {
    return dateObj.toISOString().split('T')[0];
  }
};

export const formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${randomStr}`.toUpperCase();
};

// src/utils/validation.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateGSTIN = (gstin) => {
  if (!gstin) return { valid: true, error: null }; // Optional field
  
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(gstin)) {
    return {
      valid: false,
      error: 'Invalid GSTIN format. Should be 15 characters like 22AAAAA0000A1Z5'
    };
  }

  const stateCode = parseInt(gstin.substring(0, 2));
  if (stateCode < 1 || stateCode > 37) {
    return {
      valid: false,
      error: 'Invalid state code in GSTIN'
    };
  }

  return { valid: true, error: null };
};

export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

export const validateAmount = (amount, min = 0, max = Infinity) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return { valid: false, error: 'Invalid amount' };
  if (num < min) return { valid: false, error: `Amount must be at least ${min}` };
  if (num > max) return { valid: false, error: `Amount cannot exceed ${max}` };
  return { valid: true, error: null };
};