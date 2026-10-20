import React, { useRef } from 'react';
import { BusinessSettings, Order, PaymentReceipt, Customer } from '../types';
import { BluviaLogo } from './BluviaLogo';
import { Printer, X, CheckCircle, FileText, Download } from 'lucide-react';

export type DocumentType = 'invoice' | 'receipt' | 'delivery_slip' | 'report';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: DocumentType;
  settings: BusinessSettings;
  order?: Order;
  receipt?: PaymentReceipt;
  customer?: Customer;
  reportData?: {
    totalSales: number;
    cashCollected: number;
    totalOrders: number;
    completedDeliveries: number;
    totalBottlesFull: number;
    totalBottlesEmpty: number;
    totalBottlesInTransit: number;
    customerHeldBottles: number;
    outstandingBalance: number;
    cashBalance: number;
  };
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  type,
  settings,
  order,
  receipt,
  customer,
  reportData,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getDocTitle = () => {
    switch (type) {
      case 'invoice':
        return `Tax Invoice • ${order?.orderNumber || 'ORD'}`;
      case 'receipt':
        return `Official Payment Receipt • ${receipt?.receiptNumber || 'RCP'}`;
      case 'delivery_slip':
        return `Water Delivery Slip & Bottle Gate Pass • ${order?.orderNumber || 'DEL'}`;
      case 'report':
        return `Daily Business Summary Report • ${new Date().toLocaleDateString()}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">{getDocTitle()}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (Styled cleanly in white/print theme) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          <div
            ref={printRef}
            className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto border border-slate-200 print:border-none print:shadow-none print:p-0 font-sans text-xs"
          >
            {/* Header with authentic BLUVIA Logo */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-5">
              <div className="flex items-center gap-4">
                <BluviaLogo
                  size="xl"
                  logoUrl={settings.logoUrl}
                  variant="plain"
                  alt={settings.businessName}
                  className="w-20 h-20 sm:w-24 sm:h-24"
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
                    {settings.businessName}
                  </h1>
                  <p className="text-[11px] font-semibold text-sky-800">
                    {settings.tagline}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    <strong>Owner:</strong> {settings.ownerName || 'Taqveem Ahsan Pasha'} • <strong>Email:</strong> {settings.email}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <strong>Phone:</strong> {settings.phone} • <strong>Plant:</strong> {settings.address}, {settings.city}
                  </p>
                  {settings.taxRegistrationNumber && (
                    <p className="text-[10px] text-slate-500">{settings.taxRegistrationNumber}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-sky-950 text-white font-mono text-xs font-bold uppercase tracking-wider">
                  {type === 'invoice' && 'INVOICE'}
                  {type === 'receipt' && 'RECEIPT'}
                  {type === 'delivery_slip' && 'DELIVERY SLIP'}
                  {type === 'report' && 'SUMMARY'}
                </span>
                <p className="text-[11px] font-bold text-slate-800 mt-2">
                  Date: {new Date().toLocaleDateString('en-GB')}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Ref: {order?.orderNumber || receipt?.receiptNumber || 'DOC-' + Date.now().toString().slice(-6)}
                </p>
              </div>
            </div>

            {/* Document Specific Body */}

            {/* 1. INVOICE */}
            {type === 'invoice' && order && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Billed To</span>
                    <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
                    <p className="text-slate-600">{order.area}</p>
                    {customer && <p className="text-slate-600">{customer.address}</p>}
                    {customer?.phone && <p className="text-slate-600 font-mono">Tel: {customer.phone}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Order Details</span>
                    <p className="text-slate-700">Order No: <strong>{order.orderNumber}</strong></p>
                    <p className="text-slate-700">Delivery Date: <strong>{order.deliveryDate}</strong></p>
                    <p className="text-slate-700">
                      Payment Status:{' '}
                      <strong className={order.paymentStatus === 'paid' ? 'text-emerald-700 uppercase' : 'text-rose-700 uppercase'}>
                        {order.paymentStatus}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px]">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price (PKR)</th>
                      <th className="py-2 text-right">Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-medium text-slate-900">{item.productName}</td>
                        <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 text-right font-mono">Rs. {item.unitPrice}</td>
                        <td className="py-2.5 text-right font-mono font-bold">Rs. {item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Calculation */}
                <div className="border-t-2 border-slate-900 pt-3 flex justify-end">
                  <div className="w-64 space-y-1 text-right">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">Rs. {order.subtotal}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span className="font-mono">- Rs. {order.discount}</span>
                      </div>
                    )}
                    {order.deliveryCharges > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery Charges:</span>
                        <span className="font-mono">+ Rs. {order.deliveryCharges}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-950 border-t border-slate-300 pt-1">
                      <span>Net Total:</span>
                      <span className="font-mono text-sky-800">Rs. {order.netTotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-0.5">
                      <span>Amount Paid:</span>
                      <span className="font-mono">Rs. {order.paidAmount}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-0.5">
                      <span>Balance Outstanding:</span>
                      <span className="font-mono text-rose-700">Rs. {order.netTotal - order.paidAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RECEIPT */}
            {type === 'receipt' && receipt && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block">
                    Payment Received With Thanks
                  </span>
                  <div className="text-3xl font-black text-emerald-700 font-mono my-2">
                    Rs. {receipt.amount.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-600">
                    Payment Method: <strong className="uppercase">{receipt.paymentMethod.replace('_', ' ')}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Received From</span>
                    <p className="font-bold text-sm text-slate-900">{receipt.customerName}</p>
                    {receipt.allocatedOrderId && (
                      <p className="text-slate-600 font-mono text-[11px]">Allocated to: {receipt.allocatedOrderId}</p>
                    )}
                    {receipt.referenceNumber && (
                      <p className="text-slate-600 font-mono text-[11px]">Trans Ref: {receipt.referenceNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Receipt Info</span>
                    <p className="text-slate-700">Receipt No: <strong>{receipt.receiptNumber}</strong></p>
                    <p className="text-slate-700">Collected By: <strong>{receipt.collectedByName}</strong></p>
                    <p className="text-slate-700">Date: <strong>{new Date(receipt.createdAt).toLocaleString()}</strong></p>
                  </div>
                </div>

                {receipt.notes && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                    <strong>Memo:</strong> {receipt.notes}
                  </div>
                )}
              </div>
            )}

            {/* 3. DELIVERY SLIP */}
            {type === 'delivery_slip' && order && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Delivery Destination</span>
                    <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
                    <p className="text-slate-600">{order.area}</p>
                    {customer?.address && <p className="text-slate-600">{customer.address}</p>}
                    {customer?.phone && <p className="text-slate-600 font-mono">Contact: {customer.phone}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Delivery Route & Van</span>
                    <p className="text-slate-700">Assigned Driver: <strong>{order.assignedStaffName || 'Van 1'}</strong></p>
                    <p className="text-slate-700">Target Date: <strong>{order.deliveryDate}</strong></p>
                    <p className="text-slate-700">Gate Pass: <strong>PASS-{order.orderNumber}</strong></p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px]">
                      <th className="py-2">Item</th>
                      <th className="py-2 text-center">Ordered Qty</th>
                      <th className="py-2 text-center">Delivered Qty</th>
                      <th className="py-2 text-center">Empty Ret.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-medium text-slate-900">{item.productName}</td>
                        <td className="py-2 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 text-center border-b border-dashed border-slate-300">
                          {order.bottlesDelivered > 0 ? order.bottlesDelivered : '_______'}
                        </td>
                        <td className="py-2 text-center border-b border-dashed border-slate-300">
                          {order.bottlesReturned > 0 ? order.bottlesReturned : '_______'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {order.notes && (
                  <p className="text-slate-600 text-[11px] p-2 bg-slate-50 rounded border border-slate-200">
                    <strong>Instructions:</strong> {order.notes}
                  </p>
                )}

                {/* Driver & Customer Signatures */}
                <div className="pt-8 grid grid-cols-3 gap-6 text-center border-t border-slate-300 text-[10px] text-slate-600">
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-8"></div>
                    <p className="font-bold text-slate-900">Dispatched By (Warehouse)</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-8"></div>
                    <p className="font-bold text-slate-900">Delivery Driver Signature</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-8"></div>
                    <p className="font-bold text-slate-900">Customer Receiver Stamp</p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. BUSINESS SUMMARY REPORT */}
            {type === 'report' && reportData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-800 uppercase block">Today Sales</span>
                    <span className="text-lg font-black text-sky-900 font-mono">
                      Rs. {reportData.totalSales.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Cash Collected</span>
                    <span className="text-lg font-black text-emerald-900 font-mono">
                      Rs. {reportData.cashCollected.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">Receivables</span>
                    <span className="text-lg font-black text-rose-900 font-mono">
                      Rs. {reportData.outstandingBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-800 uppercase block">Register Cash</span>
                    <span className="text-lg font-black text-purple-900 font-mono">
                      Rs. {reportData.cashBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    19-Liter Polycarbonate Bottle Circulation Health
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Full at Plant</span>
                      <strong className="text-sky-900 text-sm">{reportData.totalBottlesFull}</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Empty at Plant</span>
                      <strong className="text-teal-900 text-sm">{reportData.totalBottlesEmpty}</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">In Transit (Vans)</span>
                      <strong className="text-amber-800 text-sm">{reportData.totalBottlesInTransit}</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Held by Customers</span>
                      <strong className="text-indigo-900 text-sm">{reportData.customerHeldBottles}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between text-slate-600 text-[11px]">
                  <span>Authorized by: <strong>{settings.ownerName || 'Taqveem Ahsan Pasha'}</strong></span>
                  <span>Generated by BLUVIA Business Manager</span>
                </div>
              </div>
            )}

            {/* Footer Notice */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
              <p>
                This is a computer-generated document issued by {settings.businessName}.
              </p>
              <p>
                Pure Mineral Water • ISO & PSQCA Standard Quality • Contact: {settings.phone} • {settings.email}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
