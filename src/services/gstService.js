// src/services/gstService.js
export class GSTService {
  static HSN_DATABASE = {
    // Common HSN codes for small businesses
    '8471': { description: 'Computers & Laptops', gstRate: 18 },
    '8517': { description: 'Mobile Phones', gstRate: 18 },
    '4820': { description: 'Stationery', gstRate: 12 },
    '9403': { description: 'Furniture', gstRate: 18 },
    '2106': { description: 'Food Products', gstRate: 5 },
    '9983': { description: 'Software Services', gstRate: 18 },
    '9954': { description: 'Legal Services', gstRate: 18 },
    '9991': { description: 'Consulting Services', gstRate: 18 }
  };

  static GST_RATES = {
    5: { description: 'Essential Items', examples: ['Food grains', 'Medicine'] },
    12: { description: 'Processed Food', examples: ['Processed food', 'Stationery'] },
    18: { description: 'Most Goods', examples: ['Electronics', 'Services'] },
    28: { description: 'Luxury Items', examples: ['Luxury cars', 'Tobacco'] }
  };

  // Calculate GST from inclusive amount
  static calculateGSTFromInclusive(inclusiveAmount, gstRate) {
    const baseAmount = inclusiveAmount / (1 + gstRate / 100);
    const gstAmount = inclusiveAmount - baseAmount;
    
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: inclusiveAmount,
      gstRate,
      cgst: gstRate <= 18 ? Math.round((gstAmount / 2) * 100) / 100 : 0,
      sgst: gstRate <= 18 ? Math.round((gstAmount / 2) * 100) / 100 : 0,
      igst: gstRate > 18 ? gstAmount : 0
    };
  }

  // Calculate GST on exclusive amount
  static calculateGSTFromExclusive(exclusiveAmount, gstRate) {
    const gstAmount = (exclusiveAmount * gstRate) / 100;
    const totalAmount = exclusiveAmount + gstAmount;
    
    return {
      baseAmount: exclusiveAmount,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      gstRate,
      cgst: gstRate <= 18 ? Math.round((gstAmount / 2) * 100) / 100 : 0,
      sgst: gstRate <= 18 ? Math.round((gstAmount / 2) * 100) / 100 : 0,
      igst: gstRate > 18 ? gstAmount : 0
    };
  }

  // Validate GSTIN format
  static validateGSTIN(gstin) {
    if (!gstin) return { valid: false, error: 'GSTIN is required' };
    
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    if (!gstinRegex.test(gstin)) {
      return { 
        valid: false, 
        error: 'Invalid GSTIN format. Should be 15 characters like 22AAAAA0000A1Z5' 
      };
    }

    // Basic checksum validation (simplified)
    const stateCode = gstin.substring(0, 2);
    if (parseInt(stateCode) < 1 || parseInt(stateCode) > 37) {
      return {
        valid: false,
        error: 'Invalid state code in GSTIN'
      };
    }

    return { valid: true, stateCode };
  }

  // Get HSN code suggestions
  static getHSNSuggestions(description) {
    const searchTerm = description.toLowerCase();
    const suggestions = [];

    for (const [code, data] of Object.entries(this.HSN_DATABASE)) {
      if (data.description.toLowerCase().includes(searchTerm) || 
          searchTerm.includes(data.description.toLowerCase())) {
        suggestions.push({
          code,
          description: data.description,
          suggestedGSTRate: data.gstRate
        });
      }
    }

    return suggestions;
  }

  // Calculate due dates for GST returns
  static getGSTDueDates(month, year) {
    const dueDate20 = new Date(year, month, 20); // GSTR-1
    const dueDate20Next = new Date(year, month + 1, 20); // GSTR-3B

    return {
      gstr1: dueDate20,
      gstr3b: dueDate20Next,
      isOverdue: {
        gstr1: new Date() > dueDate20,
        gstr3b: new Date() > dueDate20Next
      }
    };
  }

  // Calculate reverse charge applicability
  static calculateReverseCharge(vendorGSTIN, buyerGSTIN, amount, serviceType) {
    // Simplified reverse charge logic
    const isReverseCharge = !vendorGSTIN && buyerGSTIN && amount > 5000 && 
                           ['legal', 'consulting', 'professional'].includes(serviceType?.toLowerCase());
    
    if (isReverseCharge) {
      return {
        applicable: true,
        gstAmount: amount * 0.18, // Assuming 18% GST
        reason: 'Unregistered vendor providing professional services above ₹5,000'
      };
    }

    return { applicable: false, gstAmount: 0, reason: null };
  }
}