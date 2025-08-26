// src/services/invoiceService.js - Fixed PDF Generation
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

  // Helper function to safely convert to number
  static safeToNumber(value, defaultValue = 0) {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }

  // Helper function to format currency for PDF
  static formatCurrency(value) {
    const num = this.safeToNumber(value);
    return `₹${num.toFixed(2)}`;
  }

  // Generate PDF with improved error handling
  static async generatePDF(invoiceData, userSettings = {}) {
    try {
      console.log('Generating PDF for invoice:', invoiceData);
      
      if (!invoiceData) {
        throw new Error('Invoice data is required');
      }

      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica');
      
      // Header - Company Logo Area
      pdf.setFillColor(59, 130, 246); // Primary blue
      pdf.rect(0, 0, 210, 25, 'F');
      
      // Company name in header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(userSettings?.businessName || 'Your Business', 15, 18);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Invoice title
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', 150, 45);
      
      // Invoice details - right side
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const createdDate = invoiceData.createdAt?.toDate ? 
        invoiceData.createdAt.toDate() : 
        new Date(invoiceData.createdAt || new Date());
      
      const dueDate = invoiceData.dueDate ? 
        (invoiceData.dueDate.toDate ? invoiceData.dueDate.toDate() : new Date(invoiceData.dueDate)) :
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      pdf.text(`Invoice #: ${invoiceData.invoiceNumber || 'DRAFT'}`, 150, 55);
      pdf.text(`Date: ${createdDate.toLocaleDateString('en-IN')}`, 150, 62);
      pdf.text(`Due Date: ${dueDate.toLocaleDateString('en-IN')}`, 150, 69);
      
      // Business details (left side)
      pdf.setFont('helvetica', 'bold');
      pdf.text('From:', 15, 45);
      pdf.setFont('helvetica', 'normal');
      
      let yPos = 52;
      if (userSettings?.businessName) {
        pdf.text(userSettings.businessName, 15, yPos);
        yPos += 7;
      }
      
      if (userSettings?.gstNumber) {
        pdf.text(`GSTIN: ${userSettings.gstNumber}`, 15, yPos);
        yPos += 7;
      }
      
      if (userSettings?.address) {
        const addressLines = userSettings.address.split('\n');
        addressLines.forEach(line => {
          if (line.trim()) {
            pdf.text(line.trim(), 15, yPos);
            yPos += 7;
          }
        });
      }

      // Client details (right side) - moved down
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', 15, 85);
      pdf.setFont('helvetica', 'normal');
      
      yPos = 92;
      pdf.text(invoiceData.clientName || 'Client Name', 15, yPos);
      yPos += 7;
      
      if (invoiceData.clientGSTIN) {
        pdf.text(`GSTIN: ${invoiceData.clientGSTIN}`, 15, yPos);
        yPos += 7;
      }
      
      if (invoiceData.clientAddress) {
        const clientAddressLines = invoiceData.clientAddress.split('\n');
        clientAddressLines.forEach(line => {
          if (line.trim()) {
            pdf.text(line.trim(), 15, yPos);
            yPos += 7;
          }
        });
      }

      // Items table
      const tableStartY = Math.max(yPos + 10, 120);
      
      // Table header background
      pdf.setFillColor(248, 249, 250);
      pdf.rect(15, tableStartY - 5, 180, 15, 'F');
      
      // Table headers
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Description', 20, tableStartY + 5);
      pdf.text('Qty', 120, tableStartY + 5);
      pdf.text('Rate', 140, tableStartY + 5);
      pdf.text('GST%', 160, tableStartY + 5);
      pdf.text('Amount', 175, tableStartY + 5);
      
      // Table header line
      pdf.setLineWidth(0.5);
      pdf.line(15, tableStartY + 8, 195, tableStartY + 8);
      
      // Items
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      yPos = tableStartY + 18;
      
      let subtotalAmount = 0;
      let totalGSTAmount = 0;
      
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        invoiceData.items.forEach((item) => {
          const quantity = this.safeToNumber(item.quantity, 1);
          const rate = this.safeToNumber(item.rate, 0);
          const gstRate = this.safeToNumber(item.gstRate, 0);
          
          const itemSubtotal = quantity * rate;
          const itemGST = (itemSubtotal * gstRate) / 100;
          const itemTotal = itemSubtotal + itemGST;
          
          subtotalAmount += itemSubtotal;
          totalGSTAmount += itemGST;
          
          // Handle long descriptions
          const description = (item.description || 'Item').substring(0, 40);
          pdf.text(description, 20, yPos);
          pdf.text(quantity.toFixed(2), 120, yPos);
          pdf.text(rate.toFixed(2), 140, yPos);
          pdf.text(`${gstRate.toFixed(0)}%`, 160, yPos);
          pdf.text(itemTotal.toFixed(2), 175, yPos);
          yPos += 12;
          
          // Check if we need a new page
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
        });
      } else {
        // No items case
        pdf.text('No items added', 20, yPos);
        yPos += 12;
      }

      // Totals section
      yPos += 10;
      const totalsStartY = yPos;
      
      // Totals background
      pdf.setFillColor(248, 249, 250);
      pdf.rect(120, totalsStartY - 5, 75, 45, 'F');
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      // Use provided totals or calculate from items
      const finalSubtotal = this.safeToNumber(invoiceData.subtotal || subtotalAmount);
      const finalGST = this.safeToNumber(invoiceData.totalGST || totalGSTAmount);
      const finalTotal = this.safeToNumber(invoiceData.total || (finalSubtotal + finalGST));
      
      pdf.text('Subtotal:', 125, totalsStartY + 5);
      pdf.text(this.formatCurrency(finalSubtotal), 175, totalsStartY + 5);
      
      pdf.text('Total GST:', 125, totalsStartY + 15);
      pdf.text(this.formatCurrency(finalGST), 175, totalsStartY + 15);
      
      // Total amount line
      pdf.line(125, totalsStartY + 20, 190, totalsStartY + 20);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Total Amount:', 125, totalsStartY + 30);
      pdf.text(this.formatCurrency(finalTotal), 175, totalsStartY + 30);

      // Notes section
      if (invoiceData.notes) {
        yPos = totalsStartY + 50;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('Notes:', 15, yPos);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        // Handle multi-line notes
        const noteLines = invoiceData.notes.split('\n');
        noteLines.forEach((line, index) => {
          if (line.trim()) {
            pdf.text(line.trim(), 15, yPos + 10 + (index * 7));
          }
        });
        yPos += 10 + (noteLines.length * 7);
      } else {
        yPos = totalsStartY + 50;
      }

      // Footer
      yPos += 20;
      if (yPos > 250) {
        pdf.addPage();
        yPos = 30;
      }
      
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Thank you for your business!', 15, yPos);
      
      // Footer line
      pdf.setLineWidth(0.3);
      pdf.line(15, yPos + 10, 195, yPos + 10);
      
      pdf.setFontSize(8);
      pdf.text('Generated by GST SaaS', 105, 285, { align: 'center' });

      console.log('PDF generated successfully');
      return pdf;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}