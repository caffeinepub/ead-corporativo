import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";

actor {
  public type UserProfile = {
    name : Text;
    // Other user metadata if needed
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

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
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
    dataStore.values().toArray().sort();
  };
};
