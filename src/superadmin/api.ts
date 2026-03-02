const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BASE = `${SUPABASE_URL}/functions/v1/super-admin`;

async function request(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    params?: Record<string, string>;
  } = {}
) {
  const { method = "GET", body, token, params } = options;
  let url = `${BASE}/${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const superAdminApi = {
  bootstrap: (body: { email: string; name: string; password: string }) =>
    request("bootstrap", { method: "POST", body }),

  getStats: (token: string) => request("stats", { token }),

  listWorkspaces: (token: string) => request("workspaces", { token }),

  getWorkspaceDetail: (token: string, id: string) =>
    request(`workspaces/${id}`, { token }),

  createWorkspace: (
    token: string,
    body: {
      name: string;
      slug: string;
      owner_email: string;
      plan_tier?: string;
      billing_contact_name?: string;
      billing_contact_email?: string;
    }
  ) => request("workspaces", { method: "POST", body, token }),

  updateWorkspaceStatus: (
    token: string,
    body: { workspace_id: string; status: string; reason?: string }
  ) => request("workspace-status", { method: "PUT", body, token }),

  updateWorkspace: (
    token: string,
    body: {
      workspace_id: string;
      name?: string;
      plan_tier?: string;
      billing_contact_name?: string;
      billing_contact_email?: string;
      billing_notes?: string;
    }
  ) => request("workspace", { method: "PUT", body, token }),

  inviteUser: (
    token: string,
    body: { workspace_id: string; email: string; name?: string; role: string }
  ) => request("invite-user", { method: "POST", body, token }),

  revokeInvitation: (token: string, invitation_id: string) =>
    request("revoke-invitation", {
      method: "PUT",
      body: { invitation_id },
      token,
    }),

  resendInvitation: (token: string, invitation_id: string) =>
    request("resend-invitation", {
      method: "PUT",
      body: { invitation_id },
      token,
    }),

  updateUserRole: (
    token: string,
    body: { user_id: string; role: string; workspace_id: string }
  ) => request("user-role", { method: "PUT", body, token }),

  updateUserStatus: (
    token: string,
    body: { user_id: string; status: string; workspace_id: string }
  ) => request("user-status", { method: "PUT", body, token }),

  resetUserPassword: (token: string, email: string) =>
    request("reset-password", { method: "PUT", body: { email }, token }),

  removeUser: (token: string, userId: string, workspaceId: string) =>
    request(`user/${userId}`, {
      method: "DELETE",
      token,
      params: { workspace_id: workspaceId },
    }),

  listSuperAdmins: (token: string) => request("super-admins", { token }),

  inviteSuperAdmin: (
    token: string,
    body: { email: string; name: string; role: string }
  ) => request("invite-super-admin", { method: "POST", body, token }),

  updateSuperAdmin: (
    token: string,
    body: { admin_id: string; role?: string; status?: string }
  ) => request("super-admin", { method: "PUT", body, token }),

  getAuditLog: (
    token: string,
    params?: { workspace_id?: string; action?: string; limit?: string; offset?: string }
  ) => request("audit-log", { token, params }),

  listAllInvitations: (
    token: string,
    params?: { status?: string; workspace_id?: string }
  ) => request("invitations", { token, params }),

  validateInvitation: (token: string) =>
    request("validate-invitation", { params: { token } }),

  acceptInvitation: (body: { token: string; name: string; password: string }) =>
    request("accept-invitation", { method: "POST", body }),
};
