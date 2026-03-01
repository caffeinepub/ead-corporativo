import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import UserApproval "user-approval/approval";

actor {
  // Repeat types for .wasm compatibility
  public type UserProfile = {
    name : Text;
  };

  module UserProfile {
    public func compare(a : UserProfile, b : UserProfile) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  public type Data = {
    id : Text;
    blob : Storage.ExternalBlob;
    owner : Principal;
    timestamp : Time.Time;
  };

  module Data {
    public func compare(a : Data, b : Data) : Order.Order {
      Text.compare(a.id, b.id);
    };

    public func compareByTimestamp(a : Data, b : Data) : Order.Order {
      if (a.timestamp < b.timestamp) { #less } else if (a.timestamp > b.timestamp) { #greater } else {
        Text.compare(a.id, b.id);
      };
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let dataStore = Map.empty<Text, Data>();

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);

  include MixinStorage();
  include MixinAuthorization(accessControlState);

  // Profile Management
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Approval System
  public query ({ caller }) func isCallerApproved() : async Bool {
    UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request approval");
    };
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

  // Data Storage
  public shared ({ caller }) func uploadData(id : Text, blob : Storage.ExternalBlob) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users or admins can upload data");
    };
    let data : Data = {
      id;
      blob;
      owner = caller;
      timestamp = Time.now();
    };
    dataStore.add(id, data);
  };

  public query ({ caller }) func getData(id : Text) : async ?Data {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users or admins can access data");
    };
    dataStore.get(id);
  };

  public query ({ caller }) func getCallerData() : async [Data] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users or admins can access data");
    };
    let filtered = dataStore.values().filter(
      func(data) {
        data.owner == caller;
      }
    );
    filtered.toArray().sort(Data.compareByTimestamp);
  };

  public shared ({ caller }) func deleteData(id : Text) : async () {
    switch (dataStore.get(id)) {
      case (null) { Runtime.trap("Data not found") };
      case (?data) {
        if (data.owner != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
          Runtime.trap("Unauthorized: Only the owner or admin can delete this data");
        };
        dataStore.remove(id);
      };
    };
  };

  public query ({ caller }) func getAllData() : async [Data] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can access all data");
    };
    dataStore.toArray().map<(Text, Data), Data>(func((_, data)) { data });
  };
};
