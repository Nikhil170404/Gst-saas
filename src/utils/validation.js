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
