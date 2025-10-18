"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

async function checkIsAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userError || !userData) {
    throw new Error("User not found in database")
  }

  if (userData.role !== "admin") {
    throw new Error("Not authorized - admin access required")
  }

  return user.id
}

export async function addStaffMember(email: string, password: string, role: "admin" | "employee") {
  try {
    await checkIsAdmin()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Not authenticated")
    }

    const { data: currentUserData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()

    if (!currentUserData?.tenant_id) {
      throw new Error("Admin user has no tenant_id")
    }

    const adminClient = createAdminClient()

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: role,
        tenant_id: currentUserData.tenant_id,
      },
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error("Failed to create user")
    }

    return { success: true, message: `Staff member added successfully as ${role}.` }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to add staff member" }
  }
}

export async function updateStaffMember(staffId: string, role: "admin" | "employee") {
  try {
    const currentUserId = await checkIsAdmin()

    if (staffId === currentUserId) {
      throw new Error("You cannot change your own role")
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient.from("users").update({ role: role }).eq("id", staffId)

    if (error) {
      throw error
    }

    return { success: true, message: "Staff member updated successfully." }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update staff member" }
  }
}

export async function deleteStaffMember(staffId: string) {
  try {
    const currentUserId = await checkIsAdmin()

    if (staffId === currentUserId) {
      throw new Error("You cannot delete your own account")
    }

    const adminClient = createAdminClient()

    const { error: dbError } = await adminClient.from("users").delete().eq("id", staffId)

    if (dbError) {
      throw dbError
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(staffId)

    if (authError) {
      throw authError
    }

    return { success: true, message: "Staff member deleted successfully." }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete staff member" }
  }
}
