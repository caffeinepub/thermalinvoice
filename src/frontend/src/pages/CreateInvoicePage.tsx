import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { InvoiceItem } from "../backend.d";
import { useCreateInvoice } from "../hooks/useQueries";

interface CreateInvoicePageProps {
  onNavigate: (page: Page, invoiceId?: bigint) => void;
}

interface LineItem {
  id: number;
  name: string;
  qty: string;
  unitPrice: string;
}

let itemCounter = 0;

export default function CreateInvoicePage({
  onNavigate,
}: CreateInvoicePageProps) {
  const createInvoice = useCreateInvoice();

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [taxPercent, setTaxPercent] = useState("18");
  const [items, setItems] = useState<LineItem[]>([
    { id: ++itemCounter, name: "", qty: "1", unitPrice: "" },
  ]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: ++itemCounter, name: "", qty: "1", unitPrice: "" },
    ]);
  const removeItem = (id: number) =>
    setItems((prev) => prev.filter((item) => item.id !== id));
  const updateItem = (
    id: number,
    field: keyof Omit<LineItem, "id">,
    value: string,
  ) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const parseAmount = (val: string): bigint => {
    const num = Number.parseFloat(val) || 0;
    return BigInt(Math.round(num * 100));
  };

  const subtotal = items.reduce((sum, item) => {
    const qty = BigInt(Number.parseInt(item.qty) || 0);
    const up = parseAmount(item.unitPrice);
    return sum + qty * up;
  }, 0n);

  const tax = Number(taxPercent) || 0;
  const taxAmountVal = (subtotal * BigInt(Math.round(tax * 100))) / 10000n;
  const total = subtotal + taxAmountVal;

  const fmt = (v: bigint) => {
    const num = Number(v) / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (items.every((item) => !item.name.trim())) {
      toast.error("Add at least one item");
      return;
    }

    const dateMs = new Date(date).getTime();
    const dateNanos = BigInt(dateMs) * 1_000_000n;
    const nowNanos = BigInt(Date.now()) * 1_000_000n;

    const invoiceItems: InvoiceItem[] = items
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        qty: BigInt(Number.parseInt(item.qty) || 1),
        unitPrice: parseAmount(item.unitPrice),
      }));

    try {
      const id = await createInvoice.mutateAsync({
        id: 0n,
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        phone: phone.trim(),
        date: dateNanos,
        createdAt: nowNanos,
        notes: notes.trim(),
        taxPercent: BigInt(Math.round(tax * 100)),
        items: invoiceItems,
        subtotal,
        taxAmount: taxAmountVal,
        total,
      });
      toast.success("Invoice created!");
      onNavigate("print-invoice", id);
    } catch {
      toast.error("Failed to create invoice");
    }
  };

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pt-2">
        <Button
          data-ocid="create.back.button"
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("dashboard")}
          className="h-9 w-9 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">New Invoice</h1>
          <p className="text-xs text-muted-foreground">
            Create a thermal print invoice
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer info */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Customer Information
          </h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                data-ocid="create.customer_name.input"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                data-ocid="create.phone.input"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerAddress">Address</Label>
              <Textarea
                data-ocid="create.address.textarea"
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="123 Main Street, Mumbai, MH 400001"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date">Invoice Date</Label>
                <Input
                  data-ocid="create.date.input"
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxPercent">Tax %</Label>
                <Input
                  data-ocid="create.tax.input"
                  id="taxPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  placeholder="18"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Line Items
            </h2>
            <Button
              data-ocid="create.add_item.button"
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-1 h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {/* Desktop header (hidden on mobile) */}
            <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-5">Item Name</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-3">Unit Price (₹)</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            {items.map((item, idx) => {
              const lineTotal =
                BigInt(Number.parseInt(item.qty) || 0) *
                parseAmount(item.unitPrice);
              return (
                <div key={item.id} data-ocid={`create.item.${idx + 1}`}>
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        data-ocid={`create.item_name.input.${idx + 1}`}
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.id, "name", e.target.value)
                        }
                        placeholder="Item description"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        data-ocid={`create.item_qty.input.${idx + 1}`}
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(item.id, "qty", e.target.value)
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        data-ocid={`create.item_price.input.${idx + 1}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, "unitPrice", e.target.value)
                        }
                        placeholder="0.00"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-xs text-muted-foreground">
                        {fmt(lineTotal)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {items.length > 1 && (
                        <Button
                          data-ocid={`create.item.delete_button.${idx + 1}`}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile stacked card */}
                  <div className="sm:hidden bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        data-ocid={`create.item_name.input.${idx + 1}`}
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.id, "name", e.target.value)
                        }
                        placeholder="Item name"
                        className="h-11 flex-1"
                      />
                      {items.length > 1 && (
                        <Button
                          data-ocid={`create.item.delete_button.${idx + 1}`}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          Qty
                        </p>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(item.id, "qty", e.target.value)
                          }
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          Price (₹)
                        </p>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(item.id, "unitPrice", e.target.value)
                          }
                          placeholder="0.00"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          Total
                        </p>
                        <div className="h-11 flex items-center">
                          <span className="text-sm font-medium text-foreground">
                            {fmt(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-3 border-t border-border space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({taxPercent}%)</span>
              <span className="font-medium">{fmt(taxAmountVal)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              data-ocid="create.notes.textarea"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thank you for your business!"
              rows={2}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pb-2">
          <Button
            data-ocid="create.submit.submit_button"
            type="submit"
            disabled={createInvoice.isPending}
            className="w-full h-12 text-base rounded-xl"
          >
            {createInvoice.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Invoice"
            )}
          </Button>
          <Button
            data-ocid="create.cancel.button"
            type="button"
            variant="outline"
            onClick={() => onNavigate("dashboard")}
            className="w-full h-11 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
