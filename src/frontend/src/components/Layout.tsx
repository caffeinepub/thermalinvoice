import { cn } from "@/lib/utils";
import {
  FilePlus,
  LayoutDashboard,
  LogOut,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isAdmin: boolean;
}

export default function Layout({
  children,
  currentPage,
  onNavigate,
  isAdmin,
}: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principal.length > 12
      ? `${principal.slice(0, 5)}...${principal.slice(-4)}`
      : principal;

  const navItems = [
    { page: "dashboard" as Page, label: "Invoices", icon: LayoutDashboard },
    { page: "create-invoice" as Page, label: "New", icon: FilePlus },
    ...(isAdmin
      ? [{ page: "admin" as Page, label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header */}
      <header className="no-print sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-semibold text-foreground">
              InvoicePro
            </span>
          </div>

          {/* Right: user + sign out */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] text-primary font-bold">U</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                {shortPrincipal}
              </span>
              {isAdmin && (
                <span className="text-[10px] text-primary font-semibold">
                  Admin
                </span>
              )}
            </div>
            <button
              type="button"
              data-ocid="nav.logout.button"
              onClick={clear}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom tab bar */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
        <div className="flex items-stretch justify-around h-16">
          {navItems.map(({ page, label, icon: Icon }) => {
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                type="button"
                data-ocid={`nav.${page}.link`}
                onClick={() => onNavigate(page)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-1 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-6 flex items-center justify-center rounded-full transition-colors",
                    isActive ? "bg-primary/15" : "",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
