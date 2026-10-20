import React, { useState } from 'react';
import {
  Order,
  Product,
  Customer,
  UserProfile,
  OrderItem,
  OrderStatus,
  BusinessSettings,
} from '../types';
import { calculateSaleTotal } from '../core/calculations';
import { BluviaLogo } from './BluviaLogo';
import { DocumentModal } from './DocumentModal';
import {
  Truck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  User,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Package,
  FileText,
  FileCheck,
} from 'lucide-react';

interface OrdersDeliveriesViewProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  users: UserProfile[];
  currentUser: UserProfile;
  deliveryAreas: string[];
  settings?: BusinessSettings | null;
  onCreateOrder: (orderData: {
    customerId: string;
    items: OrderItem[];
    discount: number;
    deliveryCharges: number;
    assignedStaffId?: string;
    deliveryDate: string;
    notes?: string;
    collectImmediateCash?: boolean;
  }) => Promise<void>;
  onDispatchOrder: (orderId: string, assignedDriverId: string) => Promise<void>;
  onCompleteDelivery: (
    orderId: string,
    bottlesDelivered: number,
    bottlesReturned: number,
    paymentCollected: number,
    paymentMethod: 'cash' | 'jazzcash' | 'easypaisa'
  ) => Promise<void>;
  onFailDelivery: (orderId: string, fullBottlesReturned: number, reason: string) => Promise<void>;
}

export const OrdersDeliveriesView: React.FC<OrdersDeliveriesViewProps> = ({
  orders,
  products,
  customers,
  users,
  currentUser,
  deliveryAreas,
  settings,
  onCreateOrder,
  onDispatchOrder,
  onCompleteDelivery,
  onFailDelivery,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [completingOrder, setCompletingOrder] = useState<Order | null>(null);
  const [failingOrder, setFailingOrder] = useState<Order | null>(null);
  const [selectedDocOrder, setSelectedDocOrder] = useState<Order | null>(null);
  const [docModalType, setDocModalType] = useState<'invoice' | 'delivery_slip'>('invoice');

  // New Order Form states
  const [selectedCustId, setSelectedCustId] = useState(customers[0]?.id || '');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 2 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [assignedDriverId, setAssignedDriverId] = useState(
    users.find((u) => u.role === 'delivery')?.id || ''
  );
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [collectImmediateCash, setCollectImmediateCash] = useState(false);

  // Complete Delivery Modal states
  const [deliveredCount, setDeliveredCount] = useState(2);
  const [returnedEmpties, setReturnedEmpties] = useState(2);
  const [cashCollected, setCashCollected] = useState(360);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'jazzcash' | 'easypaisa'>('cash');

  // Failed Delivery Modal states
  const [fullReturned, setFullReturned] = useState(2);
  const [failReason, setFailReason] = useState('Customer premises locked / not answering phone');

  const deliveryDrivers = users.filter((u) => u.role === 'delivery' || u.role === 'manager');

  // Calculate live totals for new order
  const calculatedItems: OrderItem[] = orderItems.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    const unitPrice = prod?.unitPrice || 0;
    return {
      productId: item.productId,
      productName: prod?.name || 'Product',
      quantity: Number(item.quantity),
      unitPrice,
      total: Number(item.quantity) * unitPrice,
    };
  });

  const saleCalc = calculateSaleTotal(
    calculatedItems.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
    discount,
    deliveryCharges
  );

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0 || !selectedCustId) return;

    await onCreateOrder({
      customerId: selectedCustId,
      items: calculatedItems,
      discount: Number(discount),
      deliveryCharges: Number(deliveryCharges),
      assignedStaffId: assignedDriverId || undefined,
      deliveryDate,
      notes,
      collectImmediateCash,
    });

    setShowCreateModal(false);
  };

  const openCompleteModal = (order: Order) => {
    setCompletingOrder(order);
    const totalBottles = order.items.reduce((acc, i) => acc + i.quantity, 0);
    setDeliveredCount(totalBottles);
    setReturnedEmpties(totalBottles);
    setCashCollected(order.paymentStatus === 'paid' ? 0 : order.netTotal);
    setPaymentMethod('cash');
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingOrder) return;
    await onCompleteDelivery(
      completingOrder.id,
      Number(deliveredCount),
      Number(returnedEmpties),
      Number(cashCollected),
      paymentMethod
    );
    setCompletingOrder(null);
  };

  const openFailModal = (order: Order) => {
    setFailingOrder(order);
    const totalBottles = order.items.reduce((acc, i) => acc + i.quantity, 0);
    setFullReturned(totalBottles);
    setFailReason('Customer premises locked / not answering call');
  };

  const handleFailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failingOrder) return;
    await onFailDelivery(failingOrder.id, Number(fullReturned), failReason);
    setFailingOrder(null);
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesArea = areaFilter === 'all' || o.area === areaFilter;
    return matchesStatus && matchesArea;
  });

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Controls Bar */}
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
                <Truck className="w-5 h-5 text-cyan-400" />
                Orders & Delivery Management
              </h2>
              <p className="text-xs text-slate-400">
                Official delivery slips, dispatches into in-transit, and verified invoice generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              <span>Book Order</span>
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {(['all', 'pending', 'dispatched', 'delivered', 'failed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-bold capitalize transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
            >
              <option value="all">All Routes</option>
              {deliveryAreas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No orders found under this filter.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPending = order.status === 'pending';
            const isDispatched = order.status === 'dispatched';
            const isDelivered = order.status === 'delivered';
            const isFailed = order.status === 'failed';

            return (
              <div
                key={order.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-extrabold text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-800">
                      {order.orderNumber}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{order.customerName}</h3>
                      <p className="text-xs text-slate-400">
                        {order.area} • Delivery Date: <strong className="text-slate-200">{order.deliveryDate}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isDelivered
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isDispatched
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : isFailed
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Items & Financial Math Breakdown */}
                <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="font-medium text-slate-300">
                      {order.items.map((i, idx) => (
                        <span key={idx} className="mr-3">
                          {i.productName} <strong className="text-cyan-300">x{i.quantity}</strong> (@ Rs. {i.unitPrice})
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Formula: Subtotal Rs. {order.subtotal} {order.discount > 0 && `- Rs. ${order.discount} Disc`} {order.deliveryCharges > 0 && `+ Rs. ${order.deliveryCharges} Deliv`} = Net <strong className="text-white">Rs. {order.netTotal}</strong>
                    </p>
                    <p className="text-[11px] text-cyan-400/90">
                      Assigned Driver: <strong>{order.assignedStaffName || 'Unassigned'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action 1: Dispatch */}
                    {isPending && (
                      <button
                        onClick={() => {
                          const driverId = order.assignedStaffId || deliveryDrivers[0]?.id;
                          onDispatchOrder(order.id, driverId);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch to Van</span>
                      </button>
                    )}

                    {/* Action 2: Complete Delivery */}
                    {(isPending || isDispatched) && (
                      <button
                        onClick={() => openCompleteModal(order)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Deliver & Collect</span>
                      </button>
                    )}

                    {/* Action 4: Official Printable Invoice */}
                    <button
                      onClick={() => {
                        setSelectedDocOrder(order);
                        setDocModalType('invoice');
                      }}
                      title="Generate Official Invoice"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>

                    {/* Action 5: Delivery Gate Pass Slip */}
                    <button
                      onClick={() => {
                        setSelectedDocOrder(order);
                        setDocModalType('delivery_slip');
                      }}
                      title="Print Delivery Slip & Gate Pass"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Slip</span>
                    </button>

                    {isDelivered && (
                      <span className="text-[11px] text-slate-400">
                        {order.bottlesDelivered} delivered • {order.bottlesReturned} empties returned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Book Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-cyan-300">Book Customer Water Order</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live pricing formula: qty × unit price − discount + delivery charges
            </p>

            <form onSubmit={handleCreateOrderSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Customer</label>
                <select
                  value={selectedCustId}
                  onChange={(e) => setSelectedCustId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.area} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Order Items</label>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderItems([
                        ...orderItems,
                        { productId: products[0]?.id || '', quantity: 1 },
                      ])
                    }
                    className="text-[11px] text-cyan-400 hover:underline font-bold"
                  >
                    + Add Product Line
                  </button>
                </div>

                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const next = [...orderItems];
                        next[idx].productId = e.target.value;
                        setOrderItems(next);
                      }}
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rs. {p.unitPrice}) - Avail: {p.stockFull}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...orderItems];
                        next[idx].quantity = parseInt(e.target.value, 10) || 1;
                        setOrderItems(next);
                      }}
                      className="w-20 rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 text-center"
                    />

                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Discount & Delivery Charges */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Discount (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Charges (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCharges}
                    onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Live Net Total Box */}
              <div className="p-3 bg-slate-950 rounded-xl border border-cyan-900/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Subtotal: Rs. {saleCalc.subtotal}</span>
                  <p className="text-[11px] text-cyan-400">Net Payable Total:</p>
                </div>
                <span className="text-xl font-black text-cyan-300">Rs. {saleCalc.netTotal}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Assign Route Driver</label>
                  <select
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  >
                    {deliveryDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="collectImmediateCheck"
                  checked={collectImmediateCash}
                  onChange={(e) => setCollectImmediateCash(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 bg-slate-950 border-slate-700"
                />
                <label htmlFor="collectImmediateCheck" className="text-xs text-slate-300">
                  Prepaid / Paid upfront at booking (credits cash immediately)
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Order Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Leave with security guard if not home"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition cursor-pointer"
                >
                  Confirm Order Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complete Delivery at Doorstep */}
      {completingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-emerald-400">Complete Delivery</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Confirm bottles delivered, empty bottles collected, and payment received
            </p>

            <form onSubmit={handleCompleteSubmit} className="mt-4 space-y-3.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <p className="font-bold text-white">{completingOrder.customerName}</p>
                <p className="text-slate-400">{completingOrder.area} • Order total: Rs. {completingOrder.netTotal}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Bottles Delivered</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={deliveredCount}
                    onChange={(e) => setDeliveredCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Empties Retrieved</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={returnedEmpties}
                    onChange={(e) => setReturnedEmpties(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Collected (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={cashCollected}
                    onChange={(e) => setCashCollected(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  >
                    <option value="cash">Cash (Doorstep)</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">EasyPaisa</option>
                  </select>
                </div>
              </div>

              {cashCollected < completingOrder.netTotal && (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-[11px] text-amber-300">
                  Partial payment: Remaining Rs. {completingOrder.netTotal - cashCollected} will remain outstanding on customer ledger.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-lg"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Failed Delivery */}
      {failingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-rose-400">Report Failed Delivery Trip</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Full bottles will be returned to warehouse inventory after confirmation
            </p>

            <form onSubmit={handleFailSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Full Bottles Returned to Warehouse
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={fullReturned}
                  onChange={(e) => setFullReturned(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reason for Failure</label>
                <input
                  type="text"
                  required
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailingOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition shadow-lg"
                >
                  Confirm & Restore Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Invoice and Delivery Slip Modal */}
      {selectedDocOrder && settings && (
        <DocumentModal
          isOpen={!!selectedDocOrder}
          onClose={() => setSelectedDocOrder(null)}
          type={docModalType}
          settings={settings}
          order={selectedDocOrder}
          customer={customers.find((c) => c.id === selectedDocOrder.customerId)}
        />
      )}
    </div>
  );
};
