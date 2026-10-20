import React, { useState } from 'react';
import { Customer, Order, PaymentReceipt, CustomerCategory, UserProfile } from '../types';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Download,
  Building,
  Home,
  Store,
  Layers,
} from 'lucide-react';
import { BluviaLogo } from './BluviaLogo';
import { BusinessSettings } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  payments: PaymentReceipt[];
  currentUser: UserProfile;
  deliveryAreas: string[];
  settings?: BusinessSettings | null;
  onSaveCustomer: (customerData: Partial<Customer>) => Promise<void>;
  onExportCSV: () => void;
  onNavigateDeliveriesWithCustomer?: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  payments,
  currentUser,
  deliveryAreas,
  settings,
  onSaveCustomer,
  onExportCSV,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewLedgerCustomer, setViewLedgerCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState(deliveryAreas[0] || 'DHA Phase 2 & 5');
  const [category, setCategory] = useState<CustomerCategory>('residential');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [initialBottlesHeld, setInitialBottlesHeld] = useState(2);
  const [notes, setNotes] = useState('');

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setWhatsapp('');
    setAddress('');
    setArea(deliveryAreas[0] || 'DHA Phase 2 & 5');
    setCategory('residential');
    setOpeningBalance(0);
    setInitialBottlesHeld(2);
    setNotes('');
    setShowAddModal(true);
  };

  const openEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setWhatsapp(cust.whatsapp || '');
    setAddress(cust.address);
    setArea(cust.area);
    setCategory(cust.category);
    setOpeningBalance(cust.openingBalance);
    setInitialBottlesHeld(cust.bottlesHeld19L);
    setNotes(cust.notes || '');
    setShowAddModal(true);
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveCustomer({
      id: editingCustomer ? editingCustomer.id : undefined,
      name,
      phone,
      whatsapp: whatsapp || phone,
      address,
      area,
      category,
      openingBalance: Number(openingBalance),
      outstandingBalance: editingCustomer ? editingCustomer.outstandingBalance : Number(openingBalance),
      bottlesHeld19L: Number(initialBottlesHeld),
      notes,
    });
    setShowAddModal(false);
  };

  // Filter customers
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone.includes(searchQuery) ||
      cust.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea = selectedArea === 'all' || cust.area === selectedArea;
    const matchesCategory = selectedCategory === 'all' || cust.category === selectedCategory;

    return matchesSearch && matchesArea && matchesCategory;
  });

  const getCategoryBadge = (cat: CustomerCategory) => {
    switch (cat) {
      case 'residential':
        return { label: 'Residential', icon: Home, color: 'bg-blue-950/80 text-blue-300 border-blue-800' };
      case 'commercial':
        return { label: 'Commercial', icon: Store, color: 'bg-teal-950/80 text-teal-300 border-teal-800' };
      case 'corporate':
        return { label: 'Corporate', icon: Building, color: 'bg-purple-950/80 text-purple-300 border-purple-800' };
      case 'distributor':
        return { label: 'Distributor', icon: Layers, color: 'bg-amber-950/80 text-amber-300 border-amber-800' };
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Filter and Actions Bar */}
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
                <Users className="w-5 h-5 text-cyan-400" />
                Customer Directory & Delivery Accounts
              </h2>
              <p className="text-xs text-slate-400">
                Total {customers.length} registered accounts across {deliveryAreas.length} routes • {settings?.businessName || 'BLUVIA Fresh'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role !== 'delivery' && (
              <button
                onClick={openAddCustomer}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            )}
            <button
              onClick={onExportCSV}
              title="Export Customer Ledger CSV"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, phone, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="all">All Delivery Areas ({deliveryAreas.length})</option>
            {deliveryAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial / Clinics</option>
            <option value="corporate">Corporate Offices</option>
            <option value="distributor">Retail Stores / Distributors</option>
          </select>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No customers match your search criteria.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const catBadge = getCategoryBadge(cust.category);
            const CatIcon = catBadge.icon;
            const hasOverdue = cust.outstandingBalance > 0;

            return (
              <div
                key={cust.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${catBadge.color}`}>
                        <CatIcon className="w-3 h-3" />
                        {catBadge.label}
                      </span>
                      <h3 className="text-base font-bold text-white mt-2 leading-snug">{cust.name}</h3>
                    </div>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                      {cust.bottlesHeld19L} <span className="text-[9px] font-normal text-slate-400">Bottles</span>
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <a href={`tel:${cust.phone}`} className="hover:text-cyan-300 underline font-mono">
                        {cust.phone}
                      </a>
                    </p>
                    <p className="flex items-start gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cust.address}</span>
                    </p>
                    <p className="text-[11px] font-semibold text-cyan-400/90">
                      Route: {cust.area}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400">Ledger Balance:</span>
                    <span
                      className={`text-sm font-black ${
                        hasOverdue ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {hasOverdue ? `Rs. ${cust.outstandingBalance.toLocaleString()} Due` : 'Clear (Rs. 0)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewLedgerCustomer(cust)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                    {currentUser.role !== 'delivery' && (
                      <button
                        onClick={() => openEditCustomer(cust)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Customer Ledger Statement */}
      {viewLedgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-cyan-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Customer Statement & Financial Ledger
                </span>
                <h3 className="text-lg font-bold text-white">{viewLedgerCustomer.name}</h3>
                <p className="text-xs text-slate-400">
                  Phone: {viewLedgerCustomer.phone} • Route: {viewLedgerCustomer.area}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Current Balance</span>
                <span className="text-lg font-black text-rose-400">
                  Rs. {viewLedgerCustomer.outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="my-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-slate-400 block">Opening Balance</span>
                <span className="font-bold text-slate-200">Rs. {viewLedgerCustomer.openingBalance}</span>
              </div>
              <div>
                <span className="text-slate-400 block">19L Bottles In Hand</span>
                <span className="font-bold text-cyan-300">{viewLedgerCustomer.bottlesHeld19L} bottles</span>
              </div>
              <div>
                <span className="text-slate-400 block">Net Outstanding</span>
                <span className="font-bold text-rose-400">Rs. {viewLedgerCustomer.outstandingBalance}</span>
              </div>
            </div>

            {/* Order and Payment Timeline for this customer */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mt-2 mb-1">
                Transaction Timeline (Audited)
              </h4>

              {orders
                .filter((o) => o.customerId === viewLedgerCustomer.id)
                .map((o) => (
                  <div key={o.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-cyan-300 font-bold">{o.orderNumber}</span>
                        <span className="text-slate-400 text-[11px]">({o.deliveryDate})</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {o.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-200 block">+ Rs. {o.netTotal}</span>
                      <span className={`text-[10px] font-semibold capitalize ${o.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {o.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}

              {payments
                .filter((p) => p.customerId === viewLedgerCustomer.id)
                .map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/60 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-emerald-400 font-bold">{p.receiptNumber}</span>
                        <span className="text-slate-400 text-[11px]">
                          ({new Date(p.createdAt).toLocaleDateString()})
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-300/80 capitalize">
                        Method: {p.paymentMethod.replace('_', ' ')} • Collected by: {p.collectedByName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-400 block">- Rs. {p.amount}</span>
                      <span className="text-[10px] text-emerald-300">Payment Credited</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-2 flex justify-end">
              <button
                onClick={() => setViewLedgerCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Customer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-cyan-300">
              {editingCustomer ? 'Edit Customer Record' : 'Register New Customer Account'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured with address, delivery route, and bottle deposit tracking
            </p>

            <form onSubmit={handleSubmitCustomer} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name / Business Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Asad Ullah (Clinic)"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number (Calling)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">WhatsApp (for receipts)</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Route / Area</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  >
                    {deliveryAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CustomerCategory)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial / Clinic</option>
                    <option value="corporate">Corporate Office</option>
                    <option value="distributor">Distributor / Store</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Complete Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Street #, Sector/Plaza"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Opening Balance (Rs.)</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">19L Bottles Held</label>
                  <input
                    type="number"
                    min="0"
                    value={initialBottlesHeld}
                    onChange={(e) => setInitialBottlesHeld(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Preferences / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ring bell twice, deliver Monday & Thursday morning"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition"
                >
                  {editingCustomer ? 'Update Record' : 'Save Customer Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
