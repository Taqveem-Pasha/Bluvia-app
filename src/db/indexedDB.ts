import {
  Product,
  Customer,
  Supplier,
  Order,
  PaymentReceipt,
  PromisedPayment,
  ExpenseRecord,
  StockMovement,
  CashLedgerEntry,
  AuditLogEntry,
  OutboxSyncItem,
  BackupRecord,
  BusinessSettings,
  UserProfile,
} from '../types';

const DB_NAME = 'bluvia_water_db';
const DB_VERSION = 2;

const STORES = [
  'products',
  'customers',
  'suppliers',
  'orders',
  'payments',
  'promised_payments',
  'expenses',
  'stock_movements',
  'cash_ledger',
  'audit_log',
  'outbox_sync',
  'backup_records',
  'settings',
  'users',
] as const;

export type StoreName = (typeof STORES)[number];

// Initial Seed Data for BLUVIA Premium Drinking Water Fresh
const SEED_USERS: UserProfile[] = [
  {
    id: 'usr_owner_1',
    name: 'Taqveem Ahsan Pasha',
    email: 'bluvia.pure@gmail.com',
    role: 'owner',
    phone: '+92 300 8547219',
    active: true,
    avatarColor: '#0284c7',
  },
  {
    id: 'usr_mgr_1',
    name: 'Tariq Mehmood',
    email: 'tariq.bluvia@gmail.com',
    role: 'manager',
    phone: '+92 333 5124981',
    active: true,
    avatarColor: '#0d9488',
  },
  {
    id: 'usr_cashier_1',
    name: 'Usman Ali',
    email: 'usman.bluvia@gmail.com',
    role: 'cashier',
    phone: '+92 321 9874521',
    active: true,
    avatarColor: '#10b981',
  },
  {
    id: 'usr_delivery_1',
    name: 'Bilal Ahmad',
    email: 'bilal.delivery@gmail.com',
    role: 'delivery',
    phone: '+92 345 6127890',
    active: true,
    avatarColor: '#f59e0b',
  },
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_19l_poly',
    name: '19-Liter Polycarbonate Premium Water Bottle',
    category: 'reusable_19l',
    capacityLiters: 19,
    unitPrice: 180,
    costPrice: 45,
    stockFull: 35, // Low stock: below minStockLevel of 50
    stockEmpty: 85,
    stockDamaged: 4,
    inTransit: 22,
    minStockLevel: 50,
    isReusableBottle: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_pet_1500ml',
    name: '1.5-Liter PET Drinking Water (Carton of 6)',
    category: 'pet_bottles',
    capacityLiters: 9,
    unitPrice: 320,
    costPrice: 190,
    stockFull: 12, // Low stock: below minStockLevel of 30
    stockEmpty: 0,
    stockDamaged: 0,
    inTransit: 6,
    minStockLevel: 30,
    isReusableBottle: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_pet_500ml',
    name: '500ml Mini Mineral Bottles (Carton of 12)',
    category: 'pet_bottles',
    capacityLiters: 6,
    unitPrice: 360,
    costPrice: 210,
    stockFull: 65, // Healthy stock
    stockEmpty: 0,
    stockDamaged: 1,
    inTransit: 10,
    minStockLevel: 25,
    isReusableBottle: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_dispenser_hotcold',
    name: 'Electric Hot & Cold Floor Dispenser',
    category: 'dispenser_accessories',
    capacityLiters: 0,
    unitPrice: 28500,
    costPrice: 22000,
    stockFull: 2, // Low stock: below minStockLevel of 5
    stockEmpty: 0,
    stockDamaged: 0,
    inTransit: 0,
    minStockLevel: 5,
    isReusableBottle: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_manual_pump',
    name: 'Manual Bottle Hand Action Pump',
    category: 'dispenser_accessories',
    capacityLiters: 0,
    unitPrice: 650,
    costPrice: 380,
    stockFull: 22, // Healthy stock
    stockEmpty: 0,
    stockDamaged: 0,
    inTransit: 2,
    minStockLevel: 10,
    isReusableBottle: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_bulk_1000l',
    name: 'Bulk Commercial Tanker Refill (1000 Liters)',
    category: 'bulk_water',
    capacityLiters: 1000,
    unitPrice: 3500,
    costPrice: 1200,
    stockFull: 1, // Low stock: below minStockLevel of 2
    stockEmpty: 0,
    stockDamaged: 0,
    inTransit: 0,
    minStockLevel: 2,
    isReusableBottle: false,
    updatedAt: new Date().toISOString(),
  },
];

const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    name: 'Al-Hadeed Caps & Bottles Industries',
    company: 'Al-Hadeed Polymers Pvt Ltd',
    phone: '+92 51 4432190',
    balanceOwed: 28500,
    address: 'Plot 12, I-9 Industrial Area, Islamabad',
    suppliedItems: '19L Polycarbonate Bottles, Food-grade caps & shrink seals',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sup_2',
    name: 'Pak Pure Filter Systems',
    company: 'Pak Water Technology',
    phone: '+92 51 2281944',
    balanceOwed: 14200,
    address: 'Saddar, Rawalpindi Cantt',
    suppliedItems: 'RO membranes, Micron sediment cartridges, Mineral balancing salts',
    updatedAt: new Date().toISOString(),
  },
];

const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Sardar Tahir Iqbal',
    phone: '0301-5582910',
    whatsapp: '0301-5582910',
    address: 'House 42, Street 8, Sector F-7/2',
    area: 'F-6 / F-7 / F-8 Sectors',
    category: 'residential',
    openingBalance: 0,
    outstandingBalance: 720,
    bottlesHeld19L: 4,
    pricePerBottleOverride: 180,
    securityDepositBottles: 3200,
    notes: 'Gate buzzer on right side. Leave bottles in porch.',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
    synced: true,
  },
  {
    id: 'cust_2',
    name: 'Dr. Ayesha Malik Dental Clinic',
    phone: '0333-5192844',
    whatsapp: '0333-5192844',
    address: 'Plaza 14, Civic Center, Phase 4, Bahria Town',
    area: 'Bahria Town Phase 4 & 7',
    category: 'commercial',
    openingBalance: 0,
    outstandingBalance: 1440,
    bottlesHeld19L: 8,
    pricePerBottleOverride: 180,
    securityDepositBottles: 6400,
    notes: 'Deliver before 11:00 AM. Cash payment on delivery.',
    createdAt: '2026-09-05T09:30:00.000Z',
    updatedAt: new Date().toISOString(),
    synced: true,
  },
  {
    id: 'cust_3',
    name: 'Beaconhouse School System - Senior Branch',
    phone: '051-5782910',
    whatsapp: '0321-4829103',
    address: 'Main Boulevard, Sector B, DHA Phase 2',
    area: 'DHA Phase 2 & 5',
    category: 'corporate',
    openingBalance: 0,
    outstandingBalance: 5400,
    bottlesHeld19L: 25,
    pricePerBottleOverride: 160,
    securityDepositBottles: 20000,
    notes: 'Monthly corporate invoice. Delivery on Mondays & Thursdays.',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
    synced: true,
  },
  {
    id: 'cust_4',
    name: 'Chaudhry General Store & Mart',
    phone: '0345-5928174',
    address: 'Shop 3, Commercial Market, Gulberg Residencia',
    area: 'Gulberg Greens & Residencia',
    category: 'distributor',
    openingBalance: 0,
    outstandingBalance: 3600,
    bottlesHeld19L: 18,
    pricePerBottleOverride: 150,
    securityDepositBottles: 14400,
    notes: 'Wholesale retailer. Exchanging empties daily.',
    createdAt: '2026-09-10T11:00:00.000Z',
    updatedAt: new Date().toISOString(),
    synced: true,
  },
  {
    id: 'cust_5',
    name: 'Engr. Kamran Siddiqui',
    phone: '0312-5819283',
    address: 'House 118, Street 14, Sector I-8/3',
    area: 'I-8 & I-9 Commercial',
    category: 'residential',
    openingBalance: 0,
    outstandingBalance: 0,
    bottlesHeld19L: 3,
    pricePerBottleOverride: 180,
    securityDepositBottles: 2400,
    notes: 'Regular on-demand caller. Always prompt payment via JazzCash.',
    createdAt: '2026-09-20T12:00:00.000Z',
    updatedAt: new Date().toISOString(),
    synced: true,
  },
];

const todayStr = new Date().toISOString().split('T')[0];

const SEED_ORDERS: Order[] = [
  {
    id: 'ord_1001',
    orderNumber: 'ORD-1001',
    customerId: 'cust_1',
    customerName: 'Sardar Tahir Iqbal',
    area: 'F-6 / F-7 / F-8 Sectors',
    items: [
      {
        productId: 'prod_19l_poly',
        productName: '19-Liter Polycarbonate Premium Water Bottle',
        quantity: 3,
        unitPrice: 180,
        total: 540,
      },
    ],
    subtotal: 540,
    discount: 0,
    deliveryCharges: 0,
    netTotal: 540,
    status: 'delivered',
    paymentStatus: 'paid',
    paidAmount: 540,
    bottlesDelivered: 3,
    bottlesReturned: 3,
    assignedStaffId: 'usr_delivery_1',
    assignedStaffName: 'Bilal Ahmad',
    deliveryDate: todayStr,
    notes: 'Standard morning delivery',
    createdBy: 'Rashid Farooq',
    createdAt: `${todayStr}T08:15:00.000Z`,
    updatedAt: `${todayStr}T09:30:00.000Z`,
    synced: true,
  },
  {
    id: 'ord_1002',
    orderNumber: 'ORD-1002',
    customerId: 'cust_2',
    customerName: 'Dr. Ayesha Malik Dental Clinic',
    area: 'Bahria Town Phase 4 & 7',
    items: [
      {
        productId: 'prod_19l_poly',
        productName: '19-Liter Polycarbonate Premium Water Bottle',
        quantity: 4,
        unitPrice: 180,
        total: 720,
      },
    ],
    subtotal: 720,
    discount: 0,
    deliveryCharges: 0,
    netTotal: 720,
    status: 'dispatched',
    paymentStatus: 'unpaid',
    paidAmount: 0,
    bottlesDelivered: 0,
    bottlesReturned: 0,
    assignedStaffId: 'usr_delivery_1',
    assignedStaffName: 'Bilal Ahmad',
    deliveryDate: todayStr,
    notes: 'Van 1 on route',
    createdBy: 'Tariq Mehmood',
    createdAt: `${todayStr}T09:00:00.000Z`,
    updatedAt: `${todayStr}T09:45:00.000Z`,
    synced: true,
  },
  {
    id: 'ord_1003',
    orderNumber: 'ORD-1003',
    customerId: 'cust_4',
    customerName: 'Chaudhry General Store & Mart',
    area: 'Gulberg Greens & Residencia',
    items: [
      {
        productId: 'prod_19l_poly',
        productName: '19-Liter Polycarbonate Premium Water Bottle',
        quantity: 10,
        unitPrice: 150,
        total: 1500,
      },
      {
        productId: 'prod_pet_1500ml',
        productName: '1.5-Liter PET Drinking Water (Carton of 6)',
        quantity: 2,
        unitPrice: 320,
        total: 640,
      },
    ],
    subtotal: 2140,
    discount: 40,
    deliveryCharges: 0,
    netTotal: 2100,
    status: 'pending',
    paymentStatus: 'unpaid',
    paidAmount: 0,
    bottlesDelivered: 0,
    bottlesReturned: 0,
    deliveryDate: todayStr,
    notes: 'Pack order for afternoon route',
    createdBy: 'Usman Ali',
    createdAt: `${todayStr}T10:30:00.000Z`,
    updatedAt: `${todayStr}T10:30:00.000Z`,
    synced: true,
  },
];

const SEED_PAYMENTS: PaymentReceipt[] = [
  {
    id: 'pay_101',
    receiptNumber: 'REC-101',
    customerId: 'cust_1',
    customerName: 'Sardar Tahir Iqbal',
    amount: 540,
    paymentMethod: 'cash',
    allocatedOrderId: 'ord_1001',
    notes: 'Cash received on delivery',
    collectedByUserId: 'usr_delivery_1',
    collectedByName: 'Bilal Ahmad',
    createdAt: `${todayStr}T09:30:00.000Z`,
    synced: true,
  },
];

const SEED_PROMISED_PAYMENTS: PromisedPayment[] = [
  {
    id: 'prom_1',
    customerId: 'cust_2',
    customerName: 'Dr. Ayesha Malik Dental Clinic',
    customerPhone: '0333-5192844',
    amount: 1440,
    promiseDate: '2026-10-18', // Yesterday: Overdue!
    status: 'pending',
    notes: 'Accountant was on leave yesterday. Call this morning.',
    recordedBy: 'Tariq Mehmood',
    createdAt: '2026-10-14T10:00:00.000Z',
    synced: true,
  },
  {
    id: 'prom_2',
    customerId: 'cust_3',
    customerName: 'Beaconhouse School System - Senior Branch',
    customerPhone: '051-5782910',
    amount: 5400,
    promiseDate: '2026-10-25',
    status: 'pending',
    notes: 'Monthly consolidated cheque cycle',
    recordedBy: 'Rashid Farooq',
    createdAt: '2026-10-15T11:00:00.000Z',
    synced: true,
  },
];

const SEED_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp_1',
    category: 'fuel',
    amount: 2500,
    paymentMethod: 'cash',
    paidTo: 'Total Parco Filling Station, Islamabad Highway',
    description: 'Suzuki Bolan Delivery Van Fuel Refill (Petrol 9 litres)',
    recordedBy: 'Bilal Ahmad',
    date: todayStr,
    createdAt: `${todayStr}T08:00:00.000Z`,
    synced: true,
  },
  {
    id: 'exp_2',
    category: 'caps_seals_labels',
    amount: 4800,
    paymentMethod: 'cash',
    paidTo: 'Al-Hadeed Polymers',
    description: '500x Food-grade bottle caps with heat-shrink tamper security seals',
    recordedBy: 'Tariq Mehmood',
    date: todayStr,
    createdAt: `${todayStr}T09:15:00.000Z`,
    synced: true,
  },
];

const SEED_CASH_LEDGER: CashLedgerEntry[] = [
  {
    id: 'cash_0',
    date: '2026-10-18',
    type: 'inflow',
    category: 'Opening Register Cash',
    amount: 25000,
    balanceAfter: 25000,
    referenceType: 'opening',
    description: 'Opening register cash for business week',
    recordedBy: 'Rashid Farooq',
    createdAt: '2026-10-18T07:00:00.000Z',
  },
  {
    id: 'cash_1',
    date: todayStr,
    type: 'outflow',
    category: 'Fuel Expense',
    amount: 2500,
    balanceAfter: 22500,
    referenceType: 'expense',
    referenceId: 'exp_1',
    description: 'Van fuel reimbursement',
    recordedBy: 'Bilal Ahmad',
    createdAt: `${todayStr}T08:00:00.000Z`,
  },
  {
    id: 'cash_2',
    date: todayStr,
    type: 'outflow',
    category: 'Packaging Expense',
    amount: 4800,
    balanceAfter: 17700,
    referenceType: 'expense',
    referenceId: 'exp_2',
    description: 'Caps and seals replenishment',
    recordedBy: 'Tariq Mehmood',
    createdAt: `${todayStr}T09:15:00.000Z`,
  },
  {
    id: 'cash_3',
    date: todayStr,
    type: 'inflow',
    category: 'Payment Collected',
    amount: 540,
    balanceAfter: 18240,
    referenceType: 'payment_received',
    referenceId: 'pay_101',
    description: 'Cash payment from Sardar Tahir Iqbal',
    recordedBy: 'Bilal Ahmad',
    createdAt: `${todayStr}T09:30:00.000Z`,
  },
];

const SEED_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm_1',
    productId: 'prod_19l_poly',
    productName: '19-Liter Polycarbonate Premium Water Bottle',
    movementType: 'dispatch_out',
    fullDelta: -4,
    emptyDelta: 0,
    damagedDelta: 0,
    referenceId: 'ord_1002',
    referenceDoc: 'ORD-1002',
    notes: 'Dispatched 4 bottles with driver Bilal',
    recordedBy: 'Tariq Mehmood',
    createdAt: `${todayStr}T09:00:00.000Z`,
  },
  {
    id: 'sm_2',
    productId: 'prod_19l_poly',
    productName: '19-Liter Polycarbonate Premium Water Bottle',
    movementType: 'delivery_delivered',
    fullDelta: 0,
    emptyDelta: 3,
    damagedDelta: 0,
    referenceId: 'ord_1001',
    referenceDoc: 'ORD-1001',
    notes: 'Delivered 3 full, returned 3 clean empties from customer Sardar Tahir',
    recordedBy: 'Bilal Ahmad',
    createdAt: `${todayStr}T09:30:00.000Z`,
  },
];

const SEED_SETTINGS: BusinessSettings = {
  id: 'business_settings',
  businessName: 'BLUVIA Premium Drinking Water Fresh',
  ownerName: 'Taqveem Ahsan Pasha',
  tagline: 'Pure, Mineral Balanced & Freshly Delivered to Your Doorstep',
  phone: '+92 300 8547219',
  email: 'bluvia.pure@gmail.com',
  address: 'Plot 48, Industrial Triangle, Kahuta Road, Islamabad',
  city: 'Islamabad / Rawalpindi',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  logoUrl: '/bluvia-logo.png',
  taxRegistrationNumber: 'NTN: 8192044-7',
  defaultPrice19L: 180,
  depositAmountPerBottle: 800,
  minFullBottlesAlert: 50,
  deliveryAreas: [
    'DHA Phase 2 & 5',
    'Bahria Town Phase 4 & 7',
    'Gulberg Greens & Residencia',
    'F-6 / F-7 / F-8 Sectors',
    'I-8 & I-9 Commercial',
    'Saddar Rawalpindi',
  ],
  autoBackupDaily: true,
  googleDriveFolderName: 'BLUVIA Business Backups',
  lastBackupDate: `${todayStr}T06:00:00.000Z`,
};

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback: Map<string, Map<string, any>> = new Map();

  constructor() {
    STORES.forEach((s) => this.memoryFallback.set(s, new Map()));
    this.seedFallbackMemory();
  }

  private seedFallbackMemory() {
    SEED_USERS.forEach((u) => this.memoryFallback.get('users')?.set(u.id, u));
    SEED_PRODUCTS.forEach((p) => this.memoryFallback.get('products')?.set(p.id, p));
    SEED_SUPPLIERS.forEach((s) => this.memoryFallback.get('suppliers')?.set(s.id, s));
    SEED_CUSTOMERS.forEach((c) => this.memoryFallback.get('customers')?.set(c.id, c));
    SEED_ORDERS.forEach((o) => this.memoryFallback.get('orders')?.set(o.id, o));
    SEED_PAYMENTS.forEach((p) => this.memoryFallback.get('payments')?.set(p.id, p));
    SEED_PROMISED_PAYMENTS.forEach((p) => this.memoryFallback.get('promised_payments')?.set(p.id, p));
    SEED_EXPENSES.forEach((e) => this.memoryFallback.get('expenses')?.set(e.id, e));
    SEED_CASH_LEDGER.forEach((c) => this.memoryFallback.get('cash_ledger')?.set(c.id, c));
    SEED_STOCK_MOVEMENTS.forEach((s) => this.memoryFallback.get('stock_movements')?.set(s.id, s));
    this.memoryFallback.get('settings')?.set(SEED_SETTINGS.id, SEED_SETTINGS);
  }

  private isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable()) {
      return Promise.reject(new Error('IndexedDB not supported in this runtime.'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        STORES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            if (storeName === 'outbox_sync') {
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }
          }
        });
      };

      request.onsuccess = async () => {
        const db = request.result;
        await this.ensureSeedData(db);
        resolve(db);
      };

      request.onerror = () => {
        console.warn('Failed to open IndexedDB, falling back to memory storage');
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async ensureSeedData(db: IDBDatabase) {
    try {
      const tx = db.transaction(['products', 'settings', 'users', 'customers', 'suppliers', 'orders', 'payments', 'promised_payments', 'expenses', 'cash_ledger', 'stock_movements'], 'readwrite');
      const prodStore = tx.objectStore('products');
      const countReq = prodStore.count();

      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          SEED_USERS.forEach((u) => tx.objectStore('users').put(u));
          SEED_PRODUCTS.forEach((p) => tx.objectStore('products').put(p));
          SEED_SUPPLIERS.forEach((s) => tx.objectStore('suppliers').put(s));
          SEED_CUSTOMERS.forEach((c) => tx.objectStore('customers').put(c));
          SEED_ORDERS.forEach((o) => tx.objectStore('orders').put(o));
          SEED_PAYMENTS.forEach((p) => tx.objectStore('payments').put(p));
          SEED_PROMISED_PAYMENTS.forEach((p) => tx.objectStore('promised_payments').put(p));
          SEED_EXPENSES.forEach((e) => tx.objectStore('expenses').put(e));
          SEED_CASH_LEDGER.forEach((c) => tx.objectStore('cash_ledger').put(c));
          SEED_STOCK_MOVEMENTS.forEach((s) => tx.objectStore('stock_movements').put(s));
          tx.objectStore('settings').put(SEED_SETTINGS);
        } else {
          // Non-destructive update for settings & owner profile
          const settingsStore = tx.objectStore('settings');
          const getSettingsReq = settingsStore.get('business_settings');
          getSettingsReq.onsuccess = () => {
            const current = getSettingsReq.result as BusinessSettings | undefined;
            if (current) {
              let changed = false;
              if (!current.ownerName || current.ownerName === 'Rashid Farooq') {
                current.ownerName = 'Taqveem Ahsan Pasha';
                changed = true;
              }
              if (!current.logoUrl) {
                current.logoUrl = '/bluvia-logo.png';
                changed = true;
              }
              if (current.email !== 'bluvia.pure@gmail.com') {
                current.email = 'bluvia.pure@gmail.com';
                changed = true;
              }
              if (changed) {
                settingsStore.put(current);
              }
            } else {
              settingsStore.put(SEED_SETTINGS);
            }
          };

          const usersStore = tx.objectStore('users');
          const getOwnerReq = usersStore.get('usr_owner_1');
          getOwnerReq.onsuccess = () => {
            const owner = getOwnerReq.result as UserProfile | undefined;
            if (owner && (owner.name === 'Rashid Farooq' || !owner.name)) {
              owner.name = 'Taqveem Ahsan Pasha';
              owner.email = 'bluvia.pure@gmail.com';
              usersStore.put(owner);
            }
          };
        }
      };
    } catch {
      // Transaction might fail in restricted iframe mode
    }
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise<T[]>((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => resolve(Array.from(this.memoryFallback.get(storeName)?.values() || []));
      });
    } catch {
      return Array.from(this.memoryFallback.get(storeName)?.values() || []);
    }
  }

  public async get<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    try {
      const db = await this.getDB();
      return new Promise<T | undefined>((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => resolve(this.memoryFallback.get(storeName)?.get(id));
      });
    } catch {
      return this.memoryFallback.get(storeName)?.get(id);
    }
  }

  public async getById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    return this.get<T>(storeName, id);
  }

  public async put<T extends { id: string }>(storeName: StoreName, value: T): Promise<void> {
    this.memoryFallback.get(storeName)?.set(value.id, value);
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback updated
    }
  }

  public async putBatch<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
    items.forEach((item) => this.memoryFallback.get(storeName)?.set(item.id, item));
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        items.forEach((item) => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback updated
    }
  }

  public async delete(storeName: StoreName, id: string): Promise<void> {
    this.memoryFallback.get(storeName)?.delete(id);
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback updated
    }
  }

  public async clear(storeName: StoreName): Promise<void> {
    this.memoryFallback.get(storeName)?.clear();
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback updated
    }
  }

  public async getPendingOutbox(): Promise<OutboxSyncItem[]> {
    const all = await this.getAll<OutboxSyncItem>('outbox_sync');
    return all.filter((i) => i.status === 'queued' || i.status === 'failed');
  }

  public async enqueueOutbox(item: OutboxSyncItem): Promise<void> {
    await this.put('outbox_sync', item);
  }

  public async markOutboxSynced(id: string): Promise<void> {
    const item = await this.get<OutboxSyncItem>('outbox_sync', id);
    if (item) {
      item.status = 'synced';
      await this.put('outbox_sync', item);
    }
  }
}

export const dbStorage = new IndexedDBStorage();
