/**
 * Pure calculation logic for BLUVIA Water Business Manager.
 * Decoupled from UI and external dependencies to enable native node:test verification.
 */

export interface OrderItemCalc {
  quantity: number;
  unitPrice: number;
}

export interface SaleCalculationResult {
  subtotal: number;
  discount: number;
  deliveryCharges: number;
  netTotal: number;
}

/**
 * Calculates sale total:
 * Sale total = quantity × unit price − discount + delivery charges.
 */
export function calculateSaleTotal(
  items: OrderItemCalc[],
  discount: number = 0,
  deliveryCharges: number = 0
): SaleCalculationResult {
  const subtotal = items.reduce((acc, item) => acc + (Math.max(0, item.quantity) * Math.max(0, item.unitPrice)), 0);
  const cleanDiscount = Math.max(0, discount);
  const cleanDelivery = Math.max(0, deliveryCharges);
  const netTotal = Math.max(0, subtotal - cleanDiscount + cleanDelivery);

  return {
    subtotal,
    discount: cleanDiscount,
    deliveryCharges: cleanDelivery,
    netTotal,
  };
}

/**
 * Customer outstanding balance:
 * Customer outstanding balance = opening balance + new charges − allocated payments − applicable credits and adjustments.
 */
export function calculateCustomerBalance(
  openingBalance: number,
  newCharges: number,
  allocatedPayments: number,
  creditsAndAdjustments: number = 0
): number {
  return openingBalance + newCharges - allocatedPayments - creditsAndAdjustments;
}

/**
 * Cash balance:
 * Cash balance = opening cash + actual cash received − cash expenses and other cash payments.
 */
export function calculateCashBalance(
  openingCash: number,
  actualCashReceived: number,
  cashExpenses: number,
  otherTransfersOut: number = 0
): number {
  return openingCash + actualCashReceived - cashExpenses - otherTransfersOut;
}

/**
 * Stock inventory state for reusable water bottles.
 */
export interface BottleStockState {
  stockFull: number;
  stockEmpty: number;
  stockDamaged: number;
  inTransit: number;
}

/**
 * Process purchase of bottles: increases stockFull by purchase quantity.
 */
export function processStockPurchase(
  currentStock: BottleStockState,
  purchasedFullQty: number
): BottleStockState {
  if (purchasedFullQty < 0) throw new Error("Purchase quantity cannot be negative");
  return {
    ...currentStock,
    stockFull: currentStock.stockFull + purchasedFullQty,
  };
}

/**
 * Process dispatch for delivery trip:
 * Moves bottles from stockFull into inTransit.
 */
export function processOrderDispatch(
  currentStock: BottleStockState,
  dispatchQty: number
): BottleStockState {
  if (dispatchQty <= 0) return currentStock;
  if (currentStock.stockFull < dispatchQty) {
    throw new Error(`Insufficient full bottles in stock. Available: ${currentStock.stockFull}, Requested: ${dispatchQty}`);
  }
  return {
    ...currentStock,
    stockFull: currentStock.stockFull - dispatchQty,
    inTransit: currentStock.inTransit + dispatchQty,
  };
}

/**
 * Completing delivery:
 * If stock is deducted at dispatch, completing delivery must NOT deduct full stock a second time.
 * It clears inTransit and records returned empty bottles.
 */
export function processDeliveryCompletion(
  currentStock: BottleStockState,
  deliveredQty: number,
  emptyBottlesReturned: number = 0,
  damagedBottles: number = 0
): BottleStockState {
  if (deliveredQty < 0) throw new Error("Delivered quantity cannot be negative");
  if (currentStock.inTransit < deliveredQty) {
    throw new Error("Delivered quantity exceeds quantity in transit");
  }

  return {
    ...currentStock,
    inTransit: currentStock.inTransit - deliveredQty,
    stockEmpty: currentStock.stockEmpty + Math.max(0, emptyBottlesReturned),
    stockDamaged: currentStock.stockDamaged + Math.max(0, damagedBottles),
  };
}

/**
 * Failed delivery:
 * Restores full stock ONLY after returned full quantities are confirmed.
 */
export function processFailedDelivery(
  currentStock: BottleStockState,
  confirmedReturnedFullQty: number,
  unaccountedOrDamagedQty: number = 0
): BottleStockState {
  if (confirmedReturnedFullQty < 0) throw new Error("Returned quantity cannot be negative");
  if (currentStock.inTransit < (confirmedReturnedFullQty + unaccountedOrDamagedQty)) {
    throw new Error("Returned plus damaged quantity exceeds stock in transit");
  }

  return {
    ...currentStock,
    stockFull: currentStock.stockFull + confirmedReturnedFullQty,
    stockDamaged: currentStock.stockDamaged + unaccountedOrDamagedQty,
    inTransit: currentStock.inTransit - (confirmedReturnedFullQty + unaccountedOrDamagedQty),
  };
}

/**
 * Process payment calculation:
 * Distinguishes between actual Cash Receipt vs Promised Payment.
 * A promised payment does NOT increase cash and does NOT reduce the customer balance.
 */
export interface PaymentImpactResult {
  newCashBalance: number;
  newCustomerBalance: number;
  isCashIncremented: boolean;
  isCustomerBalanceReduced: boolean;
}

export function processPayment(
  currentCashBalance: number,
  customerOutstandingBalance: number,
  amount: number,
  isPromisedPayment: boolean
): PaymentImpactResult {
  if (isPromisedPayment) {
    // Promised payments are NOT cash receipts and do NOT affect ledger balances until collected
    return {
      newCashBalance: currentCashBalance,
      newCustomerBalance: customerOutstandingBalance,
      isCashIncremented: false,
      isCustomerBalanceReduced: false,
    };
  }

  const cleanAmount = Math.max(0, amount);
  return {
    newCashBalance: currentCashBalance + cleanAmount,
    newCustomerBalance: Math.max(0, customerOutstandingBalance - cleanAmount),
    isCashIncremented: true,
    isCustomerBalanceReduced: true,
  };
}

/**
 * Process Cash Expense:
 * Directly reduces cash balance.
 */
export function processExpense(
  currentCashBalance: number,
  expenseAmount: number
): number {
  if (expenseAmount < 0) throw new Error("Expense amount cannot be negative");
  return currentCashBalance - expenseAmount;
}

/**
 * Deduplicate synchronization items based on idempotency key.
 */
export interface SyncQueueRecord {
  id: string;
  idempotencyKey: string;
  timestamp: number;
  version?: number;
}

export function deduplicateSyncBatch<T extends SyncQueueRecord>(
  existingKeys: Set<string>,
  incomingBatch: T[]
): { toApply: T[]; duplicatesIgnored: number } {
  const toApply: T[] = [];
  let duplicatesIgnored = 0;

  for (const item of incomingBatch) {
    if (existingKeys.has(item.idempotencyKey)) {
      duplicatesIgnored++;
    } else {
      existingKeys.add(item.idempotencyKey);
      toApply.push(item);
    }
  }

  return { toApply, duplicatesIgnored };
}

/**
 * Backup payload integrity verification.
 */
export interface BackupPayload {
  version: string;
  businessName: string;
  timestamp: string;
  checksum: string;
  data: {
    products?: any[];
    customers?: any[];
    orders?: any[];
    payments?: any[];
    expenses?: any[];
    stockMovements?: any[];
  };
}

export function validateBackupPayload(payload: any): { valid: boolean; reason?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, reason: "Backup payload is not a valid JSON object" };
  }
  if (!payload.businessName || !payload.businessName.includes("BLUVIA")) {
    return { valid: false, reason: "Backup does not belong to BLUVIA Water Business" };
  }
  if (!payload.version) {
    return { valid: false, reason: "Missing backup schema version" };
  }
  if (!payload.data || typeof payload.data !== 'object') {
    return { valid: false, reason: "Missing backup data records" };
  }
  return { valid: true };
}

/**
 * Low Stock Analysis and Reorder Calculations
 */
export interface ProductStockInfo {
  id: string;
  name: string;
  stockFull: number;
  minStockLevel: number;
  costPrice?: number;
  unitPrice?: number;
  category?: string;
  isReusableBottle?: boolean;
  stockEmpty?: number;
}

export interface LowStockItemResult {
  product: ProductStockInfo;
  isLowStock: boolean;
  isOutOfStock: boolean;
  thresholdUsed: number;
  deficit: number;
  recommendedReorderQty: number;
  estimatedRestockCost: number;
  stockLevelPercent: number; // percentage of buffer threshold held (e.g. 50% = half of buffer)
}

/**
 * Evaluates whether a product is below threshold and calculates reorder metrics.
 * Uses product.minStockLevel by default, or an explicitly provided customThreshold.
 */
export function evaluateProductStock(
  product: ProductStockInfo,
  customThreshold?: number
): LowStockItemResult {
  const threshold = customThreshold !== undefined ? Math.max(0, customThreshold) : Math.max(0, product.minStockLevel);
  const stockFull = Math.max(0, product.stockFull);
  const isOutOfStock = stockFull === 0;
  const isLowStock = stockFull <= threshold;

  // Deficit to reach safety buffer (threshold)
  const deficit = Math.max(0, threshold - stockFull);
  // Recommend reordering up to 1.5x buffer (safety stock) or at least deficit
  const recommendedReorderQty = isLowStock ? Math.max(deficit, Math.ceil(threshold * 1.5 - stockFull)) : 0;
  const unitCost = product.costPrice || 0;
  const estimatedRestockCost = recommendedReorderQty * unitCost;
  const stockLevelPercent = threshold > 0 ? Math.round((stockFull / threshold) * 100) : 100;

  return {
    product,
    isLowStock,
    isOutOfStock,
    thresholdUsed: threshold,
    deficit,
    recommendedReorderQty,
    estimatedRestockCost,
    stockLevelPercent,
  };
}

/**
 * Scans a list of products and returns highlighted low-stock items with aggregated reorder statistics.
 */
export function detectLowStockProducts(
  products: ProductStockInfo[],
  customThreshold?: number
): {
  lowStockItems: LowStockItemResult[];
  criticalCount: number;
  warningCount: number;
  totalDeficitUnits: number;
  totalEstimatedRestockCost: number;
} {
  const lowStockItems: LowStockItemResult[] = [];
  let criticalCount = 0;
  let warningCount = 0;
  let totalDeficitUnits = 0;
  let totalEstimatedRestockCost = 0;

  for (const product of products) {
    const evalResult = evaluateProductStock(product, customThreshold);
    if (evalResult.isLowStock) {
      lowStockItems.push(evalResult);
      if (evalResult.isOutOfStock || evalResult.stockLevelPercent <= 30) {
        criticalCount++;
      } else {
        warningCount++;
      }
      totalDeficitUnits += evalResult.recommendedReorderQty;
      totalEstimatedRestockCost += evalResult.estimatedRestockCost;
    }
  }

  // Sort by urgency: out of stock first, then lowest percentage of safety stock
  lowStockItems.sort((a, b) => {
    if (a.isOutOfStock !== b.isOutOfStock) return a.isOutOfStock ? -1 : 1;
    return a.stockLevelPercent - b.stockLevelPercent;
  });

  return {
    lowStockItems,
    criticalCount,
    warningCount,
    totalDeficitUnits,
    totalEstimatedRestockCost,
  };
}

