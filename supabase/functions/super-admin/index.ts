import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function verifySuperAdmin(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return null;

  const admin = getServiceClient();
  const { data: superAdmin } = await admin
    .from("super_admins")
    .select("*")
    .eq("supabase_auth_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return superAdmin;
}

async function logAudit(
  admin: ReturnType<typeof getServiceClient>,
  params: {
    action: string;
    user_email: string;
    user_name: string;
    user_role: string;
    resource: string;
    details: Record<string, unknown>;
    workspace_id?: string;
    client_id?: string;
  }
) {
  await admin.from("audit_log").insert({
    action: params.action,
    user_email: params.user_email,
    user_name: params.user_name,
    user_role: `super_admin_${params.user_role}`,
    resource: params.resource,
    details: params.details,
    workspace_id: params.workspace_id || null,
    client_id: params.client_id || null,
  });
}

async function handleGetStats(superAdmin: { email: string; role: string }) {
  const admin = getServiceClient();
  const { count: totalWorkspaces } = await admin
    .from("workspaces")
    .select("*", { count: "exact", head: true });
  const { count: activeWorkspaces } = await admin
    .from("workspaces")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  const { count: pausedWorkspaces } = await admin
    .from("workspaces")
    .select("*", { count: "exact", head: true })
    .eq("status", "paused");
  const { count: archivedWorkspaces } = await admin
    .from("workspaces")
    .select("*", { count: "exact", head: true })
    .eq("status", "archived");
  const { count: totalUsers } = await admin
    .from("app_users")
    .select("*", { count: "exact", head: true });
  const { count: pendingInvitations } = await admin
    .from("invitations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  const { data: recentAudit } = await admin
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return jsonResponse({
    stats: {
      totalWorkspaces: totalWorkspaces || 0,
      activeWorkspaces: activeWorkspaces || 0,
      pausedWorkspaces: pausedWorkspaces || 0,
      archivedWorkspaces: archivedWorkspaces || 0,
      totalUsers: totalUsers || 0,
      pendingInvitations: pendingInvitations || 0,
    },
    recentActivity: recentAudit || [],
  });
}

async function handleListWorkspaces() {
  const admin = getServiceClient();
  const { data: workspaces, error } = await admin
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);

  const workspaceIds = (workspaces || []).map((w: { id: string }) => w.id);
  let userCounts: Record<string, number> = {};
  if (workspaceIds.length > 0) {
    const { data: users } = await admin
      .from("app_users")
      .select("workspace_id");
    if (users) {
      for (const u of users) {
        if (u.workspace_id) {
          userCounts[u.workspace_id] = (userCounts[u.workspace_id] || 0) + 1;
        }
      }
    }
  }

  const enriched = (workspaces || []).map((w: { id: string }) => ({
    ...w,
    user_count: userCounts[w.id] || 0,
  }));

  return jsonResponse({ workspaces: enriched });
}

async function handleCreateWorkspace(
  body: {
    name: string;
    slug: string;
    owner_email: string;
    plan_tier?: string;
    billing_contact_name?: string;
    billing_contact_email?: string;
  },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { name, slug, owner_email, plan_tier, billing_contact_name, billing_contact_email } = body;

  if (!name || !slug || !owner_email) {
    return errorResponse("name, slug, and owner_email are required");
  }

  const sanitizedSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: existing } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", sanitizedSlug)
    .maybeSingle();

  if (existing) return errorResponse("A workspace with this slug already exists");

  const { data: workspace, error } = await admin
    .from("workspaces")
    .insert({
      name,
      slug: sanitizedSlug,
      owner_email,
      plan_tier: plan_tier || null,
      billing_contact_name: billing_contact_name || null,
      billing_contact_email: billing_contact_email || null,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  const inviteToken = crypto.randomUUID();
  await admin.from("invitations").insert({
    token: inviteToken,
    type: "workspace_admin",
    workspace_id: workspace.id,
    invitee_email: owner_email,
    invited_by: superAdmin.email,
    role: "admin",
    status: "pending",
  });

  await logAudit(admin, {
    action: "workspace_created",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "workspace",
    details: { workspace_id: workspace.id, workspace_name: name, owner_email },
    workspace_id: workspace.id,
  });

  return jsonResponse({ workspace, invitation_token: inviteToken }, 201);
}

async function handleUpdateWorkspaceStatus(
  body: { workspace_id: string; status: string; reason?: string },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { workspace_id, status, reason } = body;

  if (!workspace_id || !status) {
    return errorResponse("workspace_id and status are required");
  }

  const validStatuses = ["active", "paused", "archived", "deleted"];
  if (!validStatuses.includes(status)) {
    return errorResponse(`status must be one of: ${validStatuses.join(", ")}`);
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "paused") {
    updateData.paused_at = new Date().toISOString();
    updateData.paused_reason = reason || null;
  } else if (status === "archived") {
    updateData.archived_at = new Date().toISOString();
    updateData.archived_by = superAdmin.email;
  } else if (status === "deleted") {
    updateData.deleted_at = new Date().toISOString();
  } else if (status === "active") {
    updateData.paused_at = null;
    updateData.paused_reason = null;
    updateData.archived_at = null;
    updateData.archived_by = null;
    updateData.deleted_at = null;
  }

  const { data: workspace, error } = await admin
    .from("workspaces")
    .update(updateData)
    .eq("id", workspace_id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: `workspace_${status}`,
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "workspace",
    details: {
      workspace_id,
      new_status: status,
      reason: reason || null,
    },
    workspace_id,
  });

  return jsonResponse({ workspace });
}

async function handleUpdateWorkspace(
  body: {
    workspace_id: string;
    name?: string;
    plan_tier?: string;
    billing_contact_name?: string;
    billing_contact_email?: string;
    billing_notes?: string;
  },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { workspace_id, ...fields } = body;
  if (!workspace_id) return errorResponse("workspace_id is required");

  const updateData: Record<string, unknown> = {};
  if (fields.name !== undefined) updateData.name = fields.name;
  if (fields.plan_tier !== undefined) updateData.plan_tier = fields.plan_tier;
  if (fields.billing_contact_name !== undefined) updateData.billing_contact_name = fields.billing_contact_name;
  if (fields.billing_contact_email !== undefined) updateData.billing_contact_email = fields.billing_contact_email;
  if (fields.billing_notes !== undefined) updateData.billing_notes = fields.billing_notes;

  if (Object.keys(updateData).length === 0) return errorResponse("No fields to update");

  const { data: workspace, error } = await admin
    .from("workspaces")
    .update(updateData)
    .eq("id", workspace_id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: "workspace_updated",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "workspace",
    details: { workspace_id, fields_updated: Object.keys(updateData) },
    workspace_id,
  });

  return jsonResponse({ workspace });
}

async function handleGetWorkspaceDetail(workspaceId: string) {
  const admin = getServiceClient();

  const { data: workspace, error } = await admin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error || !workspace) return errorResponse("Workspace not found", 404);

  const { data: users } = await admin
    .from("app_users")
    .select("id, email, name, role, status, last_login, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  const { data: invitations } = await admin
    .from("invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  const { data: auditEntries } = await admin
    .from("audit_log")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  const { count: clientCount } = await admin
    .from("success_planning_overview")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  return jsonResponse({
    workspace,
    users: users || [],
    invitations: invitations || [],
    auditLog: auditEntries || [],
    clientCount: clientCount || 0,
  });
}

async function handleInviteUser(
  body: {
    workspace_id: string;
    email: string;
    name?: string;
    role: string;
  },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { workspace_id, email, name, role } = body;

  if (!workspace_id || !email || !role) {
    return errorResponse("workspace_id, email, and role are required");
  }

  const { data: existingUser } = await admin
    .from("app_users")
    .select("id")
    .eq("email", email)
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (existingUser) return errorResponse("User already exists in this workspace");

  const { data: pendingInvite } = await admin
    .from("invitations")
    .select("id")
    .eq("invitee_email", email)
    .eq("workspace_id", workspace_id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingInvite) return errorResponse("A pending invitation already exists for this email");

  const inviteToken = crypto.randomUUID();
  const { data: invitation, error } = await admin
    .from("invitations")
    .insert({
      token: inviteToken,
      type: "workspace_user",
      workspace_id,
      invitee_email: email,
      invitee_name: name || null,
      invited_by: superAdmin.email,
      role,
      status: "pending",
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: "user_invited",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "invitation",
    details: { invitee_email: email, role, workspace_id },
    workspace_id,
  });

  return jsonResponse({ invitation }, 201);
}

async function handleRevokeInvitation(
  body: { invitation_id: string },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { invitation_id } = body;

  const { data: invitation, error } = await admin
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitation_id)
    .eq("status", "pending")
    .select()
    .single();

  if (error) return errorResponse("Invitation not found or already processed", 404);

  await logAudit(admin, {
    action: "invitation_revoked",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "invitation",
    details: { invitation_id, invitee_email: invitation.invitee_email },
    workspace_id: invitation.workspace_id,
  });

  return jsonResponse({ invitation });
}

async function handleResendInvitation(
  body: { invitation_id: string },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { invitation_id } = body;

  const { data: oldInvite } = await admin
    .from("invitations")
    .select("*")
    .eq("id", invitation_id)
    .maybeSingle();

  if (!oldInvite) return errorResponse("Invitation not found", 404);

  await admin
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitation_id);

  const newToken = crypto.randomUUID();
  const { data: newInvite, error } = await admin
    .from("invitations")
    .insert({
      token: newToken,
      type: oldInvite.type,
      workspace_id: oldInvite.workspace_id,
      invitee_email: oldInvite.invitee_email,
      invitee_name: oldInvite.invitee_name,
      invited_by: superAdmin.email,
      role: oldInvite.role,
      status: "pending",
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: "invitation_resent",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "invitation",
    details: {
      old_invitation_id: invitation_id,
      new_invitation_id: newInvite.id,
      invitee_email: oldInvite.invitee_email,
    },
    workspace_id: oldInvite.workspace_id,
  });

  return jsonResponse({ invitation: newInvite });
}

async function handleUpdateUserRole(
  body: { user_id: string; role: string; workspace_id: string },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { user_id, role, workspace_id } = body;

  const validRoles = ["admin", "csm", "client"];
  if (!validRoles.includes(role)) {
    return errorResponse(`role must be one of: ${validRoles.join(", ")}`);
  }

  const { data: user, error } = await admin
    .from("app_users")
    .update({ role })
    .eq("id", user_id)
    .eq("workspace_id", workspace_id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: "user_role_updated",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "app_user",
    details: { target_user_id: user_id, new_role: role },
    workspace_id,
  });

  return jsonResponse({ user });
}

async function handleUpdateUserStatus(
  body: { user_id: string; status: string; workspace_id: string },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { user_id, status, workspace_id } = body;

  const validStatuses = ["active", "inactive"];
  if (!validStatuses.includes(status)) {
    return errorResponse(`status must be one of: ${validStatuses.join(", ")}`);
  }

  const { data: user, error } = await admin
    .from("app_users")
    .update({ status })
    .eq("id", user_id)
    .eq("workspace_id", workspace_id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: `user_${status === "active" ? "reactivated" : "deactivated"}`,
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "app_user",
    details: { target_user_id: user_id, new_status: status },
    workspace_id,
  });

  return jsonResponse({ user });
}

async function handleResetUserPassword(
  body: { email: string },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { email } = body;

  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")}/reset-password`,
  });

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: "password_reset_triggered",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "app_user",
    details: { target_email: email },
  });

  return jsonResponse({ success: true });
}

async function handleRemoveUser(
  body: { user_id: string; workspace_id: string },
  superAdmin: { email: string; name: string; role: string }
) {
  const admin = getServiceClient();
  const { user_id, workspace_id } = body;

  const { data: user } = await admin
    .from("app_users")
    .select("email, name")
    .eq("id", user_id)
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (!user) return errorResponse("User not found", 404);

  const { error } = await admin
    .from("app_users")
    .update({ status: "inactive", workspace_id: null })
    .eq("id", user_id);

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: "user_removed_from_workspace",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "app_user",
    details: { target_user: user.email, target_name: user.name },
    workspace_id,
  });

  return jsonResponse({ success: true });
}

async function handleListSuperAdmins() {
  const admin = getServiceClient();
  const { data, error } = await admin
    .from("super_admins")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ superAdmins: data || [] });
}

async function handleInviteSuperAdmin(
  body: { email: string; name: string; role: string },
  superAdmin: { email: string; name: string; role: string }
) {
  if (superAdmin.role !== "owner") {
    return errorResponse("Only owners can invite super admins", 403);
  }

  const admin = getServiceClient();
  const { email, name, role } = body;

  if (!email || !name) return errorResponse("email and name are required");
  if (!["owner", "staff"].includes(role)) {
    return errorResponse("role must be owner or staff");
  }

  const { data: existing } = await admin
    .from("super_admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) return errorResponse("Super admin with this email already exists");

  const { data: newAdmin, error } = await admin
    .from("super_admins")
    .insert({ email, name, role, status: "active" })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  const { data: authUser } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, is_super_admin: true },
  });

  if (authUser?.user) {
    await admin
      .from("super_admins")
      .update({ supabase_auth_id: authUser.user.id })
      .eq("id", newAdmin.id);

    await admin.auth.resetPasswordForEmail(email);
  }

  const inviteToken = crypto.randomUUID();
  await admin.from("invitations").insert({
    token: inviteToken,
    type: "super_admin",
    invitee_email: email,
    invitee_name: name,
    invited_by: superAdmin.email,
    role,
    status: "pending",
  });

  await logAudit(admin, {
    action: "super_admin_invited",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "super_admin",
    details: { invitee_email: email, invitee_role: role },
  });

  return jsonResponse({ superAdmin: newAdmin }, 201);
}

async function handleUpdateSuperAdmin(
  body: { admin_id: string; role?: string; status?: string },
  superAdmin: { email: string; name: string; role: string }
) {
  if (superAdmin.role !== "owner") {
    return errorResponse("Only owners can modify super admins", 403);
  }

  const admin = getServiceClient();
  const { admin_id, role, status } = body;

  const updateData: Record<string, unknown> = {};
  if (role) updateData.role = role;
  if (status) updateData.status = status;

  const { data: updatedAdmin, error } = await admin
    .from("super_admins")
    .update(updateData)
    .eq("id", admin_id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: "super_admin_updated",
    user_email: superAdmin.email,
    user_name: superAdmin.name,
    user_role: superAdmin.role,
    resource: "super_admin",
    details: { target_admin_id: admin_id, changes: updateData },
  });

  return jsonResponse({ superAdmin: updatedAdmin });
}

async function handleGetAuditLog(url: URL) {
  const admin = getServiceClient();
  const workspaceId = url.searchParams.get("workspace_id");
  const actionFilter = url.searchParams.get("action");
  const limit = parseInt(url.searchParams.get("limit") || "100");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = admin
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (workspaceId) query = query.eq("workspace_id", workspaceId);
  if (actionFilter) query = query.eq("action", actionFilter);

  const { data, count, error } = await query;
  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ entries: data || [], total: count || 0 });
}

async function handleListAllInvitations(url: URL) {
  const admin = getServiceClient();
  const statusFilter = url.searchParams.get("status");
  const workspaceId = url.searchParams.get("workspace_id");

  let query = admin
    .from("invitations")
    .select("*, workspaces(name, slug)")
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (workspaceId) query = query.eq("workspace_id", workspaceId);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ invitations: data || [] });
}

async function handleAcceptInvitation(body: {
  token: string;
  name: string;
  password: string;
}) {
  const admin = getServiceClient();
  const { token, name, password } = body;

  if (!token || !name || !password) {
    return errorResponse("token, name, and password are required");
  }

  if (password.length < 8) {
    return errorResponse("Password must be at least 8 characters");
  }

  const { data: invitation } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!invitation) {
    return errorResponse("Invalid or expired invitation", 404);
  }

  const { data: authUser, error: authError } = await admin.auth.admin.createUser(
    {
      email: invitation.invitee_email,
      password,
      email_confirm: true,
      user_metadata: { name },
    }
  );

  if (authError) {
    if (authError.message.includes("already been registered")) {
      const { data: { users } } = await admin.auth.admin.listUsers();
      const existingUser = users?.find(
        (u: { email?: string }) => u.email === invitation.invitee_email
      );
      if (existingUser) {
        await admin.auth.admin.updateUserById(existingUser.id, { password });

        if (invitation.workspace_id) {
          await admin.from("app_users").upsert(
            {
              email: invitation.invitee_email,
              name,
              role: invitation.role,
              workspace_id: invitation.workspace_id,
              status: "active",
              assigned_clients: ["all"],
              password_hash: "supabase_auth",
            },
            { onConflict: "email" }
          );
        }

        await admin
          .from("invitations")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("id", invitation.id);

        return jsonResponse({ success: true, email: invitation.invitee_email });
      }
    }
    return errorResponse(authError.message, 500);
  }

  if (invitation.workspace_id && authUser?.user) {
    await admin.from("app_users").insert({
      email: invitation.invitee_email,
      name,
      role: invitation.role,
      workspace_id: invitation.workspace_id,
      status: "active",
      assigned_clients: ["all"],
      password_hash: "supabase_auth",
    });
  }

  await admin
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  await logAudit(admin, {
    action: "invitation_accepted",
    user_email: invitation.invitee_email,
    user_name: name,
    user_role: invitation.role,
    resource: "invitation",
    details: {
      invitation_id: invitation.id,
      invitation_type: invitation.type,
    },
    workspace_id: invitation.workspace_id,
  });

  return jsonResponse({ success: true, email: invitation.invitee_email });
}

async function handleValidateInvitation(token: string) {
  const admin = getServiceClient();

  const { data: invitation } = await admin
    .from("invitations")
    .select("id, invitee_email, invitee_name, type, role, expires_at, workspace_id, workspaces(name)")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!invitation) {
    return errorResponse("Invalid or expired invitation", 404);
  }

  return jsonResponse({ invitation });
}

async function handleBootstrapOwner(body: {
  email: string;
  name: string;
  password: string;
}) {
  const admin = getServiceClient();
  const { email, name, password } = body;

  if (!email || !name || !password) {
    return errorResponse("email, name, and password are required");
  }

  const { count } = await admin
    .from("super_admins")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    return errorResponse("Setup has already been completed", 403);
  }

  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, is_super_admin: true },
    });

  if (authError) return errorResponse(authError.message, 500);

  const { data: superAdmin, error } = await admin
    .from("super_admins")
    .insert({
      email,
      name,
      role: "owner",
      status: "active",
      supabase_auth_id: authUser.user.id,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  await logAudit(admin, {
    action: "platform_bootstrapped",
    user_email: email,
    user_name: name,
    user_role: "owner",
    resource: "super_admin",
    details: { first_owner: true },
  });

  return jsonResponse({ superAdmin }, 201);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/super-admin", "").replace(/^\/+/, "");

    if (path === "bootstrap" && req.method === "POST") {
      const body = await req.json();
      return await handleBootstrapOwner(body);
    }

    if (path === "accept-invitation" && req.method === "POST") {
      const body = await req.json();
      return await handleAcceptInvitation(body);
    }

    if (path === "validate-invitation" && req.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) return errorResponse("token is required");
      return await handleValidateInvitation(token);
    }

    const authHeader = req.headers.get("Authorization");
    const superAdmin = await verifySuperAdmin(authHeader);
    if (!superAdmin) {
      return errorResponse("Unauthorized", 401);
    }

    await getServiceClient()
      .from("super_admins")
      .update({ last_login: new Date().toISOString() })
      .eq("id", superAdmin.id);

    switch (req.method) {
      case "GET": {
        if (path === "stats") return await handleGetStats(superAdmin);
        if (path === "workspaces") return await handleListWorkspaces();
        if (path.startsWith("workspaces/")) {
          const wsId = path.split("/")[1];
          return await handleGetWorkspaceDetail(wsId);
        }
        if (path === "super-admins") return await handleListSuperAdmins();
        if (path === "audit-log") return await handleGetAuditLog(url);
        if (path === "invitations") return await handleListAllInvitations(url);
        break;
      }
      case "POST": {
        const body = await req.json();
        if (path === "workspaces") return await handleCreateWorkspace(body, superAdmin);
        if (path === "invite-user") return await handleInviteUser(body, superAdmin);
        if (path === "invite-super-admin") return await handleInviteSuperAdmin(body, superAdmin);
        break;
      }
      case "PUT": {
        const body = await req.json();
        if (path === "workspace-status") return await handleUpdateWorkspaceStatus(body, superAdmin);
        if (path === "workspace") return await handleUpdateWorkspace(body, superAdmin);
        if (path === "user-role") return await handleUpdateUserRole(body, superAdmin);
        if (path === "user-status") return await handleUpdateUserStatus(body, superAdmin);
        if (path === "super-admin") return await handleUpdateSuperAdmin(body, superAdmin);
        if (path === "revoke-invitation") return await handleRevokeInvitation(body, superAdmin);
        if (path === "resend-invitation") return await handleResendInvitation(body, superAdmin);
        if (path === "reset-password") return await handleResetUserPassword(body, superAdmin);
        break;
      }
      case "DELETE": {
        if (path.startsWith("user/")) {
          const parts = path.split("/");
          const body = { user_id: parts[1], workspace_id: url.searchParams.get("workspace_id") || "" };
          return await handleRemoveUser(body, superAdmin);
        }
        break;
      }
    }

    return errorResponse("Not found", 404);
  } catch (err) {
    console.error("Edge function error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Internal server error",
      500
    );
  }
});
