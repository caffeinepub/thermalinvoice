import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApprovalStatus, Invoice } from "../backend.d";
import { useActor } from "./useActor";

export function useIsFirstRunNeeded() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isFirstRunNeeded"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isFirstRunNeeded();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimFirstAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.claimFirstAdmin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFirstRunNeeded"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyInvoices() {
  const { actor, isFetching } = useActor();
  return useQuery<Invoice[]>({
    queryKey: ["myInvoices"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyInvoices();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetInvoice(invoiceId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Invoice | null>({
    queryKey: ["invoice", invoiceId?.toString()],
    queryFn: async () => {
      if (!actor || invoiceId === null) return null;
      return actor.getInvoice(invoiceId);
    },
    enabled: !!actor && !isFetching && invoiceId !== null,
  });
}

export function useCreateInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: Invoice) => {
      if (!actor) throw new Error("Not connected");
      return actor.createInvoice(invoice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["allCustomers"] });
    },
  });
}

export function useDeleteInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteInvoice(invoiceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myInvoices"] });
    },
  });
}

export function useListAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pendingApprovals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allCustomers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      status,
    }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
    },
  });
}

export function useResetAdminClaim() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.resetAdminClaim();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFirstRunNeeded"] });
    },
  });
}

export function useGetMyStoreProfile(enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myStoreProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyStoreProfile();
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useSaveStoreProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      storeName: string;
      gstin: string;
      fssai: string;
      cin: string;
      mobile: string;
      address: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveStoreProfile(
        data.storeName,
        data.gstin,
        data.fssai,
        data.cin,
        data.mobile,
        data.address,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myStoreProfile"] });
    },
  });
}

export function useGetAllStores() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allStores"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStoreStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      isActive,
    }: { user: Principal; isActive: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setStoreStatus(user, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allStores"] });
    },
  });
}
