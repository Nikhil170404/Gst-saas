// src/services/bankingService.js
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export class BankingService {
  // Razorpay integration for Indian businesses
  static async initializeRazorpay() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Create payment for invoice
  static async createPaymentLink(invoiceData, userSettings) {
    try {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_key',
        amount: invoiceData.total * 100, // Convert to paise
        currency: 'INR',
        name: userSettings.businessName || 'GST SaaS',
        description: `Payment for Invoice ${invoiceData.invoiceNumber}`,
        order_id: await this.createRazorpayOrder(invoiceData.total),
        prefill: {
          name: invoiceData.clientName,
          email: invoiceData.clientEmail,
          contact: invoiceData.clientPhone
        },
        theme: { color: '#3b82f6' },
        handler: (response) => {
          this.handlePaymentSuccess(response, invoiceData.id);
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay not loaded');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      throw new Error('Failed to create payment link');
    }
  }

  // Create Razorpay order (mock implementation)
  static async createRazorpayOrder(amount) {
    // In production, this should call your backend API to create order
    return `order_${Date.now()}`;
  }

  // Bank account linking (mock implementation - real would use banking APIs)
  static async linkBankAccount(userId, bankDetails) {
    try {
      const bankAccount = {
        ...bankDetails,
        userId,
        linkedAt: new Date(),
        isVerified: false,
        status: 'pending_verification',
        balance: Math.floor(Math.random() * 100000) // Mock balance for demo
      };

      const docRef = await addDoc(collection(db, 'bank_accounts'), bankAccount);
      return { id: docRef.id, ...bankAccount };
    } catch (error) {
      console.error('Bank account linking error:', error);
      throw new Error('Failed to link bank account');
    }
  }

  // Get user's bank accounts
  static async getUserBankAccounts(userId) {
    try {
      const q = query(collection(db, 'bank_accounts'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get bank accounts error:', error);
      return [];
    }
  }

  // Bank reconciliation - match transactions
  static async reconcileTransactions(userId, bankTransactions) {
    try {
      const invoicesRef = collection(db, 'invoices');
      const expensesRef = collection(db, 'expenses');
      
      const invoicesQuery = query(invoicesRef, where('userId', '==', userId));
      const expensesQuery = query(expensesRef, where('userId', '==', userId));
      
      const [invoicesSnapshot, expensesSnapshot] = await Promise.all([
        getDocs(invoicesQuery),
        getDocs(expensesQuery)
      ]);

      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const matchedTransactions = [];
      
      bankTransactions.forEach(bankTxn => {
        // Match with invoices (credits)
        if (bankTxn.type === 'credit') {
          const matchedInvoice = invoices.find(inv => 
            Math.abs(inv.total - bankTxn.amount) < 0.01 && 
            Math.abs(new Date(inv.createdAt) - new Date(bankTxn.date)) < 7 * 24 * 60 * 60 * 1000
          );
          
          if (matchedInvoice) {
            matchedTransactions.push({
              bankTransaction: bankTxn,
              matched: { type: 'invoice', ...matchedInvoice },
              confidence: 0.9
            });
          }
        }
        
        // Match with expenses (debits)
        if (bankTxn.type === 'debit') {
          const matchedExpense = expenses.find(exp => 
            Math.abs((exp.totalAmount || exp.amount) - bankTxn.amount) < 0.01 && 
            Math.abs(new Date(exp.date || exp.createdAt) - new Date(bankTxn.date)) < 7 * 24 * 60 * 60 * 1000
          );
          
          if (matchedExpense) {
            matchedTransactions.push({
              bankTransaction: bankTxn,
              matched: { type: 'expense', ...matchedExpense },
              confidence: 0.8
            });
          }
        }
      });

      return matchedTransactions;
    } catch (error) {
      console.error('Bank reconciliation error:', error);
      throw new Error('Failed to reconcile transactions');
    }
  }

  // Handle payment success
  static async handlePaymentSuccess(response, invoiceId) {
    try {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        status: 'paid',
        paidAt: new Date(),
        paymentId: response.razorpay_payment_id,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Payment update error:', error);
    }
  }

  // Generate mock bank transactions for demo
  static generateMockTransactions() {
    const transactions = [];
    const descriptions = [
      'Client Payment - ABC Corp',
      'Office Rent',
      'Electricity Bill', 
      'Software Subscription',
      'Freelancer Payment',
      'Equipment Purchase',
      'Marketing Expense',
      'Travel Allowance'
    ];

    for (let i = 0; i < 10; i++) {
      const isCredit = Math.random() > 0.4;
      transactions.push({
        id: `txn_${Date.now()}_${i}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        amount: Math.floor(Math.random() * 50000) + 1000,
        type: isCredit ? 'credit' : 'debit',
        status: 'unmatched',
        balance: Math.floor(Math.random() * 100000) + 50000
      });
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}