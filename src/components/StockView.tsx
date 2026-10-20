import React, { useState } from 'react';
import { Product, Supplier, StockMovement, UserProfile } from '../types';
import {
  Package,
  Plus,
  RotateCcw,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';

interface StockViewProps {
  products: Product[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  currentUser: UserProfile;
  onRecordStockPurchase: (purchase: {
    productId: string;
    supplierId: string;
    quantity: number;
    unitCost: number;
    paidCash: boolean;
    notes?: string;
  }) => Promise<void>;
  onRecordDamageOrAdjustment: (adjustment: {
    productId: string;
    type: 'damaged' | 'adjustment';
    fullDelta: number;
    emptyDelta: number;
    damagedDelta: number;
    notes: string;
  }) => Promise<void>;
  onExportCSV: () => void;
}

export const StockView: React.FC<StockViewProps> = ({
  products,
  suppliers,
  stockMovements,
  currentUser,
  onRecordStockPurchase,
  onRecordDamageOrAdjustment,
  onExportCSV,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements' | 'suppliers'>('inventory');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);

  // Form states
  const [purchaseProdId, setPurchaseProdId] = useState(products[0]?.id || '');
  const [purchaseSupplierId, setPurchaseSupplierId] = useState(suppliers[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState(100);
  const [purchaseUnitCost, setPurchaseUnitCost] = useState(45);
  const [purchasePaidCash, setPurchasePaidCash] = useState(true);
  const [purchaseNotes, setPurchaseNotes] = useState('Bulk stock replenishment');

  // Damage form states
  const [damageProdId, setDamageProdId] = useState(products[0]?.id || '');
  const [damageCount, setDamageCount] = useState(2);
  const [damageNotes, setDamageNotes] = useState('Cracked neck during plant washing');

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRecordStockPurchase({
      productId: purchaseProdId,
      supplierId: purchaseSupplierId,
      quantity: Number(purchaseQty),
      unitCost: Number(purchaseUnitCost),
      paidCash: purchasePaidCash,
      notes: purchaseNotes,
    });
    setShowPurchaseModal(false);
  };

  const handleDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRecordDamageOrAdjustment({
      productId: damageProdId,
      type: 'damaged',
      fullDelta: 0,
      emptyDelta: -Number(damageCount),
      damagedDelta: Number(damageCount),
      notes: damageNotes,
    });
    setShowDamageModal(false);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header with Sub-tabs and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'inventory' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Products & Bottles
          </button>
          <button
            onClick={() => setActiveSubTab('movements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'movements' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Movement Ledger ({stockMovements.length})
          </button>
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'suppliers' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role !== 'delivery' && (
            <>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Receive Stock Purchase</span>
              </button>
              <button
                onClick={() => setShowDamageModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800 text-rose-300 text-xs font-semibold rounded-xl cursor-pointer transition"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Log Damaged Bottle</span>
              </button>
            </>
          )}
          <button
            onClick={onExportCSV}
            title="Download Stock CSV"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl cursor-pointer transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtab 1: Products & Bottle Circulation Table */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const isLow = product.stockFull <= product.minStockLevel;
              return (
                <div
                  key={product.id}
                  className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg transition ${
                    isLow ? 'border-amber-700/80 bg-amber-950/10' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {product.category.replace('_', ' ')}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5 leading-snug">{product.name}</h3>
                      <p className="text-xs text-slate-400">
                        Capacity: {product.capacityLiters > 0 ? `${product.capacityLiters} Liters` : 'Accessory'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Retail Price:</span>
                      <p className="font-extrabold text-cyan-400 text-sm">Rs. {product.unitPrice}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Cost Price:</span>
                      <p className="font-extrabold text-slate-300 text-sm">Rs. {product.costPrice}</p>
                    </div>
                  </div>

                  {/* Bottle Specific Balances */}
                  {product.isReusableBottle ? (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-900/60">
                        <span className="text-[10px] text-cyan-300 block font-semibold">Full Stock</span>
                        <span className="text-base font-black text-white">{product.stockFull}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-teal-950/40 border border-teal-900/60">
                        <span className="text-[10px] text-teal-300 block font-semibold">Empty</span>
                        <span className="text-base font-black text-teal-300">{product.stockEmpty}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-900/60">
                        <span className="text-[10px] text-amber-300 block font-semibold">In Transit</span>
                        <span className="text-base font-black text-amber-300">{product.inTransit}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">In Stock:</span>
                      <span className="text-base font-black text-white">{product.stockFull} units</span>
                    </div>
                  )}

                  {product.stockDamaged > 0 && (
                    <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{product.stockDamaged} damaged/written-off</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 2: Stock Movement Ledger */}
      {activeSubTab === 'movements' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Stock Movement Audit Trail
              </h3>
              <p className="text-xs text-slate-400">Real-time log of purchases, dispatches, and returns</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Full Delta</th>
                  <th className="py-2.5 px-3 text-right">Empty Delta</th>
                  <th className="py-2.5 px-3">Notes & Reference</th>
                  <th className="py-2.5 px-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stockMovements.map((sm) => {
                  return (
                    <tr key={sm.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(sm.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{sm.productName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] uppercase">
                          {sm.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-black ${sm.fullDelta > 0 ? 'text-emerald-400' : sm.fullDelta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {sm.fullDelta > 0 ? `+${sm.fullDelta}` : sm.fullDelta}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-black ${sm.emptyDelta > 0 ? 'text-teal-400' : sm.emptyDelta < 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {sm.emptyDelta > 0 ? `+${sm.emptyDelta}` : sm.emptyDelta}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{sm.notes || sm.referenceDoc || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{sm.recordedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Suppliers */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{sup.company}</h3>
                  <p className="text-xs text-slate-400">Contact: {sup.name} • {sup.phone}</p>
                </div>
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="mt-3 p-3 bg-slate-950 rounded-xl text-xs space-y-1">
                <p className="text-slate-400"><strong className="text-slate-200">Address:</strong> {sup.address}</p>
                <p className="text-slate-400"><strong className="text-slate-200">Supplies:</strong> {sup.suppliedItems}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Balance Owed:</span>
                <span className="font-extrabold text-amber-400 text-sm">Rs. {sup.balanceOwed.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Receive Stock Purchase */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-cyan-300">Receive Stock Purchase</h3>
            <p className="text-xs text-slate-400 mt-0.5">Increases available inventory and audits supplier ledger</p>

            <form onSubmit={handlePurchaseSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Product</label>
                <select
                  value={purchaseProdId}
                  onChange={(e) => setPurchaseProdId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier</label>
                <select
                  value={purchaseSupplierId}
                  onChange={(e) => setPurchaseSupplierId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.company} ({s.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Cost Price per unit (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchaseUnitCost}
                    onChange={(e) => setPurchaseUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span>Total Purchase Value:</span>
                <span className="font-extrabold text-cyan-400 text-sm">
                  Rs. {(purchaseQty * purchaseUnitCost).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="paidCashCheck"
                  checked={purchasePaidCash}
                  onChange={(e) => setPurchasePaidCash(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 bg-slate-950 border-slate-700"
                />
                <label htmlFor="paidCashCheck" className="text-xs text-slate-300">
                  Paid immediately from Cash Register (deducts cash book)
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Bill No.</label>
                <input
                  type="text"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition"
                >
                  Confirm & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Damaged Bottle */}
      {showDamageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-900/60 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-rose-400">Log Damaged Bottle</h3>
            <p className="text-xs text-slate-400 mt-0.5">Transfers empty bottles to damaged scrap inventory</p>

            <form onSubmit={handleDamageSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Product</label>
                <select
                  value={damageProdId}
                  onChange={(e) => setDamageProdId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                >
                  {products.filter((p) => p.isReusableBottle).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Damaged Count</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={damageCount}
                  onChange={(e) => setDamageCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cause / Details</label>
                <input
                  type="text"
                  required
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDamageModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition"
                >
                  Write Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
