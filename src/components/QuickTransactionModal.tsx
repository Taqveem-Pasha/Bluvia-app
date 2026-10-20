import React, { useState } from 'react';
import { Product, Customer, UserProfile, PaymentMethod } from '../types';
import {
  X,
  Droplet,
  DollarSign,
  PackagePlus,
  Fuel,
  CheckCircle2,
} from 'lucide-react';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  currentUser: UserProfile;
  initialType?: string;
  initialProductId?: string;
  onQuickOrder: (order: { customerId: string; quantity: number; cashPaid: boolean }) => Promise<void>;
  onQuickPayment: (payment: { customerId: string; amount: number; method: PaymentMethod }) => Promise<void>;
  onQuickStockIn: (stock: { productId?: string; quantity: number; unitCost: number }) => Promise<void>;
  onQuickExpense: (expense: { amount: number; description: string; paidTo: string }) => Promise<void>;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  currentUser,
  initialType = 'order',
  initialProductId,
  onQuickOrder,
  onQuickPayment,
  onQuickStockIn,
  onQuickExpense,
}) => {
  const [activeMode, setActiveMode] = useState<string>(initialType);

  // Quick Order states
  const [orderCustId, setOrderCustId] = useState(customers[0]?.id || '');
  const [orderQty, setOrderQty] = useState(2);
  const [orderCashPaid, setOrderCashPaid] = useState(true);

  // Quick Payment states
  const [payCustId, setPayCustId] = useState(customers[0]?.id || '');
  const [payAmount, setPayAmount] = useState(360);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');

  // Quick Stock states
  const [selectedStockProdId, setSelectedStockProdId] = useState(
    initialProductId || products.find((p) => p.isReusableBottle)?.id || products[0]?.id || ''
  );
  const [stockQty, setStockQty] = useState(30);
  const selectedProd = products.find((p) => p.id === selectedStockProdId) || products[0];
  const [stockCost, setStockCost] = useState(selectedProd?.costPrice || 45);

  // Quick Expense states
  const [expAmount, setExpAmount] = useState(800);
  const [expDesc, setExpDesc] = useState('Fuel for Suzuki Van');
  const [expPaidTo, setExpPaidTo] = useState('Total Filling Station');

  if (!isOpen) return null;

  const bottle19L = products.find((p) => p.isReusableBottle);
  const unitPrice = bottle19L?.unitPrice || 180;
  const totalOrderAmount = orderQty * unitPrice;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onQuickOrder({
      customerId: orderCustId,
      quantity: Number(orderQty),
      cashPaid: orderCashPaid,
    });
    onClose();
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onQuickPayment({
      customerId: payCustId,
      amount: Number(payAmount),
      method: payMethod,
    });
    onClose();
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onQuickStockIn({
      productId: selectedStockProdId,
      quantity: Number(stockQty),
      unitCost: Number(stockCost),
    });
    onClose();
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onQuickExpense({
      amount: Number(expAmount),
      description: expDesc,
      paidTo: expPaidTo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-800 rounded-2xl shadow-2xl p-5 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            Quick Offline Transaction
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tabs */}
        <div className="grid grid-cols-4 gap-1.5 my-3 text-[11px] font-bold">
          <button
            onClick={() => setActiveMode('order')}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer ${
              activeMode === 'order'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>Refill Sale</span>
          </button>
          <button
            onClick={() => setActiveMode('payment')}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer ${
              activeMode === 'payment'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Receipt</span>
          </button>
          <button
            onClick={() => setActiveMode('stock')}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer ${
              activeMode === 'stock'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>Stock In</span>
          </button>
          <button
            onClick={() => setActiveMode('expense')}
            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer ${
              activeMode === 'expense'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Fuel className="w-4 h-4" />
            <span>Fuel/Exp</span>
          </button>
        </div>

        {/* 1. Refill Sale Form */}
        {activeMode === 'order' && (
          <form onSubmit={handleOrderSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Customer</label>
              <select
                value={orderCustId}
                onChange={(e) => setOrderCustId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.area})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">19L Bottles Qty</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={orderQty}
                  onChange={(e) => setOrderQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200 text-center font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Unit Rate (Rs.)</label>
                <input
                  type="number"
                  disabled
                  value={unitPrice}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-400 text-center opacity-70"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-900/60 flex items-center justify-between font-bold">
              <span className="text-slate-400">Total Payable:</span>
              <span className="text-lg text-cyan-300 font-black">Rs. {totalOrderAmount}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quickOrderCash"
                checked={orderCashPaid}
                onChange={(e) => setOrderCashPaid(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 bg-slate-950 border-slate-700"
              />
              <label htmlFor="quickOrderCash" className="text-slate-300">
                Customer paid cash on delivery (adds to cash register)
              </label>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:from-cyan-500 hover:to-blue-500 transition shadow-lg"
            >
              Confirm Refill Sale
            </button>
          </form>
        )}

        {/* 2. Quick Payment Form */}
        {activeMode === 'payment' && (
          <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Customer</label>
              <select
                value={payCustId}
                onChange={(e) => setPayCustId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Due: Rs. {c.outstandingBalance})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Amount Collected (Rs.)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200"
                >
                  <option value="cash">Cash Doorstep</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition shadow-lg"
            >
              Confirm Cash Receipt
            </button>
          </form>
        )}

        {/* 3. Quick Stock In Form */}
        {activeMode === 'stock' && (
          <form onSubmit={handleStockSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Select Product to Restock</label>
              <select
                value={selectedStockProdId}
                onChange={(e) => {
                  setSelectedStockProdId(e.target.value);
                  const p = products.find((prod) => prod.id === e.target.value);
                  if (p?.costPrice) setStockCost(p.costPrice);
                }}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current: {p.stockFull} full | Min: {p.minStockLevel})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Units Added / Filled</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Cost per Unit (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockCost}
                  onChange={(e) => setStockCost(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between font-bold">
              <span className="text-slate-400">Total Purchase / Production Cost:</span>
              <span className="text-cyan-400">Rs. {(stockQty * stockCost).toLocaleString()}</span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg"
            >
              Add to Full Inventory
            </button>
          </form>
        )}

        {/* 4. Quick Expense Form */}
        {activeMode === 'expense' && (
          <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Amount (Rs.)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Paid To</label>
                <input
                  type="text"
                  required
                  value={expPaidTo}
                  onChange={(e) => setExpPaidTo(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Description / Purpose</label>
              <input
                type="text"
                required
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition shadow-lg"
            >
              Deduct Cash Expense
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
