import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";
import {
  useGetInvoice,
  useGetMyInvoices,
  useGetMyStoreProfile,
} from "../hooks/useQueries";

interface PrintInvoicePageProps {
  invoiceId: bigint | null;
  onBack: () => void;
}

function formatCurrency(value: bigint): string {
  const num = Number(value) / 100;
  return `Rs. ${num.toFixed(2)}`;
}

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PrintInvoicePage({
  invoiceId,
  onBack,
}: PrintInvoicePageProps) {
  const { data: invoice, isLoading } = useGetInvoice(invoiceId);
  const { data: allInvoices } = useGetMyInvoices();
  const { data: storeProfile } = useGetMyStoreProfile();

  const invoiceNumber = (() => {
    if (!invoice || !allInvoices) return "INV-001";
    const sorted = [...allInvoices].sort((a, b) =>
      Number(a.createdAt - b.createdAt),
    );
    const idx = sorted.findIndex((inv) => inv.id === invoice.id);
    return `INV-${String(idx + 1).padStart(3, "0")}`;
  })();

  const storeName = storeProfile?.storeName || "Your Store";
  const storeIdFormatted = storeProfile
    ? `#${String(Number(storeProfile.storeId)).padStart(4, "0")}`
    : null;
  const storeMobile = storeProfile?.mobile || null;
  const storeAddress = storeProfile?.address || null;
  const storeGstin = storeProfile?.gstin || null;

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full max-w-sm" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex-1 p-6">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 animate-fade-in">
      <div className="no-print flex items-center justify-between mb-6">
        <Button
          data-ocid="print.back.button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          data-ocid="print.print.primary_button"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Invoice
        </Button>
      </div>

      <div className="no-print mb-4">
        <p className="text-xs text-muted-foreground text-center">
          Preview — 80mm thermal format
        </p>
      </div>

      <div
        id="thermal-print"
        className="bg-white border border-border rounded mx-auto font-mono text-black"
        style={{ width: "302px", padding: "12px" }}
      >
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h1 className="text-base font-bold tracking-wide uppercase">
            {storeName}
          </h1>
          {storeIdFormatted && (
            <p className="text-xs">Store ID: {storeIdFormatted}</p>
          )}
          {storeAddress && <p className="text-xs">{storeAddress}</p>}
          {storeMobile && <p className="text-xs">Tel: {storeMobile}</p>}
          {storeGstin && <p className="text-xs">GSTIN: {storeGstin}</p>}
        </div>

        <div className="text-xs mb-3">
          <div className="flex justify-between">
            <span className="font-semibold">Invoice #:</span>
            <span>{invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{formatDate(invoice.date)}</span>
          </div>
        </div>

        <div className="text-xs border-t border-dashed border-gray-400 pt-2 mb-3">
          <p className="font-semibold mb-1">Bill To:</p>
          <p>{invoice.customerName}</p>
          {invoice.customerAddress && (
            <p className="text-gray-600">{invoice.customerAddress}</p>
          )}
          {invoice.phone && <p>Ph: {invoice.phone}</p>}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-2 mb-3">
          <div className="flex text-xs font-bold border-b border-gray-300 pb-1 mb-1">
            <span className="flex-1">Item</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-16 text-right">Price</span>
            <span className="w-16 text-right">Amt</span>
          </div>
          {invoice.items.map((item, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${item.name}-${idx}`} className="flex text-xs py-0.5">
              <span className="flex-1 truncate">{item.name}</span>
              <span className="w-8 text-center">{item.qty.toString()}</span>
              <span className="w-16 text-right">
                {(Number(item.unitPrice) / 100).toFixed(2)}
              </span>
              <span className="w-16 text-right">
                {(Number(item.qty * item.unitPrice) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-2 mb-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({Number(invoice.taxPercent) / 100}%):</span>
            <span>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-gray-400 pt-1 text-sm">
            <span>TOTAL:</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="border-t border-dashed border-gray-400 pt-2 mb-3 text-xs">
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}

        <div className="border-t border-dashed border-gray-400 pt-2 text-center text-xs text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-1">** Valid Invoice **</p>
        </div>
      </div>
    </div>
  );
}
