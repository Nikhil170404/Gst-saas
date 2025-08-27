// src/services/inventoryService.js
import { collection, addDoc, getDocs, query, where, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

export class InventoryService {
  // Add new inventory item
  static async addItem(userId, itemData) {
    try {
      const item = {
        ...itemData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStock: itemData.initialStock || 0,
        stockValue: (itemData.initialStock || 0) * (itemData.unitCost || 0),
        barcode: itemData.barcode || this.generateBarcode()
      };

      const docRef = await addDoc(collection(db, 'inventory_items'), item);
      return { id: docRef.id, ...item };
    } catch (error) {
      console.error('Add inventory item error:', error);
      throw new Error('Failed to add inventory item');
    }
  }

  // Get all inventory items for user
  static async getUserInventory(userId) {
    try {
      const q = query(collection(db, 'inventory_items'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get inventory error:', error);
      return [];
    }
  }

  // Update stock levels
  static async updateStock(itemId, quantity, type = 'adjustment', reference = null) {
    try {
      const itemRef = doc(db, 'inventory_items', itemId);
      
      // Create stock movement record
      const stockMovement = {
        itemId,
        quantity,
        type, // 'sale', 'purchase', 'adjustment', 'return'
        reference, // invoice/purchase order reference
        date: new Date(),
        createdAt: new Date()
      };

      // Add stock movement record
      await addDoc(collection(db, 'stock_movements'), stockMovement);

      // Update item stock
      const itemsSnapshot = await getDocs(query(collection(db, 'inventory_items'), where('__name__', '==', itemId)));
      if (!itemsSnapshot.empty) {
        const item = itemsSnapshot.docs[0].data();
        const newStock = Math.max(0, item.currentStock + quantity);
        
        await updateDoc(itemRef, {
          currentStock: newStock,
          stockValue: newStock * (item.unitCost || 0),
          updatedAt: new Date()
        });

        return { success: true, newStock };
      }
    } catch (error) {
      console.error('Update stock error:', error);
      throw new Error('Failed to update stock');
    }
  }

  // Generate purchase order
  static async createPurchaseOrder(userId, orderData) {
    try {
      const po = {
        ...orderData,
        userId,
        poNumber: await this.generatePONumber(userId),
        status: 'pending',
        totalAmount: orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'purchase_orders'), po);
      return { id: docRef.id, ...po };
    } catch (error) {
      console.error('Create purchase order error:', error);
      throw new Error('Failed to create purchase order');
    }
  }

  // Get low stock items
  static async getLowStockItems(userId, threshold = 10) {
    try {
      const items = await this.getUserInventory(userId);
      return items.filter(item => item.currentStock <= (item.reorderLevel || threshold));
    } catch (error) {
      console.error('Get low stock items error:', error);
      return [];
    }
  }

  // Generate barcode for item
  static generateBarcode() {
    // Simple barcode generation - in production use proper barcode library
    return `GST${Date.now()}${Math.random().toString(36).substr(2, 4)}`.toUpperCase();
  }

  // Inventory valuation report
  static async getInventoryValuation(userId) {
    try {
      const items = await this.getUserInventory(userId);
      
      const valuation = {
        totalItems: items.length,
        totalStockValue: items.reduce((sum, item) => sum + (item.stockValue || 0), 0),
        totalUnits: items.reduce((sum, item) => sum + (item.currentStock || 0), 0),
        lowStockItems: items.filter(item => (item.currentStock || 0) <= (item.reorderLevel || 10)).length,
        categories: {}
      };

      // Group by category
      items.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!valuation.categories[category]) {
          valuation.categories[category] = { items: 0, value: 0, units: 0 };
        }
        valuation.categories[category].items++;
        valuation.categories[category].value += item.stockValue || 0;
        valuation.categories[category].units += item.currentStock || 0;
      });

      return valuation;
    } catch (error) {
      console.error('Inventory valuation error:', error);
      return { totalItems: 0, totalStockValue: 0, totalUnits: 0, categories: {} };
    }
  }

  // Generate PO number
  static async generatePONumber(userId) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      const q = query(
        collection(db, 'purchase_orders'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const count = snapshot.size + 1;
      
      return `PO-${year}${month}-${String(count).padStart(3, '0')}`;
    } catch (error) {
      return `PO-${Date.now()}`;
    }
  }

  // Get stock movements for an item
  static async getStockMovements(itemId) {
    try {
      const q = query(collection(db, 'stock_movements'), where('itemId', '==', itemId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get stock movements error:', error);
      return [];
    }
  }
}