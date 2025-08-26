// src/services/aiService.js
class AIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENROUTER_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  // Rate limiting and caching
  async makeRequest(prompt, options = {}) {
    const cacheKey = JSON.stringify({ prompt, options });
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({ prompt, options, resolve, reject, cacheKey });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { prompt, options, resolve, reject, cacheKey } = this.requestQueue.shift();

      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': process.env.REACT_APP_NAME || 'GST SaaS'
          },
          body: JSON.stringify({
            model: options.model || "google/gemini-flash-1.5",
            messages: [{ role: "user", content: prompt }],
            temperature: options.temperature || 0.3,
            max_tokens: options.maxTokens || 1000,
            ...options
          })
        });

        if (!response.ok) {
          throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const result = data.choices[0].message.content;

        // Cache the result
        this.cache.set(cacheKey, result);

        // Auto-cleanup cache after 1 hour
        setTimeout(() => this.cache.delete(cacheKey), 60 * 60 * 1000);

        resolve(result);
      } catch (error) {
        console.error('AI Service Error:', error);
        reject(error);
      }

      // Rate limiting: 1 request per second for free tier
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
  }

  // Process receipt with structured output
  async processReceipt(receiptText) {
    const prompt = `Extract GST invoice details from this receipt/invoice text. Return ONLY valid JSON:

Receipt Text:
${receiptText}

Required JSON format:
{
  "vendor_name": "string",
  "vendor_gstin": "string or null",
  "invoice_number": "string",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "rate": number,
      "amount": number
    }
  ],
  "subtotal": number,
  "gst_details": {
    "cgst": number,
    "sgst": number,
    "igst": number,
    "total_gst": number
  },
  "total_amount": number,
  "category": "Office Supplies|Travel|Marketing|Food|Other",
  "hsn_code": "string or null"
}

Extract all visible amounts and calculate totals accurately. If GST breakdown is not visible, estimate based on total amount.`;

    try {
      const response = await this.makeRequest(prompt, { temperature: 0.1 });
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const data = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!data.vendor_name || !data.total_amount) {
        throw new Error('Missing required invoice data');
      }

      return data;
    } catch (error) {
      console.error('Receipt processing error:', error);
      throw new Error('Failed to process receipt. Please try again or enter details manually.');
    }
  }

  // Smart expense categorization
  async categorizeExpense(description, amount, vendor) {
    const prompt = `Categorize this business expense for GST accounting:

Description: ${description}
Amount: ₹${amount}
Vendor: ${vendor || 'Unknown'}

Return JSON:
{
  "category": "Office Supplies|Travel|Marketing|Professional Services|Utilities|Food & Beverages|Equipment|Other",
  "subcategory": "string",
  "suggested_gst_rate": 5|12|18|28,
  "is_business_expense": true|false,
  "deductible_percentage": 100|50|0,
  "notes": "brief explanation"
}`;

    try {
      const response = await this.makeRequest(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback categorization
      return {
        category: "Other",
        subcategory: "Miscellaneous",
        suggested_gst_rate: 18,
        is_business_expense: true,
        deductible_percentage: 100,
        notes: "Manual review recommended"
      };
    } catch (error) {
      console.error('Categorization error:', error);
      return {
        category: "Other",
        subcategory: "Miscellaneous", 
        suggested_gst_rate: 18,
        is_business_expense: true,
        deductible_percentage: 100,
        notes: "Auto-categorization failed"
      };
    }
  }

  // Generate business insights
  async generateInsights(businessData) {
    const prompt = `Analyze this business data and provide actionable GST & financial insights:

${JSON.stringify(businessData, null, 2)}

Provide insights on:
1. GST optimization opportunities
2. Cash flow trends
3. Expense reduction suggestions
4. Compliance risks
5. Growth recommendations

Return practical, India-specific advice in simple language.`;

    try {
      return await this.makeRequest(prompt, { maxTokens: 1500 });
    } catch (error) {
      console.error('Insights generation error:', error);
      return "Unable to generate insights at this time. Please try again later.";
    }
  }

  // Validate invoice data with AI
  async validateInvoice(invoiceData) {
    const prompt = `Review this invoice data for GST compliance issues:

${JSON.stringify(invoiceData, null, 2)}

Check for:
1. GSTIN format validity
2. HSN code appropriateness  
3. GST rate correctness
4. Calculation accuracy
5. Required fields completeness

Return JSON:
{
  "is_valid": true|false,
  "errors": ["list of issues found"],
  "warnings": ["list of minor issues"],
  "suggestions": ["improvement recommendations"]
}`;

    try {
      const response = await this.makeRequest(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        is_valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        is_valid: true,
        errors: [],
        warnings: ["AI validation unavailable"],
        suggestions: []
      };
    }
  }
}

export const aiService = new AIService();