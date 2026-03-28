import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FilePlus,
  FileText,
  IndianRupee,
  Printer,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import {
  useDeleteInvoice,
  useGetMyInvoices,
  useGetMyStoreProfile,
} from "../hooks/useQueries";

interface DashboardPageProps {
  onNavigate: (page: Page, invoiceId?: bigint) => void;
}

function formatCurrency(value: bigint): string {
  const num = Number(value) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(num);
}

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInvoiceNumber(index: number): string {
  return `INV-${String(index + 1).padStart(3, "0")}`;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: invoices, isLoading } = useGetMyInvoices();
  const { data: storeProfile } = useGetMyStoreProfile();
  const deleteInvoice = useDeleteInvoice();
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);

  const sortedInvoices = invoices
    ? [...invoices].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];
  const totalRevenue = sortedInvoices.reduce((sum, inv) => sum + inv.total, 0n);

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteInvoice.mutateAsync(deleteTarget);
      toast.success("Invoice deleted");
    } catch {
      toast.error("Failed to delete invoice");
    } finally {
      setDeleteTarget(null);
    }
  };

  const storeIdFormatted = storeProfile
    ? `#${String(Number(storeProfile.storeId)).padStart(4, "0")}`
    : null;

  return (
    <div className="flex-1 p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Invoices</h1>
          {storeProfile && storeIdFormatted ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">
                {storeProfile.storeName}
              </span>
              <span className="mx-1.5 opacity-40">•</span>
              <span>{storeIdFormatted}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your thermal invoices
            </p>
          )}
        </div>
        <Button
          data-ocid="dashboard.create_invoice.primary_button"
          size="sm"
          onClick={() => onNavigate("create-invoice")}
          className="gap-1.5 h-9"
        >
          <FilePlus className="w-3.5 h-3.5" />
          New
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Total",
            value: isLoading ? "—" : String(sortedInvoices.length),
            icon: FileText,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Revenue",
            value: isLoading ? "—" : formatCurrency(totalRevenue),
            icon: IndianRupee,
            color: "text-success",
            bg: "bg-success/10",
          },
          {
            label: "This Month",
            value: isLoading
              ? "—"
              : String(
                  sortedInvoices.filter((inv) => {
                    const d = new Date(Number(inv.createdAt / 1_000_000n));
                    const now = new Date();
                    return (
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear()
                    );
                  }).length,
                ),
            icon: TrendingUp,
            color: "text-chart-1",
            bg: "bg-chart-1/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-card rounded-xl border border-border p-3 shadow-xs text-center"
          >
            <div
              className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1.5`}
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <p className="text-base font-bold text-foreground truncate">
              {value}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            All Invoices
          </h2>
        </div>

        {isLoading ? (
          <div
            data-ocid="dashboard.invoices.loading_state"
            className="p-4 space-y-3"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : sortedInvoices.length === 0 ? (
          <div
            data-ocid="dashboard.invoices.empty_state"
            className="p-10 text-center"
          >
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No invoices yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("create-invoice")}
            >
              Create your first invoice
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedInvoices.map((invoice, idx) => (
              <motion.div
                key={invoice.id.toString()}
                data-ocid={`dashboard.invoice.item.${idx + 1}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                {/* Invoice number */}
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] flex-shrink-0 px-1.5 py-0"
                >
                  {getInvoiceNumber(sortedInvoices.length - 1 - idx)}
                </Badge>

                {/* Customer info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {invoice.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {invoice.phone || formatDate(invoice.date)}
                  </p>
                </div>

                {/* Amount */}
                <span className="text-sm font-semibold text-foreground flex-shrink-0">
                  {formatCurrency(invoice.total)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    data-ocid={`dashboard.invoice.print.button.${idx + 1}`}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => onNavigate("print-invoice", invoice.id)}
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    data-ocid={`dashboard.invoice.delete_button.${idx + 1}`}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(invoice.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        data-ocid="dashboard.fab.button"
        onClick={() => onNavigate("create-invoice")}
        className="fixed bottom-20 right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors no-print"
        aria-label="Create invoice"
      >
        <FilePlus className="w-5 h-5" />
      </button>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="dashboard.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="dashboard.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="dashboard.delete.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
