export type UserRole = 'owner' | 'manager' | 'cashier' | 'delivery';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  active: boolean;
  pin?: string;
  avatarColor: string;
}

export type ProductCategory = 'reusable_19l' | 'pet_bottles' | 'dispenser_accessories' | 'bulk_water';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  capacityLiters: number;
  unitPrice: number; // in PKR
  costPrice: number; // in PKR
  stockFull: number;
  stockEmpty: number;
  stockDamaged: number;
  inTransit: number;
  minStockLevel: number;
  isReusableBottle: boolean;
  updatedAt: string;
}

export type CustomerCategory = 'residential' | 'commercial' | 'corporate' | 'distributor';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  address: string;
  area: string;
  category: CustomerCategory;
  openingBalance: number;
  outstandingBalance: number;
  bottlesHeld19L: number;
  pricePerBottleOverride?: number;
  securityDepositBottles?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  balanceOwed: number;
  address: string;
  suppliedItems: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = 'pending' | 'dispatched' | 'delivered' | 'failed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  area: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharges: number;
  netTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  bottlesDelivered: number;
  bottlesReturned: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  deliveryDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export type PaymentMethod = 'cash' | 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'cheque';

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  allocatedOrderId?: string;
  referenceNumber?: string;
  notes?: string;
  collectedByUserId: string;
  collectedByName: string;
  createdAt: string;
  synced: boolean;
}

export interface PromisedPayment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  promiseDate: string;
  status: 'pending' | 'fulfilled' | 'overdue' | 'cancelled';
  notes?: string;
  recordedBy: string;
  createdAt: string;
  synced: boolean;
}

export type ExpenseCategory =
  | 'fuel'
  | 'vehicle_maintenance'
  | 'utility_power_water'
  | 'plant_filters_chemicals'
  | 'caps_seals_labels'
  | 'staff_salaries'
  | 'rent'
  | 'marketing'
  | 'miscellaneous';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer';
  paidTo: string;
  description: string;
  recordedBy: string;
  date: string;
  createdAt: string;
  synced: boolean;
}

export type StockMovementType =
  | 'purchase_receipt'
  | 'dispatch_out'
  | 'delivery_delivered'
  | 'empty_returned'
  | 'failed_return_full'
  | 'damaged_writeoff'
  | 'manual_adjustment';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: StockMovementType;
  fullDelta: number;
  emptyDelta: number;
  damagedDelta: number;
  referenceId?: string;
  referenceDoc?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface CashLedgerEntry {
  id: string;
  date: string;
  type: 'inflow' | 'outflow';
  category: string;
  amount: number;
  balanceAfter: number;
  referenceType: 'payment_received' | 'expense' | 'bank_deposit' | 'capital_injection' | 'opening';
  referenceId?: string;
  description: string;
  recordedBy: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  entityType: 'order' | 'payment' | 'stock' | 'customer' | 'expense' | 'settings' | 'backup';
  entityId: string;
  details: string;
  deviceId?: string;
}

export type SyncStatus = 'queued' | 'syncing' | 'synced' | 'failed' | 'conflict';

export interface OutboxSyncItem {
  id: string;
  idempotencyKey: string;
  entityType: 'order' | 'payment' | 'customer' | 'expense' | 'stock' | 'promised_payment';
  action: 'insert' | 'update' | 'delete';
  payload: any;
  status: SyncStatus;
  retryCount: number;
  error?: string;
  createdAt: string;
}

export interface BackupRecord {
  id: string;
  fileName: string;
  driveFileId?: string;
  folderName: string;
  recordCounts: {
    products: number;
    customers: number;
    orders: number;
    payments: number;
    expenses: number;
    stockMovements: number;
  };
  sizeBytes: number;
  checksum: string;
  timestamp: string;
  status: 'verified' | 'failed' | 'pending';
  initiatedBy: string;
  downloadUrl?: string;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  ownerName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  currency: string;
  currencySymbol: string;
  logoUrl?: string;
  taxRegistrationNumber?: string;
  defaultPrice19L: number;
  depositAmountPerBottle: number;
  minFullBottlesAlert: number;
  deliveryAreas: string[];
  autoBackupDaily: boolean;
  googleDriveFolderName: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  lastBackupDate?: string;
  lastSyncDate?: string;
}
