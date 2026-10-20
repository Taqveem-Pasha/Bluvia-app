import React, { useState } from 'react';
import { Product, UserProfile } from '../types';
import {
  evaluateProductStock,
  detectLowStockProducts,
  LowStockItemResult,
} from '../core/calculations';
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  TrendingDown,
  CheckCircle2,
  Sliders,
  RotateCcw,
  PlusCircle,
  Copy,
  Check,
  Building2,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LowStockWidgetProps {
  products: Product[];
  currentUser: UserProfile;
  onNavigateTab: (tab: any) => void;
  onOpenQuickAction: (actionType?: string, prefillProductId?: string) => void;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({
  products,
  currentUser,
  onNavigateTab,
  onOpenQuickAction,
}) => {
  // Threshold mode: 'configured' (use product.minStockLevel) or 'custom'
  const [thresholdMode, setThresholdMode] = useState<'configured' | 'custom'>('configured');
  const [customThreshold, setCustomThreshold] = useState<number>(30);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<'low_only' | 'all'>('low_only');
  const [copiedList, setCopiedList] = useState(false);

  // Compute evaluations
  const activeThreshold = thresholdMode === 'custom' ? customThreshold : undefined;
  
  // Filter by category first if selected
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const analysis = detectLowStockProducts(filteredProducts, activeThreshold);

  // All evaluated items for the 'all' view
  const allEvaluatedItems: LowStockItemResult[] = filteredProducts.map((p) =>
    evaluateProductStock(p, activeThreshold)
  ).sort((a, b) => {
    if (a.isLowStock !== b.isLowStock) return a.isLowStock ? -1 : 1;
    if (a.isOutOfStock !== b.isOutOfStock) return a.isOutOfStock ? -1 : 1;
    return a.stockLevelPercent - b.stockLevelPercent;
  });

  const displayItems = viewFilter === 'low_only' ? analysis.lowStockItems : allEvaluatedItems;

  const handleCopyReorderList = () => {
    if (analysis.lowStockItems.length === 0) return;
    const dateStr = new Date().toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const header = `*BLUVIA Premium Water - Low Stock Reorder Order (${dateStr})*\n\n`;
    const lines = analysis.lowStockItems.map((item, idx) => {
      const p = item.product;
      return `${idx + 1}. *${p.name}*\n   - Current Stock: ${p.stockFull} units\n   - Safety Buffer: ${item.thresholdUsed} units\n   - Recommended Reorder: ${item.recommendedReorderQty} units\n   - Est. Cost @ Rs. ${p.costPrice || 0}: Rs. ${item.estimatedRestockCost.toLocaleString()}`;
    });
    const footer = `\n\nTotal Estimated Restock Cost: Rs. ${analysis.totalEstimatedRestockCost.toLocaleString()} PKR\nGenerated from BLUVIA Business Manager`;
    
    navigator.clipboard.writeText(header + lines.join('\n\n') + footer).then(() => {
      setCopiedList(true);
      setTimeout(() => setCopiedList(false), 3000);
    });
  };

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'reusable_19l', label: '19L Reusable' },
    { id: 'pet_bottles', label: 'PET Bottles' },
    { id: 'dispenser_accessories', label: 'Dispensers & Pumps' },
    { id: 'bulk_water', label: 'Bulk Water' },
  ];

  const quickCustomPills = [10, 20, 30, 50, 100];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/40 border border-slate-800 hover:border-cyan-800/60 rounded-3xl p-4 sm:p-6 shadow-2xl transition duration-300">
      {/* Top Header & Alert Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              analysis.criticalCount > 0
                ? 'bg-rose-950/90 text-rose-400 border border-rose-800 animate-pulse'
                : analysis.lowStockItems.length > 0
                ? 'bg-amber-950/90 text-amber-400 border border-amber-800'
                : 'bg-emerald-950/90 text-emerald-400 border border-emerald-800'
            }`}>
              {analysis.lowStockItems.length > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Low Stock & Reorder Monitor
                </h3>
                {analysis.lowStockItems.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    {analysis.lowStockItems.length} Low Stock
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Stock Healthy
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Proactively reorder supplies before delivery disruption • Pakistan Distribution
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {analysis.lowStockItems.length > 0 && (
            <button
              onClick={handleCopyReorderList}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Copy supplier / production reorder shopping list to clipboard"
            >
              {copiedList ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">List Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Copy Reorder List</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onOpenQuickAction('stock')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Stock In / Refill</span>
          </button>
        </div>
      </div>

      {/* Threshold Configuration & Controls Bar */}
      <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Threshold Definition:
          </span>
          <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => setThresholdMode('configured')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                thresholdMode === 'configured'
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Product Minimum Buffers
            </button>
            <button
              onClick={() => setThresholdMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                thresholdMode === 'custom'
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom Global Threshold
            </button>
          </div>

          {thresholdMode === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-slate-400 text-[11px]">Below:</span>
              <div className="flex items-center gap-1">
                {quickCustomPills.map((val) => (
                  <button
                    key={val}
                    onClick={() => setCustomThreshold(val)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                      customThreshold === val
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {val}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={customThreshold}
                  onChange={(e) => setCustomThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-12 ml-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 text-center font-bold text-xs"
                />
                <span className="text-slate-400 text-[11px]">units</span>
              </div>
            </div>
          )}
        </div>

        {/* View mode toggle: Low Only vs All Products */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => setViewFilter('low_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewFilter === 'low_only'
                  ? 'bg-rose-600/90 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Low Stock Only ({analysis.lowStockItems.length})
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Catalog ({filteredProducts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-thin">
        <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Aggregated Restock Budget & Deficit Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">Below Safety Threshold</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">
            {analysis.lowStockItems.length}
            <span className="text-xs font-normal text-slate-400 ml-1">products</span>
          </p>
          <span className="text-[10px] text-slate-500">Requires production or purchase</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">Critical / Depleted</span>
          <p className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
            {analysis.criticalCount}
            <span className="text-xs font-normal text-rose-300/70 ml-1">urgent</span>
          </p>
          <span className="text-[10px] text-rose-400/70">At 0% or &lt;30% buffer</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">Deficit to Safe Stock</span>
          <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
            +{analysis.totalDeficitUnits}
            <span className="text-xs font-normal text-slate-400 ml-1">units</span>
          </p>
          <span className="text-[10px] text-slate-500">To reach 1.5x buffer capacity</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">Est. Restock Budget</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            Rs. {analysis.totalEstimatedRestockCost.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400/70">Wholesale cost in PKR</span>
        </div>
      </div>

      {/* Low Stock Product Cards */}
      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <div className="py-10 text-center rounded-2xl bg-slate-950/40 border border-slate-800/60 p-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">All Stock Levels Healthy!</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              No products fall below the current safety threshold of{' '}
              {thresholdMode === 'configured' ? 'configured minimum levels' : `${customThreshold} units`}.
            </p>
            <button
              onClick={() => {
                setThresholdMode('custom');
                setCustomThreshold(50);
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulate Surge Demand Threshold (50 units)
            </button>
          </div>
        ) : (
          displayItems.map((item) => {
            const p = item.product;
            const isCritical = item.isOutOfStock || item.stockLevelPercent <= 30;
            const isSafe = !item.isLowStock;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  item.isOutOfStock
                    ? 'bg-rose-950/40 border-rose-800/90 shadow-rose-950/20 shadow-lg'
                    : isCritical
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : item.isLowStock
                    ? 'bg-amber-950/20 border-amber-800/60'
                    : 'bg-slate-950/40 border-slate-800/80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Product Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                        item.isOutOfStock
                          ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                          : isCritical
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : item.isLowStock
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-teal-950 text-teal-400 border border-teal-800'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {p.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                          {(p.category || 'general').replace('_', ' ')}
                        </span>
                        {item.isOutOfStock ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                            Out of Stock (0)
                          </span>
                        ) : isCritical ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-900/60 text-rose-300 border border-rose-700">
                            Critical Low ({item.stockLevelPercent}% of buffer)
                          </span>
                        ) : item.isLowStock ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-900/60 text-amber-300 border border-amber-700">
                            Low Stock Warning
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-800">
                            Adequate Stock
                          </span>
                        )}
                      </div>

                      {/* Stock Counts vs Buffer Target & Visual Progress Bar */}
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            Available Ready Stock: <strong className={`font-black ${
                              item.isOutOfStock
                                ? 'text-rose-400'
                                : isCritical
                                ? 'text-rose-300'
                                : item.isLowStock
                                ? 'text-amber-300'
                                : 'text-emerald-400'
                            }`}>{p.stockFull} units</strong>
                          </span>
                          <span className="text-slate-400">
                            Safety Threshold:{' '}
                            <strong className="text-slate-200">{item.thresholdUsed} units</strong>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.isOutOfStock
                                ? 'w-0'
                                : isCritical
                                ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                                : item.isLowStock
                                ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-400'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, item.stockLevelPercent))}%`,
                            }}
                          />
                        </div>

                        {/* Reusable Bottle Context (Empties at plant) */}
                        {p.isReusableBottle && (p.stockEmpty ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-teal-300/90 pt-0.5">
                            <RotateCcw className="w-3 h-3 text-teal-400" />
                            <span>
                              <strong>{p.stockEmpty} empty bottles</strong> available at plant for immediate washing & refilling!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Reorder Recommendation & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                    <div className="text-left md:text-right">
                      {item.isLowStock ? (
                        <>
                          <div className="flex items-center md:justify-end gap-1 text-xs font-bold text-amber-300">
                            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Reorder Deficit: -{item.deficit} units</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Target: <span className="text-cyan-300 font-semibold">+{item.recommendedReorderQty} units</span> (Est. Rs. {item.estimatedRestockCost.toLocaleString()})
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Buffer satisfied (+{p.stockFull - item.thresholdUsed} over min)
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenQuickAction('stock', p.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer ${
                          item.isOutOfStock || isCritical
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                            : item.isLowStock
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                      
                      <button
                        onClick={() => onNavigateTab('stock')}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                        title="Open inventory ledger and stock movement records"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Tip */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Supply orders reflect directly into your cash book, supplier payable ledger, and stock movement records.
          </span>
        </div>
        <button
          onClick={() => onNavigateTab('stock')}
          className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
        >
          Manage All Products & Supplier Balances →
        </button>
      </div>
    </div>
  );
};
