import React, { useState } from 'react';
import {
  PaymentReceipt,
  PromisedPayment,
  ExpenseRecord,
  CashLedgerEntry,
  Customer,
  UserProfile,
  PaymentMethod,
  ExpenseCategory,
} from '../types';
import {
  Receipt,
  Plus,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  Fuel,
  Wrench,
  Zap,
  ShoppingBag,
  Printer,
} from 'lucide-react';
import { BluviaLogo } from './BluviaLogo';
import { DocumentModal } from './DocumentModal';
import { BusinessSettings } from '../types';

interface FinanceViewProps {
  payments: PaymentReceipt[];
  promisedPayments: PromisedPayment[];
  expenses: ExpenseRecord[];
  cashLedger: CashLedgerEntry[];
  customers: Customer[];
  currentUser: UserProfile;
  settings?: BusinessSettings | null;
  onRecordPayment: (payment: {
    customerId: string;
    amount: number;
    method: PaymentMethod;
    notes?: string;
    referenceNumber?: string;
  }) => Promise<void>;
  onRecordPromisedPayment: (promise: {
    customerId: string;
    amount: number;
    promiseDate: string;
    notes?: string;
  }) => Promise<void>;
  onFulfillPromise: (promiseId: string, collectedMethod: PaymentMethod) => Promise<void>;
  onRecordExpense: (expense: {
    category: ExpenseCategory;
    amount: number;
    paidTo: string;
    description: string;
    paymentMethod: 'cash' | 'bank_transfer';
  }) => Promise<void>;
  onExportCashBookCSV: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  payments,
  promisedPayments,
  expenses,
  cashLedger,
  customers,
  currentUser,
  settings,
  onRecordPayment,
  onRecordPromisedPayment,
  onFulfillPromise,
  onRecordExpense,
  onExportCashBookCSV,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'promised' | 'expenses' | 'cashbook'>('cashbook');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  // Payment Form States
  const [payCustId, setPayCustId] = useState(customers[0]?.id || '');
  const [payAmount, setPayAmount] = useState(360);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('Payment collected at store/doorstep');

  // Promise Form States
  const [promCustId, setPromCustId] = useState(customers[0]?.id || '');
  const [promAmount, setPromAmount] = useState(400);
  const [promDate, setPromDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );
  const [promNotes, setPromNotes] = useState('Customer promised to clear bill on Friday salary');

  // Expense Form States
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('fuel');
  const [expAmount, setExpAmount] = useState(500);
  const [expPaidTo, setExpPaidTo] = useState('Shell Petrol Pump');
  const [expDesc, setExpDesc] = useState('Fuel for Suzuki Van delivery route');
  const [expMethod, setExpMethod] = useState<'cash' | 'bank_transfer'>('cash');

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRecordPayment({
      customerId: payCustId,
      amount: Number(payAmount),
      method: payMethod,
      referenceNumber: payRef,
      notes: payNotes,
    });
    setShowPaymentModal(false);
  };

  const handlePromiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRecordPromisedPayment({
      customerId: promCustId,
      amount: Number(promAmount),
      promiseDate: promDate,
      notes: promNotes,
    });
    setShowPromiseModal(false);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRecordExpense({
      category: expCategory,
      amount: Number(expAmount),
      paidTo: expPaidTo,
      description: expDesc,
      paymentMethod: expMethod,
    });
    setShowExpenseModal(false);
  };

  const currentCash = cashLedger.length > 0 ? cashLedger[cashLedger.length - 1].balanceAfter : 0;
  const totalCashCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Banner and Sub-tab Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BluviaLogo
              size="sm"
              logoUrl={settings?.logoUrl}
              variant="badge"
              alt={settings?.businessName || 'BLUVIA'}
            />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-400" />
                Finance, Cash Book & Payment Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Official payment receipts, auditable cash register, and PKR double-entry records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              <span>Collect Payment</span>
            </button>
            <button
              onClick={() => setShowPromiseModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
            >
              <Clock className="w-4 h-4" />
              <span>Log Promise</span>
            </button>
            {currentUser.role !== 'delivery' && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            )}
            <button
              onClick={onExportCashBookCSV}
              title="Export Cash Book CSV"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl cursor-pointer transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Current Register Cash</span>
            <span className="text-lg font-black text-emerald-400">Rs. {currentCash.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Payments Received</span>
            <span className="text-lg font-black text-cyan-400">Rs. {totalCashCollected.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Expenses Paid</span>
            <span className="text-lg font-black text-rose-400">Rs. {totalExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('cashbook')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === 'cashbook' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Cash Book ({cashLedger.length})
          </button>
          <button
            onClick={() => setActiveSubTab('receipts')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === 'receipts' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Receipts ({payments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('promised')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === 'promised' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Promised Payments ({promisedPayments.filter((p) => p.status === 'pending').length} Active)
          </button>
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeSubTab === 'expenses' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Expenses ({expenses.length})
          </button>
        </div>
      </div>

      {/* Subtab: Cash Book */}
      {activeSubTab === 'cashbook' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1">Running Cash Book (Audited Balance)</h3>
          <p className="text-xs text-slate-400 mb-4">
            Formula: Opening Cash + Actual Cash Received − Cash Expenses = Cash Balance on hand
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Inflow (Rs.)</th>
                  <th className="py-2.5 px-3 text-right">Outflow (Rs.)</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[...cashLedger].reverse().map((entry) => {
                  const isInflow = entry.type === 'inflow';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{entry.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{entry.category}</td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{entry.description}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                        {isInflow ? `+${entry.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400">
                        {!isInflow ? `-${entry.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-white">
                        Rs. {entry.balanceAfter.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{entry.recordedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab: Receipts */}
      {activeSubTab === 'receipts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => (
            <div key={p.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    {p.receiptNumber}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{p.customerName}</h3>
                </div>
                <span className="text-lg font-black text-emerald-400">Rs. {p.amount}</span>
              </div>
              <div className="mt-3 text-xs text-slate-400 space-y-1">
                <p>Method: <strong className="text-slate-200 capitalize">{p.paymentMethod.replace('_', ' ')}</strong></p>
                <p>Collected by: <strong className="text-slate-200">{p.collectedByName}</strong></p>
                <p>Date: {new Date(p.createdAt).toLocaleDateString()}</p>
                {p.notes && <p className="italic text-slate-500">"{p.notes}"</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedReceipt(p)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab: Promised Payments */}
      {activeSubTab === 'promised' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-xs text-amber-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Accounting Rule:</strong> Promised payments are NOT cash receipts. They do not increase cash or decrease customer balance until fulfilled.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promisedPayments.map((prom) => {
              const isOverdue = prom.status === 'pending' && prom.promiseDate < new Date().toISOString().split('T')[0];
              const isFulfilled = prom.status === 'fulfilled';

              return (
                <div
                  key={prom.id}
                  className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg flex flex-col justify-between ${
                    isOverdue ? 'border-rose-800/80 bg-rose-950/20' : isFulfilled ? 'border-emerald-800/60' : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isFulfilled
                              ? 'bg-emerald-950 text-emerald-300'
                              : isOverdue
                              ? 'bg-rose-950 text-rose-300 animate-pulse'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {isFulfilled ? 'Fulfilled' : isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1.5">{prom.customerName}</h3>
                        <p className="text-xs text-slate-400 font-mono">{prom.customerPhone}</p>
                      </div>
                      <span className="text-lg font-black text-amber-400">Rs. {prom.amount}</span>
                    </div>

                    <div className="mt-3 text-xs text-slate-300 space-y-1">
                      <p>Promise Date: <strong className="text-white">{prom.promiseDate}</strong></p>
                      <p className="text-slate-400">Notes: {prom.notes || 'No notes'}</p>
                    </div>
                  </div>

                  {prom.status === 'pending' && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex gap-2">
                      <button
                        onClick={() => onFulfillPromise(prom.id, 'cash')}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fulfill Cash</span>
                      </button>
                      <a
                        href={`tel:${prom.customerPhone}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab: Expenses */}
      {activeSubTab === 'expenses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((exp) => (
            <div key={exp.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    {exp.category.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{exp.paidTo}</h3>
                </div>
                <span className="text-lg font-black text-rose-400">Rs. {exp.amount}</span>
              </div>
              <div className="mt-3 text-xs text-slate-300 space-y-1">
                <p className="text-slate-400">{exp.description}</p>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                  <span>Method: {exp.paymentMethod}</span>
                  <span>Date: {exp.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Collect Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-emerald-400">Record Cash Receipt / Payment</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Directly reduces customer ledger balance and increments register cash
            </p>

            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Account</label>
                <select
                  value={payCustId}
                  onChange={(e) => setPayCustId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Due: Rs. {c.outstandingBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Amount Paid (Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  >
                    <option value="cash">Cash Register</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reference / Transaction ID</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. TID-982183921"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Receipt Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-lg"
                >
                  Credit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Promised Payment */}
      {showPromiseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-amber-400">Record Promised Payment</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks scheduled commitment without inflating cash or reducing balance prematurely
            </p>

            <form onSubmit={handlePromiseSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Account</label>
                <select
                  value={promCustId}
                  onChange={(e) => setPromCustId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Due: Rs. {c.outstandingBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Promised Amount (Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={promAmount}
                    onChange={(e) => setPromAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Promised Payment Date</label>
                  <input
                    type="date"
                    required
                    value={promDate}
                    onChange={(e) => setPromDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Follow-up Notes</label>
                <input
                  type="text"
                  required
                  value={promNotes}
                  onChange={(e) => setPromNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPromiseModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition shadow-lg"
                >
                  Log Promise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-rose-400">Record Business Expense</h3>
            <p className="text-xs text-slate-400 mt-0.5">Deducts register cash immediately and logs audit entry</p>

            <form onSubmit={handleExpenseSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  >
                    <option value="fuel">Vehicle Fuel</option>
                    <option value="vehicle_maintenance">Van Maintenance</option>
                    <option value="utility_power_water">Power & Electricity</option>
                    <option value="plant_filters_chemicals">Plant Filters / RO</option>
                    <option value="caps_seals_labels">Caps, Seals, Labels</option>
                    <option value="staff_salaries">Staff Wages</option>
                    <option value="rent">Plant Rent</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Amount (Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Paid To (Vendor / Person)</label>
                <input
                  type="text"
                  required
                  value={expPaidTo}
                  onChange={(e) => setExpPaidTo(e.target.value)}
                  placeholder="e.g. Total Parco Filling Station"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Bill Memo</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g. Fuel for Bolan Van Route 2"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition shadow-lg"
                >
                  Confirm Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {selectedReceipt && settings && (
        <DocumentModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          type="receipt"
          settings={settings}
          receipt={selectedReceipt}
          customer={customers.find((c) => c.id === selectedReceipt.customerId)}
        />
      )}
    </div>
  );
};
