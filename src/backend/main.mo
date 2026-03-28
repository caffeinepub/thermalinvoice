import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  // INCLUDE AUTHORIZATION
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // STORE MANAGEMENT TYPES
  public type StoreProfile = {
    storeId : Nat;
    storeName : Text;
    gstin : Text;
    fssai : Text;
    cin : Text;
    mobile : Text;
    address : Text;
    isActive : Bool;
  };

  public type StoreEntry = {
    principal : Principal;
    storeProfile : StoreProfile;
  };

  public type StoreStatusUpdate = {
    storeId : Nat;
    isActive : Bool;
  };

  // STORE STATE
  var lastStoreId = 1000;
  let storeProfiles = Map.empty<Principal, StoreProfile>();

  // INVOICE TYPES
  public type UserProfile = {
    name : Text;
  };

  public type InvoiceItem = {
    name : Text;
    qty : Nat;
    unitPrice : Nat;
  };

  public type Invoice = {
    id : Nat;
    date : Time.Time;
    customerName : Text;
    customerAddress : Text;
    phone : Text;
    items : [InvoiceItem];
    subtotal : Nat;
    taxPercent : Nat;
    taxAmount : Nat;
    total : Nat;
    notes : Text;
    createdAt : Time.Time;
  };

  public type Customer = {
    customerId : Nat;
    name : Text;
    address : Text;
    phone : Text;
  };

  // INVOICE STATE
  var lastInvoiceId = 0;
  var lastCustomerId = 0;
  let invoices = Map.empty<Principal, List.List<Invoice>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let customersByKey = Map.empty<Text, Customer>();
  let customerList = List.empty<Customer>();
  let approvalState = UserApproval.initState(accessControlState);

  // INVOICE SORT FUNCTION
  module Invoice {
    public func compare(invoice1 : Invoice, invoice2 : Invoice) : Order.Order {
      Nat.compare(invoice1.id, invoice2.id);
    };
  };

  // COMMON HELPERS
  func getCallerInvoices(caller : Principal) : List.List<Invoice> {
    switch (invoices.get(caller)) {
      case (null) {
        Runtime.trap("No invoices found for this user.");
      };
      case (?userInvoices) { userInvoices };
    };
  };

  func requireApprovedUser(caller : Principal) {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
  };

  func registerCustomer(name : Text, address : Text, phone : Text) {
    let key = if (phone != "") { phone } else { name };
    switch (customersByKey.get(key)) {
      case (?_existing) { /* already registered */ };
      case (null) {
        lastCustomerId += 1;
        let c : Customer = {
          customerId = lastCustomerId;
          name = name;
          address = address;
          phone = phone;
        };
        customersByKey.add(key, c);
        customerList.add(c);
      };
    };
  };

  ///////////////////
  // FIRST ADMIN
  ///////////////////
  public query func isFirstRunNeeded() : async Bool {
    not accessControlState.adminAssigned;
  };

  public shared ({ caller }) func claimFirstAdmin() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot claim admin");
    };
    if (accessControlState.adminAssigned) {
      Runtime.trap("Admin already assigned");
    };
    accessControlState.userRoles.add(caller, #admin : AccessControl.UserRole);
    accessControlState.adminAssigned := true;
    UserApproval.setApproval(approvalState, caller, #approved);
  };

  public shared func resetAdminClaim() : async () {
    accessControlState.adminAssigned := false;
  };

  ///////////////////
  // STORE MANAGEMENT
  ///////////////////
  // STORE LIST - ADMIN ONLY
  public query ({ caller }) func getAllStores() : async [StoreEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    storeProfiles.entries().map(func((principal, profile)) { { principal; storeProfile = profile } }).toArray();
  };

  // GET STORE - STORE OWNER
  public query ({ caller }) func getMyStoreProfile() : async ?StoreProfile {
    requireApprovedUser(caller);
    storeProfiles.get(caller);
  };

  // SAVE STORES - ONLY IF DOES NOT EXIST YET
  public shared ({ caller }) func saveStoreProfile(storeName : Text, gstin : Text, fssai : Text, cin : Text, mobile : Text, address : Text) : async StoreProfile {
    requireApprovedUser(caller);
    if (storeProfiles.containsKey(caller)) {
      Runtime.trap("Store profile already exists for caller. Use updateStoreProfile to modify it.");
    };
    lastStoreId += 1;
    let newProfile : StoreProfile = {
      storeId = lastStoreId;
      storeName;
      gstin;
      fssai;
      cin;
      mobile;
      address;
      isActive = true;
    };
    storeProfiles.add(caller, newProfile);
    newProfile;
  };

  // SET STORE ACTIVE STATUS (ADMIN) - Fixed to use Principal instead of storeId
  public shared ({ caller }) func setStoreStatus(user : Principal, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (storeProfiles.get(user)) {
      case (?storeProfile) {
        let updatedStore = {
          storeProfile with isActive;
        };
        storeProfiles.add(user, updatedStore);
      };
      case (null) {
        Runtime.trap("Store not found for the specified user");
      };
    };
  };

  ///////////////////
  // INVOICE FUNCTIONS
  ///////////////////
  // USER PROFILE FUNCTIONS (REQUIRED BY FRONTEND)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // INVOICE FUNCTIONS
  public shared ({ caller }) func createInvoice(invoice : Invoice) : async Nat {
    requireApprovedUser(caller);

    let newId = lastInvoiceId + 1;
    lastInvoiceId := newId;

    let newInvoice : Invoice = {
      invoice with
      id = newId;
      createdAt = Time.now();
    };

    let userInvoices = switch (invoices.get(caller)) {
      case (null) { List.empty<Invoice>() };
      case (?existing) { existing };
    };

    userInvoices.add(newInvoice);
    invoices.add(caller, userInvoices);

    registerCustomer(invoice.customerName, invoice.customerAddress, invoice.phone);

    newId;
  };

  public query ({ caller }) func getMyInvoices() : async [Invoice] {
    requireApprovedUser(caller);

    switch (invoices.get(caller)) {
      case (null) { [] };
      case (?userInvoices) { userInvoices.toArray().sort() };
    };
  };

  public query ({ caller }) func getInvoice(invoiceId : Nat) : async Invoice {
    requireApprovedUser(caller);

    // Strict isolation: only access caller's own invoices
    let userInvoices = getCallerInvoices(caller);
    let results = userInvoices.filter(func(inv) { inv.id == invoiceId }).toArray();

    results.get(0);
  };

  public shared ({ caller }) func deleteInvoice(invoiceId : Nat) : async () {
    requireApprovedUser(caller);

    // Strict isolation: only delete from caller's own invoices
    let userInvoices = getCallerInvoices(caller);
    let filteredInvoices = userInvoices.filter(func(inv) { inv.id != invoiceId });
    invoices.add(caller, filteredInvoices);
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all customers");
    };
    customerList.toArray();
  };

  public query ({ caller }) func listAllUsers() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public shared ({ caller }) func setUserStatus(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };
};
