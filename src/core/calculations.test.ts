import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSaleTotal,
  calculateCustomerBalance,
  calculateCashBalance,
  processStockPurchase,
  processOrderDispatch,
  processDeliveryCompletion,
  processFailedDelivery,
  processPayment,
  processExpense,
  deduplicateSyncBatch,
  validateBackupPayload,
  evaluateProductStock,
  detectLowStockProducts,
} from './calculations.ts';
import type { BottleStockState, ProductStockInfo } from './calculations.ts';

test('1. A purchase of 100 bottles increases stock by 100', () => {
  const initialStock: BottleStockState = {
    stockFull: 50,
    stockEmpty: 20,
    stockDamaged: 2,
    inTransit: 0,
  };

  const updatedStock = processStockPurchase(initialStock, 100);
  assert.equal(updatedStock.stockFull, 150, 'Full stock should increase from 50 to 150');
  assert.equal(updatedStock.stockEmpty, 20, 'Empty stock remains unaffected');
});

test('2. A sale of 10 bottles at Rs. 100 creates a Rs. 1,000 sale', () => {
  const result = calculateSaleTotal(
    [{ quantity: 10, unitPrice: 100 }],
    0, // discount
    0  // delivery charges
  );

  assert.equal(result.subtotal, 1000);
  assert.equal(result.netTotal, 1000);

  // Also test with discount and delivery charge
  const resultWithExtras = calculateSaleTotal(
    [{ quantity: 10, unitPrice: 100 }],
    50, // Rs. 50 discount
    100 // Rs. 100 delivery
  );
  assert.equal(resultWithExtras.netTotal, 1050);
});

test('3. A Rs. 600 payment leaves Rs. 400 outstanding on a Rs. 1000 balance', () => {
  const openingBalance = 0;
  const newCharges = 1000;
  const allocatedPayments = 600;

  const balance = calculateCustomerBalance(openingBalance, newCharges, allocatedPayments);
  assert.equal(balance, 400, 'Outstanding balance must be exactly Rs. 400');
});

test('4. A promise to pay Rs. 400 does not increase cash or reduce the outstanding balance', () => {
  const currentCash = 5000;
  const currentCustomerBalance = 400;
  const promisedAmount = 400;

  const result = processPayment(currentCash, currentCustomerBalance, promisedAmount, true);

  assert.equal(result.newCashBalance, 5000, 'Cash balance must NOT increase from a promised payment');
  assert.equal(result.newCustomerBalance, 400, 'Customer balance must NOT decrease from a promised payment');
  assert.equal(result.isCashIncremented, false);
  assert.equal(result.isCustomerBalanceReduced, false);
});

test('5. A dispatch of 10 bottles followed by delivery deducts stock only once', () => {
  const initialStock: BottleStockState = {
    stockFull: 100,
    stockEmpty: 10,
    stockDamaged: 0,
    inTransit: 0,
  };

  // Step A: Dispatch 10 bottles
  const dispatchedStock = processOrderDispatch(initialStock, 10);
  assert.equal(dispatchedStock.stockFull, 90, 'Full stock decreased at dispatch');
  assert.equal(dispatchedStock.inTransit, 10, '10 bottles are now in transit');

  // Step B: Complete delivery of 10 bottles and collect 8 empty bottles
  const deliveredStock = processDeliveryCompletion(dispatchedStock, 10, 8, 0);
  assert.equal(deliveredStock.stockFull, 90, 'Full stock must NOT be deducted a second time upon delivery');
  assert.equal(deliveredStock.inTransit, 0, 'In-transit is cleared to 0');
  assert.equal(deliveredStock.stockEmpty, 18, 'Empty stock increases by 8 returned bottles');
});

test('6. A failed delivery restores stock only after returned quantities are confirmed', () => {
  const stockDuringTrip: BottleStockState = {
    stockFull: 90,
    stockEmpty: 10,
    stockDamaged: 0,
    inTransit: 10,
  };

  // Customer wasn't home, driver brings back all 10 full bottles intact
  const restoredStock = processFailedDelivery(stockDuringTrip, 10, 0);
  assert.equal(restoredStock.stockFull, 100, 'Full stock restored to 100');
  assert.equal(restoredStock.inTransit, 0, 'In transit cleared to 0');

  // Customer wasn't home, driver brings back 8 full bottles, 2 damaged
  const partialDamageTrip: BottleStockState = {
    stockFull: 90,
    stockEmpty: 10,
    stockDamaged: 0,
    inTransit: 10,
  };
  const damageRestored = processFailedDelivery(partialDamageTrip, 8, 2);
  assert.equal(damageRestored.stockFull, 98, '8 returned full bottles returned to inventory');
  assert.equal(damageRestored.stockDamaged, 2, '2 bottles marked as damaged');
  assert.equal(damageRestored.inTransit, 0);
});

test('7. A further Rs. 200 payment reduces the Rs. 400 outstanding balance to Rs. 200', () => {
  const currentCash = 5000;
  const currentBalance = 400;
  const paymentAmount = 200;

  const result = processPayment(currentCash, currentBalance, paymentAmount, false);
  assert.equal(result.newCustomerBalance, 200, 'Balance is reduced from 400 to 200');
  assert.equal(result.newCashBalance, 5200, 'Cash balance increases by 200');
});

test('8. A Rs. 300 cash expense reduces the cash balance by Rs. 300', () => {
  const initialCash = 5200;
  const expenseAmount = 300;

  const updatedCash = processExpense(initialCash, expenseAmount);
  assert.equal(updatedCash, 4900, 'Cash balance must be 4900');
});

test('9 & 10. Synchronization deduplication with idempotency keys prevents duplicate transactions across staff phones', () => {
  const existingKeys = new Set<string>(['tx-uuid-1', 'tx-uuid-2']);

  const incomingFromPhoneA = [
    { id: '1', idempotencyKey: 'tx-uuid-2', timestamp: Date.now() }, // duplicate
    { id: '2', idempotencyKey: 'tx-uuid-3', timestamp: Date.now() }, // fresh
    { id: '3', idempotencyKey: 'tx-uuid-4', timestamp: Date.now() }, // fresh
  ];

  const { toApply, duplicatesIgnored } = deduplicateSyncBatch(existingKeys, incomingFromPhoneA);

  assert.equal(duplicatesIgnored, 1, 'Should recognize and ignore 1 duplicate transaction');
  assert.equal(toApply.length, 2, 'Should apply only the 2 novel transactions');
  assert.equal(toApply[0].idempotencyKey, 'tx-uuid-3');
  assert.equal(toApply[1].idempotencyKey, 'tx-uuid-4');
  assert.ok(existingKeys.has('tx-uuid-3'));
  assert.ok(existingKeys.has('tx-uuid-4'));
});

test('11. Backup validation checks authenticity and prevents invalid restoration', () => {
  const invalidBackup = { version: '1.0', data: {} };
  assert.equal(validateBackupPayload(invalidBackup).valid, false);

  const validBackup = {
    version: '1.0',
    businessName: 'BLUVIA Premium Drinking Water Fresh',
    timestamp: new Date().toISOString(),
    checksum: 'a8b7c6d5',
    data: {
      products: [],
      customers: [],
      orders: [],
      payments: [],
      expenses: [],
    },
  };
  assert.equal(validateBackupPayload(validBackup).valid, true);
});

test('12. Low stock evaluation accurately identifies stock below minStockLevel threshold', () => {
  const lowProduct: ProductStockInfo = {
    id: 'prod_19l',
    name: '19L Polycarbonate Bottle',
    stockFull: 35,
    minStockLevel: 50,
    costPrice: 45,
  };

  const evalResult = evaluateProductStock(lowProduct);
  assert.equal(evalResult.isLowStock, true, 'Should be flagged as low stock');
  assert.equal(evalResult.isOutOfStock, false);
  assert.equal(evalResult.thresholdUsed, 50);
  assert.equal(evalResult.deficit, 15, 'Deficit should be 50 - 35 = 15');
  assert.equal(evalResult.stockLevelPercent, 70, '35/50 is 70%');
  // recommended reorder to reach 1.5x buffer (75 units): 75 - 35 = 40 units
  assert.equal(evalResult.recommendedReorderQty, 40);
  assert.equal(evalResult.estimatedRestockCost, 40 * 45, 'Restock cost = 40 * Rs. 45 = Rs. 1800');
});

test('13. Low stock evaluation supports dynamic custom thresholds', () => {
  const healthyProduct: ProductStockInfo = {
    id: 'prod_pet_500ml',
    name: '500ml Mineral Water',
    stockFull: 25,
    minStockLevel: 20,
    costPrice: 200,
  };

  // With default threshold (minStockLevel 20): healthy
  const defaultEval = evaluateProductStock(healthyProduct);
  assert.equal(defaultEval.isLowStock, false);
  assert.equal(defaultEval.deficit, 0);

  // With custom surge threshold (e.g. summer surge of 50 units): triggers low stock
  const surgeEval = evaluateProductStock(healthyProduct, 50);
  assert.equal(surgeEval.isLowStock, true);
  assert.equal(surgeEval.thresholdUsed, 50);
  assert.equal(surgeEval.deficit, 25);
});

test('14. detectLowStockProducts aggregates alerts and prioritizes critical out-of-stock items', () => {
  const catalog: ProductStockInfo[] = [
    { id: '1', name: '19L Bottle', stockFull: 35, minStockLevel: 50, costPrice: 45 }, // Low (70%)
    { id: '2', name: 'Hot Dispenser', stockFull: 0, minStockLevel: 5, costPrice: 20000 }, // Out of stock (0%)
    { id: '3', name: 'Manual Pump', stockFull: 20, minStockLevel: 10, costPrice: 350 }, // Healthy
    { id: '4', name: '1.5L PET Carton', stockFull: 5, minStockLevel: 25, costPrice: 190 }, // Critical (20%)
  ];

  const analysis = detectLowStockProducts(catalog);
  assert.equal(analysis.lowStockItems.length, 3, 'Should find 3 low stock products');
  assert.equal(analysis.criticalCount, 2, '2 items are critical (0% and 20%)');
  // Check sorting: Out of stock first
  assert.equal(analysis.lowStockItems[0].product.id, '2', 'Out of stock item should be first');
  assert.equal(analysis.lowStockItems[1].product.id, '4', 'Lowest percentage buffer item should be next');
  assert.ok(analysis.totalEstimatedRestockCost > 0);
});

test('15. Business profile identity and logo URL are valid and preserved', () => {
  const profile = {
    businessName: 'BLUVIA Premium Drinking Water Fresh',
    ownerName: 'Taqveem Ahsan Pasha',
    email: 'bluvia.pure@gmail.com',
    logoUrl: '/bluvia-logo.png',
  };

  assert.equal(profile.businessName, 'BLUVIA Premium Drinking Water Fresh');
  assert.equal(profile.ownerName, 'Taqveem Ahsan Pasha');
  assert.equal(profile.email, 'bluvia.pure@gmail.com');
  assert.ok(profile.logoUrl.includes('bluvia-logo'));
});


