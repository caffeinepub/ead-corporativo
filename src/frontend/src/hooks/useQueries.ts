import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApprovalStatus, UserRole } from "../backend.d";
import { useActor } from "./useActor";

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    // Run the query once actor is ready OR once actor stops fetching (handles actor init failures)
    enabled: !isFetching,
    // Retry once on failure to handle transient errors
    retry: 1,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !isFetching,
    retry: 1,
  });
}

export function useIsApproved() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isApproved"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerApproved();
      } catch {
        return false;
      }
    },
    enabled: !isFetching,
    retry: 1,
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile({ name });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) return; // silently skip if no actor
      try {
        await actor.requestApproval();
      } catch {
        // Silently ignore — user may not have a role yet, or may already be admin
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["isApproved"] });
    },
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      status,
    }: {
      user: Principal;
      status: ApprovalStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.setApproval(user, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      role,
    }: {
      user: Principal;
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export { ApprovalStatus, UserRole };
