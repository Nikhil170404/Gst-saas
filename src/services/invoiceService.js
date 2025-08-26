// src/services/invoiceService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  increment 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import jsPDF from 'jspdf';

export class InvoiceService {
  // Create new invoice
  static async createInvoice(userId, invoiceData) {
    try {
      const invoiceNumber = await this.generateInvoiceNumber(userId);
      
      const invoice = {
        ...invoiceData,
        invoiceNumber,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft'
      };

      const docRef = await addDoc(collection(db, 'invoices'), invoice);
      
      // Update user usage
      await updateDoc(doc(db, 'users', userId), {
        'usage.invoicesThisMonth': increment(1)
      });

      return { id: docRef.id, ...invoice, error: null };
    } catch (error) {
      console.error('Create invoice error:', error);
      return { invoice: null, error: error.message };
    }
  }

  // Generate unique invoice number
  static async generateInvoiceNumber(userId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    try {
      // Get count of invoices this month
      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        where('userId', '==', userId),
        where('createdAt', '>=', new Date(year, now.getMonth(), 1)),
        where('createdAt', '<', new Date(year, now.getMonth() + 1, 1))
      );
      
      const snapshot = await getDocs(q);
      const count = snapshot.size + 1;
      
      return `INV-${year}${month}-${String(count).padStart(3, '0')}`;
    } catch (error) {
      console.error('Generate invoice number error:', error);
      // Fallback to timestamp-based number
      return `INV-${Date.now()}`;
    }
  }

  // Get user invoices
  static async getUserInvoices(userId, limit = 50) {
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { invoices, error: null };
    } catch (error) {
      console.error('Get user invoices error:', error);
      return { invoices: [], error: error.message };
    }
  }

  // Update invoice
  static async updateInvoice(invoiceId, updates) {
    try {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        ...updates,
        updatedAt: new Date()
      });
      return { error: null };
    } catch (error) {
      console.error('Update invoice error:', error);
      return { error: error.message };
    }
  }

  // Delete invoice
  static async deleteInvoice(invoiceId) {
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      return { error: null };
    } catch (error) {
      console.error('Delete invoice error:', error);
      return { error: error.message };
    }
  }

  // Generate PDF
  static async generatePDF(invoiceData, userSettings = {}) {
    try {
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica');
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TAX INVOICE', 20, 30);
      
      // Invoice details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const createdDate = invoiceData.createdAt?.toDate ? 
        invoiceData.createdAt.toDate() : 
        new Date(invoiceData.createdAt);
      
      pdf.text(`Invoice No: ${invoiceData.invoiceNumber}`, 20, 50);
      pdf.text(`Date: ${createdDate.toLocaleDateString('en-IN')}`, 20, 60);
      
      // Business details (left side)
      pdf.setFont('helvetica', 'bold');
      pdf.text('From:', 20, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text(userSettings?.businessName || 'Your Business', 20, 90);
      
      if (userSettings?.gstNumber) {
        pdf.text(`GSTIN: ${userSettings.gstNumber}`, 20, 100);
      }
      if (userSettings?.address) {
        const address = userSettings.address.substring(0, 50);
        pdf.text(address, 20, 110);
      }

      // Client details (right side)
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', 120, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text(invoiceData.clientName, 120, 90);
      
      if (invoiceData.clientGSTIN) {
        pdf.text(`GSTIN: ${invoiceData.clientGSTIN}`, 120, 100);
      }

      // Items table header
      let yPos = 140;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description', 20, yPos);
      pdf.text('Qty', 80, yPos);
      pdf.text('Rate', 100, yPos);
      pdf.text('GST%', 120, yPos);
      pdf.text('Amount', 150, yPos);
      
      yPos += 10;
      pdf.line(20, yPos, 180, yPos); // Horizontal line
      yPos += 10;

      // Items
      pdf.setFont('helvetica', 'normal');
      let total = 0;
      
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        invoiceData.items.forEach((item) => {
          const itemTotal = (item.quantity || 0) * (item.rate || 0);
          total += itemTotal;
          
          const description = (item.description || '').substring(0, 25);
          pdf.text(description, 20, yPos);
          pdf.text(String(item.quantity || 0), 80, yPos);
          pdf.text(`₹${(item.rate || 0).toFixed(2)}`, 100, yPos);
          pdf.text(`${item.gstRate || 0}%`, 120, yPos);
          pdf.text(`₹${itemTotal.toFixed(2)}`, 150, yPos);
          yPos += 15;
        });
      }

      // Totals
      yPos += 10;
      pdf.line(20, yPos, 180, yPos);
      yPos += 10;
      
      const gstAmount = invoiceData.totalGST || 0;
      const subtotal = invoiceData.subtotal || 0;
      const totalAmount = invoiceData.total || 0;
      
      pdf.text('Subtotal:', 120, yPos);
      pdf.text(`₹${subtotal.toFixed(2)}`, 150, yPos);
      yPos += 10;
      
      pdf.text('Total GST:', 120, yPos);
      pdf.text(`₹${gstAmount.toFixed(2)}`, 150, yPos);
      yPos += 10;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Amount:', 120, yPos);
      pdf.text(`₹${totalAmount.toFixed(2)}`, 150, yPos);

      // Footer
      yPos += 30;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Thank you for your business!', 20, yPos);

      return pdf;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  }
}