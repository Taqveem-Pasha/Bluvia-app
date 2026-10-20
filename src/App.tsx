/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbStorage } from './db/indexedDB';
import { syncEngine } from './services/syncEngine';
import { GoogleDriveBackupService } from './services/googleDriveService';
import {
  UserProfile,
  Product,
  Customer,
  Supplier,
  Order,
  PaymentReceipt,
  PromisedPayment,
  ExpenseRecord,
  CashLedgerEntry,
  StockMovement,
  AuditLogEntry,
  BackupRecord,
  BusinessSettings,
  OutboxSyncItem,
  UserRole,
  PaymentMethod,
  ExpenseCategory,
  OrderItem,
} from './types';
import {
  calculateSaleTotal,
  processStockPurchase,
  processOrderDispatch,
  processDeliveryCompletion,
  processFailedDelivery,
  processPayment,
  processExpense,
} from './core/calculations';

import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { StockView } from './components/StockView';
import { CustomersView } from './components/CustomersView';
import { OrdersDeliveriesView } from './components/OrdersDeliveriesView';
import { FinanceView } from './components/FinanceView';
import { BackupSyncView } from './components/BackupSyncView';
import { SettingsStaffView } from './components/SettingsStaffView';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { BluviaLogo } from './components/BluviaLogo';
import { LoginView } from './components/LoginView';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [promisedPayments, setPromisedPayments] = useState<PromisedPayment[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [cashLedger, setCashLedger] = useState<CashLedgerEntry[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [outboxItems, setOutboxItems] = useState<OutboxSyncItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  // Sync state
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Quick Action Modal
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalType, setQuickModalType] = useState('order');
  const [quickModalPrefillProdId, setQuickModalPrefillProdId] = useState<string | undefined>(undefined);

  // Load database tables
  const reloadData = async () => {
    try {
      const [
        loadedUsers,
        loadedProducts,
        loadedCustomers,
        loadedSuppliers,
        loadedOrders,
        loadedPayments,
        loadedPromises,
        loadedExpenses,
        loadedCash,
        loadedMovements,
        loadedAudit,
        loadedBackups,
        loadedOutbox,
        loadedSettings,
      ] = await Promise.all([
        dbStorage.getAll<UserProfile>('users'),
        dbStorage.getAll<Product>('products'),
        dbStorage.getAll<Customer>('customers'),
        dbStorage.getAll<Supplier>('suppliers'),
        dbStorage.getAll<Order>('orders'),
        dbStorage.getAll<PaymentReceipt>('payments'),
        dbStorage.getAll<PromisedPayment>('promised_payments'),
        dbStorage.getAll<ExpenseRecord>('expenses'),
        dbStorage.getAll<CashLedgerEntry>('cash_ledger'),
        dbStorage.getAll<StockMovement>('stock_movements'),
        dbStorage.getAll<AuditLogEntry>('audit_log'),
        dbStorage.getAll<BackupRecord>('backup_records'),
        dbStorage.getAll<OutboxSyncItem>('outbox_sync'),
        dbStorage.getById<BusinessSettings>('settings', 'business_settings'),
      ]);

      setUsers(loadedUsers);
      if (!currentUser && loadedUsers.length > 0) {
        setCurrentUser(loadedUsers[0]);
      } else if (currentUser) {
        const refreshed = loadedUsers.find((u: UserProfile) => u.id === currentUser.id);
        if (refreshed) setCurrentUser(refreshed);
      }

      setProducts(loadedProducts);
      setCustomers(loadedCustomers);
      setSuppliers(loadedSuppliers);
      setOrders(loadedOrders);
      setPayments(loadedPayments);
      setPromisedPayments(loadedPromises);
      setExpenses(loadedExpenses);
      setCashLedger(loadedCash);
      setStockMovements(loadedMovements);
      setAuditLogs(loadedAudit);
      setBackupRecords(loadedBackups);
      setOutboxItems(loadedOutbox);
      if (loadedSettings) setSettings(loadedSettings);
    } catch (err) {
      console.error('Error reloading database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();

    // Subscribe to sync engine status
    const unsubscribe = syncEngine.subscribe((status) => {
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setPendingSyncCount(status.pendingCount);
    });

    return () => unsubscribe();
  }, []);

  // Helper to record an audit log
  const logAudit = async (
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    details: string
  ) => {
    if (!currentUser) return;
    const entry: AuditLogEntry = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      entityType,
      entityId,
      details,
    };
    await dbStorage.put('audit_log', entry);
  };

  // 1. Stock Purchase Action (Criterion 1 & 8)
  const handleRecordStockPurchase = async (purchase: {
    productId: string;
    supplierId: string;
    quantity: number;
    unitCost: number;
    paidCash: boolean;
    notes?: string;
  }) => {
    const prod = products.find((p) => p.id === purchase.productId);
    const sup = suppliers.find((s) => s.id === purchase.supplierId);
    if (!prod || !currentUser) return;

    const totalValue = purchase.quantity * purchase.unitCost;

    // A: Update product stock using pure calculation
    const updatedStock = processStockPurchase(
      {
        stockFull: prod.stockFull,
        stockEmpty: prod.stockEmpty,
        stockDamaged: prod.stockDamaged,
        inTransit: prod.inTransit,
      },
      purchase.quantity
    );

    const updatedProd: Product = {
      ...prod,
      stockFull: updatedStock.stockFull,
      updatedAt: new Date().toISOString(),
    };
    await dbStorage.put('products', updatedProd);

    // B: Log Stock Movement
    const movement: StockMovement = {
      id: 'sm_' + Date.now(),
      productId: prod.id,
      productName: prod.name,
      movementType: 'purchase_receipt',
      fullDelta: purchase.quantity,
      emptyDelta: 0,
      damagedDelta: 0,
      notes: `Purchased from ${sup?.company || 'Supplier'} @ Rs. ${purchase.unitCost}/unit. ${purchase.notes || ''}`,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    await dbStorage.put('stock_movements', movement);

    // C: If paid cash from register, update cash ledger
    if (purchase.paidCash) {
      const currentCash = cashLedger.length > 0 ? cashLedger[cashLedger.length - 1].balanceAfter : 20660;
      const newCash = processExpense(currentCash, totalValue);
      const cashEntry: CashLedgerEntry = {
        id: 'cash_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'outflow',
        category: 'Stock Purchase',
        amount: totalValue,
        balanceAfter: newCash,
        referenceType: 'expense',
        referenceId: movement.id,
        description: `Purchased ${purchase.quantity}x ${prod.name} from ${sup?.company}`,
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      await dbStorage.put('cash_ledger', cashEntry);
    } else if (sup) {
      // Increase supplier balance owed
      const updatedSup: Supplier = {
        ...sup,
        balanceOwed: sup.balanceOwed + totalValue,
        updatedAt: new Date().toISOString(),
      };
      await dbStorage.put('suppliers', updatedSup);
    }

    // D: Queue transaction in offline outbox
    await syncEngine.queueTransaction('stock', 'insert', { purchase, totalValue });
    await logAudit(
      'Stock Purchased',
      'stock',
      prod.id,
      `Added ${purchase.quantity} full bottles. Paid: Rs. ${totalValue} (${purchase.paidCash ? 'Cash' : 'Credit'})`
    );

    await reloadData();
  };

  // 2. Damage or Manual Adjustment
  const handleRecordDamageOrAdjustment = async (adjustment: {
    productId: string;
    type: 'damaged' | 'adjustment';
    fullDelta: number;
    emptyDelta: number;
    damagedDelta: number;
    notes: string;
  }) => {
    const prod = products.find((p) => p.id === adjustment.productId);
    if (!prod || !currentUser) return;

    const updatedProd: Product = {
      ...prod,
      stockFull: Math.max(0, prod.stockFull + adjustment.fullDelta),
      stockEmpty: Math.max(0, prod.stockEmpty + adjustment.emptyDelta),
      stockDamaged: Math.max(0, prod.stockDamaged + adjustment.damagedDelta),
      updatedAt: new Date().toISOString(),
    };
    await dbStorage.put('products', updatedProd);

    const movement: StockMovement = {
      id: 'sm_' + Date.now(),
      productId: prod.id,
      productName: prod.name,
      movementType: adjustment.type === 'damaged' ? 'damaged_writeoff' : 'manual_adjustment',
      fullDelta: adjustment.fullDelta,
      emptyDelta: adjustment.emptyDelta,
      damagedDelta: adjustment.damagedDelta,
      notes: adjustment.notes,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    await dbStorage.put('stock_movements', movement);

    await syncEngine.queueTransaction('stock', 'update', { adjustment });
    await logAudit('Stock Adjusted', 'stock', prod.id, adjustment.notes);
    await reloadData();
  };

  // 3. Save Customer (Add / Edit)
  const handleSaveCustomer = async (custData: Partial<Customer>) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const id = custData.id || 'cust_' + Date.now();

    const customer: Customer = {
      id,
      name: custData.name || 'New Customer',
      phone: custData.phone || '',
      whatsapp: custData.whatsapp || custData.phone || '',
      address: custData.address || '',
      area: custData.area || settings?.deliveryAreas[0] || 'DHA Phase 2 & 5',
      category: custData.category || 'residential',
      openingBalance: custData.openingBalance || 0,
      outstandingBalance: custData.outstandingBalance !== undefined ? custData.outstandingBalance : (custData.openingBalance || 0),
      bottlesHeld19L: custData.bottlesHeld19L || 0,
      notes: custData.notes,
      createdAt: custData.createdAt || now,
      updatedAt: now,
      synced: false,
    };

    await dbStorage.put('customers', customer);
    await syncEngine.queueTransaction('customer', custData.id ? 'update' : 'insert', customer);
    await logAudit(
      custData.id ? 'Updated Customer' : 'Created Customer',
      'customer',
      id,
      `${customer.name} (${customer.area})`
    );
    await reloadData();
  };

  // 4. Create Order & Booking (Criterion 2, 3)
  const handleCreateOrder = async (orderData: {
    customerId: string;
    items: OrderItem[];
    discount: number;
    deliveryCharges: number;
    assignedStaffId?: string;
    deliveryDate: string;
    notes?: string;
    collectImmediateCash?: boolean;
  }) => {
    const cust = customers.find((c) => c.id === orderData.customerId);
    const assignedUser = users.find((u) => u.id === orderData.assignedStaffId);
    if (!cust || !currentUser) return;

    const calc = calculateSaleTotal(
      orderData.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
      orderData.discount,
      orderData.deliveryCharges
    );

    const orderId = 'ord_' + Date.now();
    const orderNumber = `ORD-${orders.length + 1001}`;
    const totalBottles = orderData.items.reduce((sum, i) => sum + i.quantity, 0);

    const order: Order = {
      id: orderId,
      orderNumber,
      customerId: cust.id,
      customerName: cust.name,
      area: cust.area,
      items: orderData.items,
      subtotal: calc.subtotal,
      discount: calc.discount,
      deliveryCharges: calc.deliveryCharges,
      netTotal: calc.netTotal,
      status: 'pending',
      paymentStatus: orderData.collectImmediateCash ? 'paid' : 'unpaid',
      paidAmount: orderData.collectImmediateCash ? calc.netTotal : 0,
      bottlesDelivered: 0,
      bottlesReturned: 0,
      assignedStaffId: orderData.assignedStaffId,
      assignedStaffName: assignedUser?.name,
      deliveryDate: orderData.deliveryDate,
      notes: orderData.notes,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await dbStorage.put('orders', order);

    // If unpaid: add net total to customer outstanding balance
    if (!orderData.collectImmediateCash) {
      const updatedCust: Customer = {
        ...cust,
        outstandingBalance: cust.outstandingBalance + calc.netTotal,
        updatedAt: new Date().toISOString(),
      };
      await dbStorage.put('customers', updatedCust);
    } else {
      // Paid cash upfront: record cash receipt and update cash ledger
      const currentCash = cashLedger.length > 0 ? cashLedger[cashLedger.length - 1].balanceAfter : 20660;
      const receipt: PaymentReceipt = {
        id: 'pay_' + Date.now(),
        receiptNumber: `RCP-${payments.length + 2001}`,
        customerId: cust.id,
        customerName: cust.name,
        amount: calc.netTotal,
        paymentMethod: 'cash',
        allocatedOrderId: order.id,
        notes: `Immediate payment for ${order.orderNumber}`,
        collectedByUserId: currentUser.id,
        collectedByName: currentUser.name,
        createdAt: new Date().toISOString(),
        synced: false,
      };
      await dbStorage.put('payments', receipt);

      const cashEntry: CashLedgerEntry = {
        id: 'cash_' + Date.now(),
        date: order.deliveryDate,
        type: 'inflow',
        category: 'Customer Order Payment',
        amount: calc.netTotal,
        balanceAfter: currentCash + calc.netTotal,
        referenceType: 'payment_received',
        referenceId: receipt.id,
        description: `Payment for ${order.orderNumber} from ${cust.name}`,
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      await dbStorage.put('cash_ledger', cashEntry);
    }

    await syncEngine.queueTransaction('order', 'insert', order);
    await logAudit(
      'Booked Order',
      'order',
      order.id,
      `${order.orderNumber} for ${cust.name} - Total: Rs. ${calc.netTotal}`
    );

    await reloadData();
  };

  // 5. Dispatch Order (Criterion 5 part A)
  const handleDispatchOrder = async (orderId: string, assignedDriverId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const driver = users.find((u) => u.id === assignedDriverId);
    if (!order || !currentUser) return;

    // Deduct stock from stockFull to inTransit
    const totalBottles = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const bottleProd = products.find((p) => p.isReusableBottle);

    if (bottleProd) {
      const dispatched = processOrderDispatch(
        {
          stockFull: bottleProd.stockFull,
          stockEmpty: bottleProd.stockEmpty,
          stockDamaged: bottleProd.stockDamaged,
          inTransit: bottleProd.inTransit,
        },
        totalBottles
      );

      const updatedProd: Product = {
        ...bottleProd,
        stockFull: dispatched.stockFull,
        inTransit: dispatched.inTransit,
        updatedAt: new Date().toISOString(),
      };
      await dbStorage.put('products', updatedProd);

      // Log movement
      const movement: StockMovement = {
        id: 'sm_' + Date.now(),
        productId: bottleProd.id,
        productName: bottleProd.name,
        movementType: 'dispatch_out',
        fullDelta: -totalBottles,
        emptyDelta: 0,
        damagedDelta: 0,
        referenceId: order.id,
        referenceDoc: order.orderNumber,
        notes: `Dispatched ${totalBottles} bottles to van for ${order.customerName}`,
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      await dbStorage.put('stock_movements', movement);
    }

    const updatedOrder: Order = {
      ...order,
      status: 'dispatched',
      assignedStaffId: driver?.id,
      assignedStaffName: driver?.name,
      updatedAt: new Date().toISOString(),
    };
    await dbStorage.put('orders', updatedOrder);

    await syncEngine.queueTransaction('order', 'update', updatedOrder);
    await logAudit('Order Dispatched', 'order', order.id, `Dispatched to ${driver?.name || 'Driver'}`);
    await reloadData();
  };

  // 6. Complete Delivery (Criterion 5 part B)
  const handleCompleteDelivery = async (
    orderId: string,
    bottlesDelivered: number,
    bottlesReturned: number,
    paymentCollected: number,
    paymentMethod: 'cash' | 'jazzcash' | 'easypaisa'
  ) => {
    const order = orders.find((o) => o.id === orderId);
    const cust = customers.find((c) => c.id === order?.customerId);
    if (!order || !cust || !currentUser) return;

    const bottleProd = products.find((p) => p.isReusableBottle);

    // If order was already dispatched, clear inTransit without deducting stockFull a second time!
    if (bottleProd) {
      const deliveredState = processDeliveryCompletion(
        {
          stockFull: bottleProd.stockFull,
          stockEmpty: bottleProd.stockEmpty,
          stockDamaged: bottleProd.stockDamaged,
          inTransit: Math.max(bottlesDelivered, bottleProd.inTransit), // safety clamp
        },
        bottlesDelivered,
        bottlesReturned,
        0
      );

      const updatedProd: Product = {
        ...bottleProd,
        inTransit: deliveredState.inTransit,
        stockEmpty: deliveredState.stockEmpty,
        updatedAt: new Date().toISOString(),
      };
      await dbStorage.put('products', updatedProd);

      const movement: StockMovement = {
        id: 'sm_' + Date.now(),
        productId: bottleProd.id,
        productName: bottleProd.name,
        movementType: 'delivery_delivered',
        fullDelta: 0, // already deducted at dispatch!
        emptyDelta: bottlesReturned,
        damagedDelta: 0,
        referenceId: order.id,
        referenceDoc: order.orderNumber,
        notes: `Delivered ${bottlesDelivered} bottles, retrieved ${bottlesReturned} empty bottles`,
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      await dbStorage.put('stock_movements', movement);
    }

    // Update customer bottle balance & outstanding money
    const netBottleChange = bottlesDelivered - bottlesReturned;
    const isPaymentComplete = paymentCollected >= order.netTotal;

    const updatedCust: Customer = {
      ...cust,
      bottlesHeld19L: Math.max(0, cust.bottlesHeld19L + netBottleChange),
      outstandingBalance: Math.max(0, cust.outstandingBalance - paymentCollected),
      updatedAt: new Date().toISOString(),
    };
    await dbStorage.put('customers', updatedCust);

    // If payment collected at doorstep, record Payment Receipt & Cash Ledger
    if (paymentCollected > 0) {
      const currentCash = cashLedger.length > 0 ? cashLedger[cashLedger.length - 1].balanceAfter : 20660;
      const receipt: PaymentReceipt = {
        id: 'pay_' + Date.now(),
        receiptNumber: `RCP-${payments.length + 2001}`,
        customerId: cust.id,
        customerName: cust.name,
        amount: paymentCollected,
        paymentMethod,
        allocatedOrderId: order.id,
        notes: `Doorstep payment collected by ${currentUser.name} for ${order.orderNumber}`,
        collectedByUserId: currentUser.id,
        collectedByName: currentUser.name,
        createdAt: new Date().toISOString(),
        synced: false,
      };
      await dbStorage.put('payments', receipt);

      const cashEntry: CashLedgerEntry = {
        id: 'cash_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'inflow',
        category: 'Customer Order Payment',
        amount: paymentCollected,
        balanceAfter: currentCash + paymentCollected,
        referenceType: 'payment_received',
        referenceId: receipt.id,
        description: `Doorstep payment for ${order.orderNumber} from ${cust.name}`,
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      await dbStorage.put('cash_ledger', cashEntry);
    }

    // Update order status
    const updatedOrder: Order = {
      ...order,
      status: 'delivered',
      paymentStatus: isPaymentComplete ? 'paid' : paymentCollected > 0 ? 'partial' : 'unpaid',
      paidAmount: order.paidAmount + paymentCollected,
      bottlesDelivered,
      bottlesReturned,
      updatedAt: new Date().toISOString(),
    };
    await dbStorage.put('orders', updatedOrder);

    await syncEngine.queueTransaction('order', 'update', updatedOrder);
    await logAudit(
      'Completed Delivery',
      'order',
      order.id,
      `Delivered ${bottlesDelivered} bottles, collected Rs. ${paymentCollected} (${paymentMethod})`
    );
    await reloadData();
  };

  // 7. Failed Delivery Trip (Criterion 6)
  const handleFailDelivery = async (
    orderId: string,
    fullBottlesReturned: number,
    reason: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !currentUser) return;

    const bottleProd = products.find((p) => p.isReusableBottle);

    // Restores full stock ONLY after confirmed returned quantities
    if (bottleProd) {
      const restored = processFailedDelivery(
        {
          stockFull: bottleProd.stockFull,
          stockEmpty: bottleProd.stockEmpty,
          stockDamaged: bottleProd.stockDamaged,
          inTransit: Math.max(fullBottlesReturned, bottleProd.inTransit),
        },
        fullBottlesReturned,
        0
      );

      const updatedProd: Product = {
        ...bottleProd,
        stockFull: restored.stockFull,
        inTransit: restored.inTransit,
        updatedAt: new Date().toISOString(),
      };
      await dbStorage.put('products', updatedProd);

      const movement: StockMovement = {
        id: 'sm_' + Date.now(),
        productId: bottleProd.id,
        productName: bottleProd.name,
        movementType: 'failed_return_full',
        fullDelta: fullBottlesReturned,
        emptyDelta: 0,
        damagedDelta: 0,
        referenceId: order.id,
        referenceDoc: order.orderNumber,
        notes: `Delivery failed: ${reason}. Restored ${fullBottlesReturned} full bottles to warehouse.`,
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      await dbStorage.put('stock_movements', movement);
    }

    const updatedOrder: Order = {
      ...order,
      status: 'failed',
      notes: `${order.notes || ''} [Trip Failed: ${reason}]`,
      updatedAt: new Date().toISOString(),
    };
    await dbStorage.put('orders', updatedOrder);

    await syncEngine.queueTransaction('order', 'update', updatedOrder);
    await logAudit('Delivery Failed', 'order', order.id, `Reason: ${reason}. ${fullBottlesReturned} bottles returned.`);
    await reloadData();
  };

  // 8. Record Payment (Criterion 7)
  const handleRecordPayment = async (payment: {
    customerId: string;
    amount: number;
    method: PaymentMethod;
    notes?: string;
    referenceNumber?: string;
  }) => {
    const cust = customers.find((c) => c.id === payment.customerId);
    if (!cust || !currentUser) return;

    const currentCash = cashLedger.length > 0 ? cashLedger[cashLedger.length - 1].balanceAfter : 20660;
    const impact = processPayment(currentCash, cust.outstandingBalance, payment.amount, false);

    const receipt: PaymentReceipt = {
      id: 'pay_' + Date.now(),
      receiptNumber: `RCP-${payments.length + 2001}`,
      customerId: cust.id,
      customerName: cust.name,
      amount: payment.amount,
      paymentMethod: payment.method,
      referenceNumber: payment.referenceNumber,
      notes: payment.notes,
      collectedByUserId: currentUser.id,
      collectedByName: currentUser.name,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    await dbStorage.put('payments', receipt);

    // Update customer outstanding balance
    const updatedCust: Customer = {
      ...cust,
      outstandingBalance: impact.newCustomerBalance,
      updatedAt: new Date().toISOString(),
    };
    await dbStorage.put('customers', updatedCust);

    // Update cash book
    const cashEntry: CashLedgerEntry = {
      id: 'cash_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'inflow',
      category: 'Customer Payment Receipt',
      amount: payment.amount,
      balanceAfter: impact.newCashBalance,
      referenceType: 'payment_received',
      referenceId: receipt.id,
      description: `Payment from ${cust.name} via ${payment.method}`,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    await dbStorage.put('cash_ledger', cashEntry);

    await syncEngine.queueTransaction('payment', 'insert', receipt);
    await logAudit(
      'Recorded Payment',
      'payment',
      receipt.id,
      `Received Rs. ${payment.amount} from ${cust.name} (${payment.method})`
    );
    await reloadData();
  };

  // 9. Record Promised Payment (Criterion 4)
  const handleRecordPromisedPayment = async (promise: {
    customerId: string;
    amount: number;
    promiseDate: string;
    notes?: string;
  }) => {
    const cust = customers.find((c) => c.id === promise.customerId);
    if (!cust || !currentUser) return;

    // Notice: Does NOT increase cash and does NOT decrease customer balance!
    const prom: PromisedPayment = {
      id: 'prom_' + Date.now(),
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      amount: promise.amount,
      promiseDate: promise.promiseDate,
      status: 'pending',
      notes: promise.notes,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    await dbStorage.put('promised_payments', prom);
    await syncEngine.queueTransaction('promised_payment', 'insert', prom);
    await logAudit(
      'Logged Promised Payment',
      'payment',
      prom.id,
      `Promise of Rs. ${promise.amount} on ${promise.promiseDate} by ${cust.name}`
    );
    await reloadData();
  };

  // Fulfill Promise
  const handleFulfillPromise = async (promiseId: string, collectedMethod: PaymentMethod) => {
    const prom = promisedPayments.find((p) => p.id === promiseId);
    if (!prom) return;

    // Fulfill promise by executing payment
    await handleRecordPayment({
      customerId: prom.customerId,
      amount: prom.amount,
      method: collectedMethod,
      notes: `Fulfilled promised payment from ${prom.promiseDate}`,
    });

    const updatedProm: PromisedPayment = {
      ...prom,
      status: 'fulfilled',
    };
    await dbStorage.put('promised_payments', updatedProm);
    await reloadData();
  };

  // 10. Record Expense (Criterion 8)
  const handleRecordExpense = async (expense: {
    category: ExpenseCategory;
    amount: number;
    paidTo: string;
    description: string;
    paymentMethod: 'cash' | 'bank_transfer';
  }) => {
    if (!currentUser) return;
    const currentCash = cashLedger.length > 0 ? cashLedger[cashLedger.length - 1].balanceAfter : 20660;
    const newCash = processExpense(currentCash, expense.amount);

    const exp: ExpenseRecord = {
      id: 'exp_' + Date.now(),
      category: expense.category,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      paidTo: expense.paidTo,
      description: expense.description,
      recordedBy: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      synced: false,
    };
    await dbStorage.put('expenses', exp);

    if (expense.paymentMethod === 'cash') {
      const cashEntry: CashLedgerEntry = {
        id: 'cash_' + Date.now(),
        date: exp.date,
        type: 'outflow',
        category: expense.category.replace('_', ' '),
        amount: expense.amount,
        balanceAfter: newCash,
        referenceType: 'expense',
        referenceId: exp.id,
        description: `${exp.description} (Paid to: ${exp.paidTo})`,
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      await dbStorage.put('cash_ledger', cashEntry);
    }

    await syncEngine.queueTransaction('expense', 'insert', exp);
    await logAudit(
      'Recorded Expense',
      'expense',
      exp.id,
      `Paid Rs. ${expense.amount} to ${expense.paidTo} for ${expense.category}`
    );
    await reloadData();
  };

  // 11. Google Drive Backup Creation (Criterion 12)
  const handleTriggerBackupNow = async () => {
    if (!currentUser) return;
    const { jsonString, record } = await GoogleDriveBackupService.createFullBackupBundle(currentUser.name);

    // Trigger instant download for device local storage
    GoogleDriveBackupService.downloadFile(jsonString, record.fileName, 'application/json');

    // Update settings last backup date
    if (settings) {
      const updatedSettings = { ...settings, lastBackupDate: record.timestamp };
      await dbStorage.put('settings', updatedSettings);
    }

    await logAudit('Google Drive Backup Created', 'backup', record.id, `Saved ${record.fileName} (SHA-256 verified)`);
    await reloadData();
  };

  // 12. Safe Restore from File (Criterion 13)
  const handleRestoreBackupFromFile = async (fileContent: string) => {
    if (!currentUser) return { success: false, message: 'Must be logged in to restore' };
    const res = await GoogleDriveBackupService.validateAndRestoreBackup(fileContent, currentUser.name);
    await reloadData();
    return res;
  };

  // CSV Exports
  const handleExportCustomerCSV = async () => {
    const csv = await GoogleDriveBackupService.exportCustomerLedgerCSV();
    GoogleDriveBackupService.downloadFile(csv, `BLUVIA_Customers_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportStockCSV = async () => {
    const csv = await GoogleDriveBackupService.exportStockLedgerCSV();
    GoogleDriveBackupService.downloadFile(csv, `BLUVIA_Stock_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportCashBookCSV = async () => {
    const csv = await GoogleDriveBackupService.exportCashBookCSV();
    GoogleDriveBackupService.downloadFile(csv, `BLUVIA_CashBook_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  // Staff and Settings Actions
  const handleCreateStaffUser = async (staff: {
    name: string;
    email: string;
    role: UserRole;
    phone: string;
    pin: string;
  }) => {
    const colors = ['#0284c7', '#0d9488', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];
    const newUser: UserProfile = {
      id: 'user_' + Date.now(),
      name: staff.name,
      email: staff.email,
      role: staff.role,
      phone: staff.phone,
      active: true,
      pin: staff.pin,
      avatarColor: colors[users.length % colors.length],
    };
    await dbStorage.put('users', newUser);
    await logAudit('Created Staff User', 'settings', newUser.id, `${newUser.name} assigned ${newUser.role}`);
    await reloadData();
  };

  const handleToggleUserActive = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const updated = { ...user, active: !user.active };
    await dbStorage.put('users', updated);
    await logAudit('User Status Toggled', 'settings', user.id, `Set active to ${updated.active}`);
    await reloadData();
  };

  const handleSaveSettings = async (newSettings: Partial<BusinessSettings>) => {
    if (!settings) return;
    const merged = { ...settings, ...newSettings };
    await dbStorage.put('settings', merged);
    setSettings(merged);
    await syncEngine.queueTransaction('settings' as any, 'update', merged);
    await logAudit(
      'Settings Updated',
      'settings',
      'business_settings',
      `Updated profile: ${merged.businessName} (Owner: ${merged.ownerName}, Logo: ${merged.logoUrl})`
    );
    await reloadData();
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <BluviaLogo
          size="2xl"
          variant="inverted-card"
          className="mb-4 shadow-2xl animate-pulse"
          logoUrl={settings?.logoUrl}
        />
        <h2 className="text-white font-black text-xl tracking-tight">BLUVIA Premium Drinking Water Fresh</h2>
        <p className="text-xs text-cyan-300 font-bold mt-1">
          Owner: Taqveem Ahsan Pasha • bluvia.pure@gmail.com
        </p>
        <p className="text-xs text-slate-400 mt-2">Initializing offline storage & ledger engine...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        settings={settings}
        users={users}
        onLogin={(u) => setCurrentUser(u)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Brand Header */}
      <Header
        currentUser={currentUser}
        users={users}
        settings={settings}
        onSwitchUser={(u) => setCurrentUser(u)}
        onLockSession={() => setCurrentUser(null)}
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingSyncCount={pendingSyncCount}
        onTriggerSync={async () => {
          await syncEngine.triggerSync();
          await reloadData();
        }}
        onOpenQuickAction={() => {
          setQuickModalType('order');
          setQuickModalOpen(true);
        }}
      />

      {/* Navigation (Desktop Tabs & Mobile Bar) */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            customers={customers}
            orders={orders}
            payments={payments}
            promisedPayments={promisedPayments}
            expenses={expenses}
            cashLedger={cashLedger}
            pendingSyncCount={pendingSyncCount}
            currentUser={currentUser}
            settings={settings}
            onOpenQuickAction={(type, prefillProdId) => {
              setQuickModalType(type || 'order');
              setQuickModalPrefillProdId(prefillProdId);
              setQuickModalOpen(true);
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'stock' && (
          <StockView
            products={products}
            suppliers={suppliers}
            stockMovements={stockMovements}
            currentUser={currentUser}
            onRecordStockPurchase={handleRecordStockPurchase}
            onRecordDamageOrAdjustment={handleRecordDamageOrAdjustment}
            onExportCSV={handleExportStockCSV}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            orders={orders}
            payments={payments}
            currentUser={currentUser}
            deliveryAreas={settings.deliveryAreas}
            settings={settings}
            onSaveCustomer={handleSaveCustomer}
            onExportCSV={handleExportCustomerCSV}
          />
        )}

        {activeTab === 'deliveries' && (
          <OrdersDeliveriesView
            orders={orders}
            products={products}
            customers={customers}
            users={users}
            currentUser={currentUser}
            deliveryAreas={settings.deliveryAreas}
            settings={settings}
            onCreateOrder={handleCreateOrder}
            onDispatchOrder={handleDispatchOrder}
            onCompleteDelivery={handleCompleteDelivery}
            onFailDelivery={handleFailDelivery}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView
            payments={payments}
            promisedPayments={promisedPayments}
            expenses={expenses}
            cashLedger={cashLedger}
            customers={customers}
            currentUser={currentUser}
            settings={settings}
            onRecordPayment={handleRecordPayment}
            onRecordPromisedPayment={handleRecordPromisedPayment}
            onFulfillPromise={handleFulfillPromise}
            onRecordExpense={handleRecordExpense}
            onExportCashBookCSV={handleExportCashBookCSV}
          />
        )}

        {activeTab === 'backup' && (
          <BackupSyncView
            backupRecords={backupRecords}
            outboxItems={outboxItems}
            currentUser={currentUser}
            isOnline={isOnline}
            isSyncing={isSyncing}
            onTriggerSync={async () => {
              await syncEngine.triggerSync();
              await reloadData();
            }}
            onTriggerBackupNow={handleTriggerBackupNow}
            onRestoreBackupFromFile={handleRestoreBackupFromFile}
            onExportCustomerCSV={handleExportCustomerCSV}
            onExportStockCSV={handleExportStockCSV}
            onExportCashBookCSV={handleExportCashBookCSV}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsStaffView
            settings={settings}
            users={users}
            auditLogs={auditLogs}
            currentUser={currentUser}
            onSaveSettings={handleSaveSettings}
            onCreateStaffUser={handleCreateStaffUser}
            onToggleUserActive={handleToggleUserActive}
          />
        )}
      </main>

      {/* Floating Action Modal for Rapid Offline Entry */}
      <QuickTransactionModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        products={products}
        customers={customers}
        currentUser={currentUser}
        initialType={quickModalType}
        initialProductId={quickModalPrefillProdId}
        onQuickOrder={async ({ customerId, quantity, cashPaid }) => {
          const bottleProd = products.find((p) => p.isReusableBottle) || products[0];
          await handleCreateOrder({
            customerId,
            items: [
              {
                productId: bottleProd.id,
                productName: bottleProd.name,
                quantity,
                unitPrice: bottleProd.unitPrice,
                total: quantity * bottleProd.unitPrice,
              },
            ],
            discount: 0,
            deliveryCharges: 0,
            deliveryDate: new Date().toISOString().split('T')[0],
            collectImmediateCash: cashPaid,
          });
        }}
        onQuickPayment={async ({ customerId, amount, method }) => {
          await handleRecordPayment({
            customerId,
            amount,
            method,
            notes: 'Quick collected payment',
          });
        }}
        onQuickStockIn={async ({ productId, quantity, unitCost }) => {
          const targetProd = (productId && products.find((p) => p.id === productId)) || products.find((p) => p.isReusableBottle) || products[0];
          const sup = suppliers[0];
          await handleRecordStockPurchase({
            productId: targetProd.id,
            supplierId: sup?.id || 'sup_1',
            quantity,
            unitCost,
            paidCash: true,
            notes: `Stock replenishment for ${targetProd.name}`,
          });
        }}
        onQuickExpense={async ({ amount, description, paidTo }) => {
          await handleRecordExpense({
            category: 'fuel',
            amount,
            paidTo,
            description,
            paymentMethod: 'cash',
          });
        }}
      />
    </div>
  );
}
