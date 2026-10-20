import React from 'react';
import {
  Product,
  Customer,
  Order,
  PaymentReceipt,
  PromisedPayment,
  ExpenseRecord,
  CashLedgerEntry,
  UserProfile,
} from '../types';
import {
  PackageCheck,
  RotateCcw,
  Truck,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  Wallet,
  CloudUpload,
  PlusCircle,
  ArrowUpRight,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { LowStockWidget } from './LowStockWidget';
import { BluviaLogo } from './BluviaLogo';
import { DocumentModal } from './DocumentModal';
import { BusinessSettings } from '../types';

interface DashboardViewProps {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  payments: PaymentReceipt[];
  promisedPayments: PromisedPayment[];
  expenses: ExpenseRecord[];
  cashLedger: CashLedgerEntry[];
  pendingSyncCount: number;
  currentUser: UserProfile;
  settings?: BusinessSettings | null;
  onOpenQuickAction: (actionType?: string, prefillProductId?: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  customers,
  orders,
  payments,
  promisedPayments,
  expenses,
  cashLedger,
  pendingSyncCount,
  currentUser,
  settings,
  onOpenQuickAction,
  onNavigateTab,
}) => {
  const [showReportModal, setShowReportModal] = React.useState(false);
  const today = new Date().toISOString().split('T')[0];

  // 1. Available full bottles (19L reusable specifically + overall)
  const bottle19L = products.find((p) => p.isReusableBottle || p.category === 'reusable_19l') || products[0];
  const totalFullBottles = products
    .filter((p) => p.isReusableBottle)
    .reduce((sum, p) => sum + p.stockFull, 0);

  // 2. Empty reusable bottles
  const totalEmptyBottles = products
    .filter((p) => p.isReusableBottle)
    .reduce((sum, p) => sum + p.stockEmpty, 0);

  // 3. Stock out for delivery (in transit)
  const totalInTransit = products
    .filter((p) => p.isReusableBottle)
    .reduce((sum, p) => sum + p.inTransit, 0);

  // 4. Today's sales
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today) || o.deliveryDate === today);
  const todaySales = todayOrders.reduce((sum, o) => sum + o.netTotal, 0);

  // 5. Actual cash received today
  const todayPayments = payments.filter((p) => p.createdAt.startsWith(today));
  const todayCashReceived = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  // 6. Outstanding customer balances
  const totalOutstandingBalance = customers.reduce((sum, c) => sum + Math.max(0, c.outstandingBalance), 0);

  // 7. Overdue promised payments
  const overduePromises = promisedPayments.filter(
    (p) => p.status === 'pending' && p.promiseDate < today
  );
  const overduePromisedAmount = overduePromises.reduce((sum, p) => sum + p.amount, 0);

  // 8. Today's deliveries
  const todayDeliveriesCount = todayOrders.length;
  const completedDeliveriesCount = todayOrders.filter((o) => o.status === 'delivered').length;

  // 9. Current cash balance
  const currentCashBalance =
    cashLedger.length > 0 ? cashLedger[cashLedger.length - 1].balanceAfter : 20660;

  // Low stock alert check
  const isLowStock = bottle19L ? bottle19L.stockFull <= bottle19L.minStockLevel : false;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Welcome & Context Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border border-cyan-900/60 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BluviaLogo
              size="lg"
              logoUrl={settings?.logoUrl}
              variant="inverted-card"
              alt={settings?.businessName || 'BLUVIA Premium Drinking Water Fresh'}
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  {settings?.businessName || 'BLUVIA Premium Drinking Water Fresh'}
                </p>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Welcome, {currentUser.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Owner: <strong className="text-cyan-300">{settings?.ownerName || 'Taqveem Ahsan Pasha'}</strong> • <strong className="text-slate-300">{settings?.email || 'bluvia.pure@gmail.com'}</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Role: <strong className="text-cyan-300 capitalize">{currentUser.role}</strong> • All records persist offline & sync to cloud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => onOpenQuickAction()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-lg shadow-cyan-950 active:scale-95 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record</span>
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs sm:text-sm font-medium px-3 py-2.5 rounded-xl transition cursor-pointer shadow"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden xs:inline">Summary Report</span>
            </button>
            <button
              onClick={() => onNavigateTab('backup')}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium px-3 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <CloudUpload className="w-4 h-4 text-cyan-400" />
              <span className="hidden xs:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {isLowStock && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-center gap-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <strong className="font-bold">Low Stock Warning:</strong> 19L Full Bottles count ({bottle19L?.stockFull}) is at or below minimum buffer ({bottle19L?.minStockLevel}). Please order production refill immediately!
            </div>
          </div>
        )}
      </div>

      {/* 10 Required Metric Dashboard Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Live Business Health (Pakistani Rupee • PKR)
          </h2>
          <span className="text-xs text-slate-400">Audited Ledger Calculations</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Available Full Bottles */}
          <div
            onClick={() => onNavigateTab('stock')}
            className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Available Full</span>
              <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 group-hover:scale-110 transition">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {totalFullBottles} <span className="text-xs font-normal text-cyan-300">bottles</span>
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span>Ready for dispatch</span>
              <ArrowUpRight className="w-3 h-3 text-cyan-400" />
            </div>
          </div>

          {/* 2. Empty Reusable Bottles */}
          <div
            onClick={() => onNavigateTab('stock')}
            className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Empty Bottles</span>
              <div className="p-2 rounded-xl bg-teal-950/80 text-teal-400 group-hover:scale-110 transition">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {totalEmptyBottles} <span className="text-xs font-normal text-teal-300">at plant</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Available to wash & refill</p>
          </div>

          {/* 3. Stock Out for Delivery (In Transit) */}
          <div
            onClick={() => onNavigateTab('deliveries')}
            className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">In Transit</span>
              <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 group-hover:scale-110 transition">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-300 mt-2">
              {totalInTransit} <span className="text-xs font-normal text-slate-400">bottles</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">With delivery drivers</p>
          </div>

          {/* 4. Today's Sales */}
          <div
            onClick={() => onNavigateTab('deliveries')}
            className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Today's Sales</span>
              <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 group-hover:scale-110 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              Rs. {todaySales.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{todayOrders.length} orders booked</p>
          </div>

          {/* 5. Actual Cash Received */}
          <div
            onClick={() => onNavigateTab('finance')}
            className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Cash Received</span>
              <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 group-hover:scale-110 transition">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">
              Rs. {todayCashReceived.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{todayPayments.length} receipts collected</p>
          </div>

          {/* 6. Outstanding Customer Balances */}
          <div
            onClick={() => onNavigateTab('customers')}
            className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Receivables</span>
              <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 group-hover:scale-110 transition">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-rose-300 mt-2">
              Rs. {totalOutstandingBalance.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Customer credit balance</p>
          </div>

          {/* 7. Overdue Promised Payments */}
          <div
            onClick={() => onNavigateTab('finance')}
            className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Overdue Promises</span>
              <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 group-hover:scale-110 transition">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-2">
              Rs. {overduePromisedAmount.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{overduePromises.length} overdue promises</p>
          </div>

          {/* 8. Today's Deliveries */}
          <div
            onClick={() => onNavigateTab('deliveries')}
            className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Deliveries Done</span>
              <div className="p-2 rounded-xl bg-teal-950/80 text-teal-400 group-hover:scale-110 transition">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-2">
              {completedDeliveriesCount} / {todayDeliveriesCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {todayDeliveriesCount > 0 ? `${Math.round((completedDeliveriesCount / todayDeliveriesCount) * 100)}% completed` : 'No deliveries scheduled'}
            </p>
          </div>

          {/* 9. Current Cash Balance */}
          <div
            onClick={() => onNavigateTab('finance')}
            className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition shadow-lg cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Register Cash</span>
              <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 group-hover:scale-110 transition">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">
              Rs. {currentCashBalance.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Cash on hand (audited)</p>
          </div>

          {/* 10. Pending Sync Count */}
          <div
            onClick={() => onNavigateTab('backup')}
            className={`border rounded-2xl p-4 transition shadow-lg cursor-pointer group ${
              pendingSyncCount > 0
                ? 'bg-amber-950/30 border-amber-800 hover:border-amber-600'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Offline Outbox</span>
              <div className={`p-2 rounded-xl ${pendingSyncCount > 0 ? 'bg-amber-900/80 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                <CloudUpload className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-black mt-2 ${pendingSyncCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {pendingSyncCount} <span className="text-xs font-normal text-slate-400">pending</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {pendingSyncCount > 0 ? 'Queued to sync when online' : 'All transactions synchronized'}
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock & Proactive Reorder Monitor Widget */}
      <LowStockWidget
        products={products}
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
        onOpenQuickAction={onOpenQuickAction}
      />

      {/* Two Column Layout: Deliveries & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Deliveries & Customer routes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-cyan-400" />
                  Today's Route Schedule & Dispatch
                </h3>
                <p className="text-xs text-slate-400">Assigned drivers and delivery status</p>
              </div>
              <button
                onClick={() => onNavigateTab('deliveries')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                View All Deliveries
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {todayOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No orders scheduled for today yet. Use "Add Transaction" to create an order.
                </div>
              ) : (
                todayOrders.map((order) => {
                  return (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {order.orderNumber.replace('ORD-', '#')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{order.customerName}</p>
                          <p className="text-xs text-slate-400">
                            {order.area} • {order.items.reduce((sum, i) => sum + i.quantity, 0)} bottles • Rs. {order.netTotal}
                          </p>
                          <p className="text-[11px] text-cyan-400/90 mt-0.5">
                            Driver: {order.assignedStaffName || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            order.status === 'delivered'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : order.status === 'dispatched'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-900/40 text-emerald-400'
                              : 'bg-rose-900/40 text-rose-400'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Shortcuts & Bottle Health */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Reusable Bottle Circulation</h3>
            <p className="text-xs text-slate-400 mb-4">Complete cycle of 19-Liter polycarbonate bottles</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-300">Warehouse Full Bottles</span>
                <span className="font-bold text-cyan-400">{bottle19L?.stockFull || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-300">Warehouse Empty Bottles</span>
                <span className="font-bold text-teal-400">{bottle19L?.stockEmpty || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-300">Currently in Delivery Vans</span>
                <span className="font-bold text-amber-400">{bottle19L?.inTransit || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-300">Customer Held Bottles</span>
                <span className="font-bold text-blue-400">
                  {customers.reduce((sum, c) => sum + (c.bottlesHeld19L || 0), 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-300">Damaged / Written Off</span>
                <span className="font-bold text-rose-400">{bottle19L?.stockDamaged || 0}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('stock')}
              className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              Manage Stock & Purchases
            </button>
          </div>

          {/* Overdue Payment Alert Callouts */}
          {overduePromises.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Overdue Payment Follow-ups
              </div>
              <div className="space-y-2">
                {overduePromises.slice(0, 3).map((op) => (
                  <div key={op.id} className="p-2 rounded-lg bg-slate-950/80 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-200">{op.customerName}</p>
                      <p className="text-[10px] text-amber-400/90">Promised by: {op.promiseDate}</p>
                    </div>
                    <span className="font-black text-rose-400">Rs. {op.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Business Summary Report Modal */}
      {settings && (
        <DocumentModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          type="report"
          settings={settings}
          reportData={{
            totalSales: todaySales,
            cashCollected: todayCashReceived,
            totalOrders: todayOrders.length,
            completedDeliveries: completedDeliveriesCount,
            totalBottlesFull: totalFullBottles,
            totalBottlesEmpty: totalEmptyBottles,
            totalBottlesInTransit: totalInTransit,
            customerHeldBottles: customers.reduce((sum, c) => sum + (c.bottlesHeld19L || 0), 0),
            outstandingBalance: totalOutstandingBalance,
            cashBalance: currentCashBalance,
          }}
        />
      )}
    </div>
  );
};
