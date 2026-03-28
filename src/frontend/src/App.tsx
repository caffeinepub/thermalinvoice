import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useClaimFirstAdmin,
  useGetMyStoreProfile,
  useIsCallerAdmin,
  useIsCallerApproved,
  useIsFirstRunNeeded,
  useRequestApproval,
  useSaveStoreProfile,
} from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import CreateInvoicePage from "./pages/CreateInvoicePage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PrintInvoicePage from "./pages/PrintInvoicePage";

export type Page = "dashboard" | "create-invoice" | "print-invoice" | "admin";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<bigint | null>(
    null,
  );
  const approvalRequestedRef = useRef(false);

  const { data: isFirstRunNeeded, isLoading: firstRunLoading } =
    useIsFirstRunNeeded();
  const { data: isApproved, isLoading: approvedLoading } =
    useIsCallerApproved();
  const { data: isAdmin } = useIsCallerAdmin();
  const requestApproval = useRequestApproval();

  const { data: storeProfile, isLoading: storeProfileLoading } =
    useGetMyStoreProfile(!!actor && !actorFetching && isApproved === true);

  // Request approval on first login (only if not first run)
  useEffect(() => {
    if (
      actor &&
      !actorFetching &&
      identity &&
      !approvalRequestedRef.current &&
      isFirstRunNeeded === false
    ) {
      approvalRequestedRef.current = true;
      requestApproval.mutate();
    }
  }, [actor, actorFetching, identity, requestApproval, isFirstRunNeeded]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (actorFetching || approvedLoading || firstRunLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  if (isFirstRunNeeded) {
    return (
      <>
        <FirstRunSetupPage />
        <Toaster />
      </>
    );
  }

  if (!isApproved) {
    return (
      <>
        <PendingApprovalPage />
        <Toaster />
      </>
    );
  }

  if (storeProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading store...</p>
        </div>
      </div>
    );
  }

  if (storeProfile === null) {
    return (
      <>
        <StoreSetupPage />
        <Toaster />
      </>
    );
  }

  const navigateTo = (p: Page, invoiceId?: bigint) => {
    setPage(p);
    if (invoiceId !== undefined) setSelectedInvoiceId(invoiceId);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage onNavigate={navigateTo} />;
      case "create-invoice":
        return <CreateInvoicePage onNavigate={navigateTo} />;
      case "print-invoice":
        return (
          <PrintInvoicePage
            invoiceId={selectedInvoiceId}
            onBack={() => setPage("dashboard")}
          />
        );
      case "admin":
        return isAdmin ? (
          <AdminPage />
        ) : (
          <DashboardPage onNavigate={navigateTo} />
        );
      default:
        return <DashboardPage onNavigate={navigateTo} />;
    }
  };

  return (
    <>
      <Layout currentPage={page} onNavigate={navigateTo} isAdmin={!!isAdmin}>
        {renderPage()}
      </Layout>
      <Toaster />
    </>
  );
}

function StoreSetupPage() {
  const saveStore = useSaveStoreProfile();
  const { clear } = useInternetIdentity();
  const [storeName, setStoreName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [fssai, setFssai] = useState("");
  const [cin, setCin] = useState("");
  const [errors, setErrors] = useState<{ storeName?: string; mobile?: string }>(
    {},
  );

  const validate = () => {
    const e: { storeName?: string; mobile?: string } = {};
    if (!storeName.trim()) e.storeName = "Store name is required";
    if (!mobile.trim()) e.mobile = "Mobile number is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    try {
      await saveStore.mutateAsync({
        storeName,
        gstin,
        fssai,
        cin,
        mobile,
        address,
      });
      toast.success("Store setup complete!");
    } catch {
      toast.error("Failed to save store details. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-card border border-border p-6 max-w-md w-full space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Setup Your Store
          </h2>
          <p className="text-sm text-muted-foreground">
            Fill in your store details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required */}
          <div className="space-y-1.5">
            <Label htmlFor="storeName">
              Store Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="storeName"
              data-ocid="store_setup.storeName.input"
              placeholder="e.g. Sharma General Store"
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (errors.storeName)
                  setErrors((p) => ({ ...p, storeName: undefined }));
              }}
            />
            {errors.storeName && (
              <p
                data-ocid="store_setup.storeName.error_state"
                className="text-xs text-destructive"
              >
                {errors.storeName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mobile">
              Mobile Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mobile"
              data-ocid="store_setup.mobile.input"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (errors.mobile)
                  setErrors((p) => ({ ...p, mobile: undefined }));
              }}
            />
            {errors.mobile && (
              <p
                data-ocid="store_setup.mobile.error_state"
                className="text-xs text-destructive"
              >
                {errors.mobile}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              data-ocid="store_setup.address.textarea"
              placeholder="Shop no., Street, City, State, PIN"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          {/* Optional section */}
          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Optional Details
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                data-ocid="store_setup.gstin.input"
                placeholder="22AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fssai">FSSAI Number</Label>
              <Input
                id="fssai"
                data-ocid="store_setup.fssai.input"
                placeholder="14-digit FSSAI number"
                value={fssai}
                onChange={(e) => setFssai(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cin">CIN</Label>
              <Input
                id="cin"
                data-ocid="store_setup.cin.input"
                placeholder="Corporate Identity Number"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            data-ocid="store_setup.submit_button"
            className="w-full"
            disabled={saveStore.isPending}
          >
            {saveStore.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={clear}
          className="w-full text-sm text-muted-foreground hover:underline text-center"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function FirstRunSetupPage() {
  const claimFirstAdmin = useClaimFirstAdmin();
  const { clear } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-card border border-border p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <svg
            aria-label="Shield"
            role="img"
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          First Run Setup
        </h2>
        <p className="text-muted-foreground">
          No admin exists yet. Click below to claim admin rights for your
          account. This can only be done once.
        </p>
        <button
          type="button"
          onClick={() => claimFirstAdmin.mutate()}
          disabled={claimFirstAdmin.isPending}
          className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {claimFirstAdmin.isPending ? "Setting up..." : "Claim Admin Access"}
        </button>
        {claimFirstAdmin.isError && (
          <p className="text-destructive text-sm">
            Failed to claim admin. Admin may already be assigned.
          </p>
        )}
        <button
          type="button"
          onClick={clear}
          className="text-sm text-muted-foreground hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function PendingApprovalPage() {
  const { clear } = useInternetIdentity();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-card border border-border p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
          <svg
            aria-label="Warning"
            role="img"
            className="w-8 h-8 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Account Pending Approval
        </h2>
        <p className="text-muted-foreground">
          Your account is pending approval or has been deactivated. Please
          contact the admin.
        </p>
        <button
          type="button"
          onClick={clear}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
