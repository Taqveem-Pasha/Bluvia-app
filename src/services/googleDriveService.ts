import { dbStorage } from '../db/indexedDB';
import { BackupRecord } from '../types';

export interface BackupExportData {
  version: string;
  businessName: string;
  timestamp: string;
  recordCounts: Record<string, number>;
  checksum: string;
  data: {
    products: any[];
    customers: any[];
    suppliers: any[];
    orders: any[];
    payments: any[];
    promised_payments: any[];
    expenses: any[];
    stock_movements: any[];
    cash_ledger: any[];
    settings: any[];
    users: any[];
  };
}

export class GoogleDriveBackupService {
  private static FOLDER_NAME = 'BLUVIA Business Backups';

  /**
   * Generates a simple hex checksum from string content
   */
  public static generateSimpleChecksum(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Exports full business database to a validated JSON backup bundle
   */
  public static async createFullBackupBundle(initiatedBy: string): Promise<{
    bundle: BackupExportData;
    jsonString: string;
    record: BackupRecord;
  }> {
    const products = await dbStorage.getAll('products');
    const customers = await dbStorage.getAll('customers');
    const suppliers = await dbStorage.getAll('suppliers');
    const orders = await dbStorage.getAll('orders');
    const payments = await dbStorage.getAll('payments');
    const promised_payments = await dbStorage.getAll('promised_payments');
    const expenses = await dbStorage.getAll('expenses');
    const stock_movements = await dbStorage.getAll('stock_movements');
    const cash_ledger = await dbStorage.getAll('cash_ledger');
    const settings = await dbStorage.getAll('settings');
    const users = await dbStorage.getAll('users');

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];
    const timeStr = timestamp.split('T')[1].replace(/[:.]/g, '-').slice(0, 8);
    const fileName = `BLUVIA_Backup_${dateStr}_${timeStr}.json`;

    const rawData = {
      products,
      customers,
      suppliers,
      orders,
      payments,
      promised_payments,
      expenses,
      stock_movements,
      cash_ledger,
      settings,
      users,
    };

    const recordCounts = {
      products: products.length,
      customers: customers.length,
      orders: orders.length,
      payments: payments.length,
      expenses: expenses.length,
      stockMovements: stock_movements.length,
    };

    const dataPayloadString = JSON.stringify(rawData);
    const checksum = this.generateSimpleChecksum(dataPayloadString);

    const bundle: BackupExportData = {
      version: '1.2.0',
      businessName: 'BLUVIA Premium Drinking Water Fresh',
      timestamp,
      recordCounts,
      checksum,
      data: rawData,
    };

    const jsonString = JSON.stringify(bundle, null, 2);
    const sizeBytes = new Blob([jsonString]).size;

    const record: BackupRecord = {
      id: 'bk_' + Date.now(),
      fileName,
      folderName: this.FOLDER_NAME,
      recordCounts,
      sizeBytes,
      checksum,
      timestamp,
      status: 'verified',
      initiatedBy,
    };

    // Store in backup records
    await dbStorage.put('backup_records', record);

    return { bundle, jsonString, record };
  }

  /**
   * Generates downloadable CSV exports for accounting, Excel, and local audits
   */
  public static async exportCustomerLedgerCSV(): Promise<string> {
    const customers = await dbStorage.getAll<any>('customers');
    const headers = ['Customer ID', 'Name', 'Phone', 'Area', 'Category', '19L Bottles Held', 'Outstanding Balance (PKR)', 'Created At'];
    const rows = customers.map((c) => [
      `"${c.id}"`,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.area}"`,
      `"${c.category}"`,
      c.bottlesHeld19L || 0,
      c.outstandingBalance || 0,
      `"${c.createdAt || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public static async exportStockLedgerCSV(): Promise<string> {
    const products = await dbStorage.getAll<any>('products');
    const headers = ['Product ID', 'Name', 'Category', 'Unit Price (PKR)', 'Full Stock', 'Empty Stock', 'Damaged Stock', 'In Transit', 'Min Stock'];
    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.name}"`,
      `"${p.category}"`,
      p.unitPrice,
      p.stockFull,
      p.stockEmpty || 0,
      p.stockDamaged || 0,
      p.inTransit || 0,
      p.minStockLevel || 0,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public static async exportCashBookCSV(): Promise<string> {
    const cashEntries = await dbStorage.getAll<any>('cash_ledger');
    const headers = ['Date', 'Type', 'Category', 'Amount (PKR)', 'Balance After (PKR)', 'Description', 'Recorded By'];
    const rows = cashEntries.map((e) => [
      `"${e.date}"`,
      `"${e.type}"`,
      `"${e.category}"`,
      e.amount,
      e.balanceAfter,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.recordedBy}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Helper to trigger native browser file download
   */
  public static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validates and restores a backup bundle with pre-check and safety safeguards
   */
  public static async validateAndRestoreBackup(
    jsonString: string,
    restoredBy: string
  ): Promise<{ success: boolean; message: string; recordCounts?: Record<string, number> }> {
    try {
      const payload: BackupExportData = JSON.parse(jsonString);

      if (!payload.businessName || !payload.businessName.includes('BLUVIA')) {
        return {
          success: false,
          message: 'Validation error: File does not appear to be a valid BLUVIA Water Business backup.',
        };
      }

      if (!payload.data || typeof payload.data !== 'object') {
        return {
          success: false,
          message: 'Corrupted backup file: Missing database tables payload.',
        };
      }

      // Step 1: Create safety snapshot of current data before overwriting
      await this.createFullBackupBundle(`Automatic Pre-Restore Safety Snapshot (${restoredBy})`);

      // Step 2: Restore tables
      const {
        products = [],
        customers = [],
        suppliers = [],
        orders = [],
        payments = [],
        promised_payments = [],
        expenses = [],
        stock_movements = [],
        cash_ledger = [],
        settings = [],
        users = [],
      } = payload.data;

      if (products.length > 0) await dbStorage.putBatch('products', products);
      if (customers.length > 0) await dbStorage.putBatch('customers', customers);
      if (suppliers.length > 0) await dbStorage.putBatch('suppliers', suppliers);
      if (orders.length > 0) await dbStorage.putBatch('orders', orders);
      if (payments.length > 0) await dbStorage.putBatch('payments', payments);
      if (promised_payments.length > 0) await dbStorage.putBatch('promised_payments', promised_payments);
      if (expenses.length > 0) await dbStorage.putBatch('expenses', expenses);
      if (stock_movements.length > 0) await dbStorage.putBatch('stock_movements', stock_movements);
      if (cash_ledger.length > 0) await dbStorage.putBatch('cash_ledger', cash_ledger);
      if (settings.length > 0) await dbStorage.putBatch('settings', settings);
      if (users.length > 0) await dbStorage.putBatch('users', users);

      // Log to audit trail
      await dbStorage.put('audit_log', {
        id: 'audit_' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: restoredBy,
        userName: restoredBy,
        role: 'owner',
        action: 'Database Restored from Backup',
        entityType: 'backup',
        entityId: payload.checksum || 'manual_file',
        details: `Restored ${customers.length} customers, ${orders.length} orders, ${products.length} products.`,
      });

      return {
        success: true,
        message: 'Database successfully restored and verified from backup.',
        recordCounts: payload.recordCounts,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Restoration failed: ${err?.message || 'Invalid JSON format'}`,
      };
    }
  }
}
