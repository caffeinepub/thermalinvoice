import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface InvoiceItem {
    qty: bigint;
    name: string;
    unitPrice: bigint;
}
export type Time = bigint;
export interface Invoice {
    id: bigint;
    customerName: string;
    total: bigint;
    taxPercent: bigint;
    date: Time;
    createdAt: Time;
    customerAddress: string;
    notes: string;
    phone: string;
    items: Array<InvoiceItem>;
    taxAmount: bigint;
    subtotal: bigint;
}
export interface StoreEntry {
    principal: Principal;
    storeProfile: StoreProfile;
}
export interface StoreProfile {
    cin: string;
    fssai: string;
    storeId: bigint;
    isActive: boolean;
    gstin: string;
    address: string;
    storeName: string;
    mobile: string;
}
export interface UserProfile {
    name: string;
}
export interface Customer {
    name: string;
    address: string;
    customerId: bigint;
    phone: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimFirstAdmin(): Promise<void>;
    createInvoice(invoice: Invoice): Promise<bigint>;
    deleteInvoice(invoiceId: bigint): Promise<void>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllStores(): Promise<Array<StoreEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInvoice(invoiceId: bigint): Promise<Invoice>;
    getMyInvoices(): Promise<Array<Invoice>>;
    getMyStoreProfile(): Promise<StoreProfile | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isFirstRunNeeded(): Promise<boolean>;
    listAllUsers(): Promise<Array<UserApprovalInfo>>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    requestApproval(): Promise<void>;
    resetAdminClaim(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveStoreProfile(storeName: string, gstin: string, fssai: string, cin: string, mobile: string, address: string): Promise<StoreProfile>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStoreStatus(user: Principal, isActive: boolean): Promise<void>;
    setUserStatus(user: Principal, status: ApprovalStatus): Promise<void>;
}
