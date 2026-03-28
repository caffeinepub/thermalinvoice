import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Clock,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Store,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ApprovalStatus } from "../backend.d";
import {
  useGetAllStores,
  useListAllUsers,
  useListApprovals,
  useResetAdminClaim,
  useSetApproval,
  useSetStoreStatus,
} from "../hooks/useQueries";

function truncatePrincipal(p: Principal): string {
  const s = p.toString();
  return s.length > 16 ? `${s.slice(0, 8)}...${s.slice(-4)}` : s;
}

function formatStoreId(id: bigint): string {
  return String(Number(id)).padStart(4, "0");
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  if (status === ApprovalStatus.approved) {
    return (
      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">
        Active
      </Badge>
    );
  }
  if (status === ApprovalStatus.rejected) {
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15">
        Inactive
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/15">
      Pending
    </Badge>
  );
}

export default function AdminPage() {
  const { data: allUsers, isLoading: usersLoading } = useListAllUsers();
  const { data: pendingUsers, isLoading: pendingLoading } = useListApprovals();
  const { data: allStores, isLoading: storesLoading } = useGetAllStores();
  const setApproval = useSetApproval();
  const setStoreStatus = useSetStoreStatus();
  const resetAdminClaim = useResetAdminClaim();
  const [storeSearch, setStoreSearch] = useState("");

  const handleSetApproval = async (user: Principal, status: ApprovalStatus) => {
    try {
      await setApproval.mutateAsync({ user, status });
      const label =
        status === ApprovalStatus.approved ? "activated" : "deactivated";
      toast.success(`User ${label} successfully`);
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const handleSetStoreStatus = async (user: Principal, isActive: boolean) => {
    try {
      await setStoreStatus.mutateAsync({ user, isActive });
      toast.success(
        `Store ${isActive ? "activated" : "deactivated"} successfully`,
      );
    } catch {
      toast.error("Failed to update store status");
    }
  };

  const filteredStores =
    allStores?.filter((entry) => {
      if (!storeSearch.trim()) return true;
      const q = storeSearch.toLowerCase();
      const { storeProfile } = entry;
      return (
        storeProfile.storeName.toLowerCase().includes(q) ||
        storeProfile.mobile.toLowerCase().includes(q) ||
        storeProfile.address.toLowerCase().includes(q) ||
        formatStoreId(storeProfile.storeId).includes(q)
      );
    }) ?? [];

  return (
    <div className="flex-1 p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">
            Manage user access and approvals
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Total",
            value: usersLoading ? "—" : String(allUsers?.length ?? 0),
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Active",
            value: usersLoading
              ? "—"
              : String(
                  allUsers?.filter((u) => u.status === ApprovalStatus.approved)
                    .length ?? 0,
                ),
            icon: UserCheck,
            color: "text-success",
            bg: "bg-success/10",
          },
          {
            label: "Pending",
            value: pendingLoading ? "—" : String(pendingUsers?.length ?? 0),
            icon: Clock,
            color: "text-warning",
            bg: "bg-warning/10",
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
            <p className="text-base font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all-users" data-ocid="admin.users.tab">
        <TabsList className="w-full">
          <TabsTrigger
            value="all-users"
            data-ocid="admin.all_users.tab"
            className="flex-1"
          >
            All Users
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            data-ocid="admin.pending.tab"
            className="flex-1"
          >
            Pending
            {pendingUsers && pendingUsers.length > 0 && (
              <span className="ml-1.5 bg-warning text-warning-foreground text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="stores"
            data-ocid="admin.stores.tab"
            className="flex-1"
          >
            Stores
            {allStores && allStores.length > 0 && (
              <span className="ml-1.5 bg-primary/20 text-primary text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                {allStores.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All users */}
        <TabsContent value="all-users">
          <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden mt-3">
            {usersLoading ? (
              <div
                data-ocid="admin.users.loading_state"
                className="p-4 space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : !allUsers || allUsers.length === 0 ? (
              <div
                data-ocid="admin.users.empty_state"
                className="p-10 text-center"
              >
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No users registered yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allUsers.map((user, idx) => (
                  <motion.div
                    key={user.principal.toString()}
                    data-ocid={`admin.user.item.${idx + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <code className="text-xs text-muted-foreground font-mono truncate flex-1">
                        {truncatePrincipal(user.principal)}
                      </code>
                      <StatusBadge status={user.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      {user.status !== ApprovalStatus.approved && (
                        <Button
                          data-ocid={`admin.user.activate.button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 gap-1 text-xs border-success/40 text-success hover:bg-success/10"
                          disabled={setApproval.isPending}
                          onClick={() =>
                            handleSetApproval(
                              user.principal,
                              ApprovalStatus.approved,
                            )
                          }
                        >
                          <UserCheck className="w-3 h-3" />
                          Activate
                        </Button>
                      )}
                      {user.status !== ApprovalStatus.rejected && (
                        <Button
                          data-ocid={`admin.user.deactivate.button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 gap-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                          disabled={setApproval.isPending}
                          onClick={() =>
                            handleSetApproval(
                              user.principal,
                              ApprovalStatus.rejected,
                            )
                          }
                        >
                          <UserX className="w-3 h-3" />
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Pending approvals */}
        <TabsContent value="pending">
          <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden mt-3">
            {pendingLoading ? (
              <div
                data-ocid="admin.pending.loading_state"
                className="p-4 space-y-3"
              >
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : !pendingUsers || pendingUsers.length === 0 ? (
              <div
                data-ocid="admin.pending.empty_state"
                className="p-10 text-center"
              >
                <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No pending approvals
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingUsers.map((user, idx) => (
                  <div
                    key={user.principal.toString()}
                    data-ocid={`admin.pending.item.${idx + 1}`}
                    className="p-4"
                  >
                    <code className="text-xs text-muted-foreground font-mono block mb-2">
                      {truncatePrincipal(user.principal)}
                    </code>
                    <div className="flex items-center gap-2">
                      <Button
                        data-ocid={`admin.pending.approve.button.${idx + 1}`}
                        size="sm"
                        className="flex-1 h-8 gap-1 text-xs bg-success text-success-foreground hover:bg-success/90"
                        disabled={setApproval.isPending}
                        onClick={() =>
                          handleSetApproval(
                            user.principal,
                            ApprovalStatus.approved,
                          )
                        }
                      >
                        <UserCheck className="w-3 h-3" />
                        Approve
                      </Button>
                      <Button
                        data-ocid={`admin.pending.reject.button.${idx + 1}`}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 gap-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                        disabled={setApproval.isPending}
                        onClick={() =>
                          handleSetApproval(
                            user.principal,
                            ApprovalStatus.rejected,
                          )
                        }
                      >
                        <UserX className="w-3 h-3" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Stores */}
        <TabsContent value="stores">
          {/* Search bar */}
          <div className="relative mt-3 mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="admin.stores.search_input"
              placeholder="Search by name, mobile, address or store ID..."
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>

          <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
            {storesLoading ? (
              <div
                data-ocid="admin.stores.loading_state"
                className="p-4 space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredStores.length === 0 ? (
              <div
                data-ocid="admin.stores.empty_state"
                className="p-10 text-center"
              >
                <Store className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {storeSearch
                    ? "No stores match your search"
                    : "No stores registered yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredStores.map((entry, idx) => {
                  const { storeProfile } = entry;
                  return (
                    <motion.div
                      key={entry.principal.toString()}
                      data-ocid={`admin.store.item.${idx + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {storeProfile.storeName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                            #{formatStoreId(storeProfile.storeId)}
                          </span>
                          {storeProfile.isActive ? (
                            <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      {storeProfile.mobile && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Phone className="w-3 h-3" />
                          <span>{storeProfile.mobile}</span>
                        </div>
                      )}
                      {storeProfile.address && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{storeProfile.address}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        {!storeProfile.isActive && (
                          <Button
                            data-ocid={`admin.store.activate.button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 gap-1 text-xs border-success/40 text-success hover:bg-success/10"
                            disabled={setStoreStatus.isPending}
                            onClick={() =>
                              handleSetStoreStatus(entry.principal, true)
                            }
                          >
                            <UserCheck className="w-3 h-3" />
                            Activate
                          </Button>
                        )}
                        {storeProfile.isActive && (
                          <Button
                            data-ocid={`admin.store.deactivate.button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 gap-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                            disabled={setStoreStatus.isPending}
                            onClick={() =>
                              handleSetStoreStatus(entry.principal, false)
                            }
                          >
                            <UserX className="w-3 h-3" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <div className="border border-destructive/30 rounded-xl p-4 mt-4">
        <h2 className="text-sm font-semibold text-destructive mb-1">
          Danger Zone
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Reset the admin claim so a new admin can be set up from the login
          screen.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={resetAdminClaim.isPending}
          onClick={async () => {
            try {
              await resetAdminClaim.mutateAsync();
              toast.success(
                "Admin claim reset. Reload to see the claim screen.",
              );
            } catch {
              toast.error("Failed to reset admin claim");
            }
          }}
        >
          {resetAdminClaim.isPending ? "Resetting..." : "Reset Admin Claim"}
        </Button>
      </div>
    </div>
  );
}
