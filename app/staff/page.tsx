"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Pencil, Trash2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import { addStaffMember, updateStaffMember, deleteStaffMember } from "@/app/actions/staff-actions"

interface Staff {
  id: string
  email: string
  role: "admin" | "employee"
  created_at: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "employee" as "admin" | "employee",
  })

  useEffect(() => {
    checkAuth()
    fetchStaff()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = "/login"
      return
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (userData?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access staff management.",
        variant: "destructive",
      })
      window.location.href = "/dashboard"
      return
    }

    setCurrentUser(session.user)
  }

  const fetchStaff = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setStaff(data || [])
    } catch (error) {
      console.error("Error fetching staff:", error)
      toast({
        title: "Error",
        description: "Failed to load staff members.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addStaffMember(formData.email, formData.password, formData.role)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: "✓ Staff Member Added Successfully",
        description: `${formData.email} has been added as ${formData.role === "admin" ? "an administrator" : "an employee"}.`,
        duration: 5000,
      })

      setIsAddDialogOpen(false)
      setFormData({
        email: "",
        password: "",
        role: "employee",
      })
      fetchStaff()
    } catch (error: any) {
      console.error("Error adding staff:", error)
      toast({
        title: "✗ Failed to Add Staff Member",
        description: error.message || "An error occurred while adding the staff member. Please try again.",
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return

    setLoading(true)

    try {
      const result = await updateStaffMember(editingStaff.id, formData.role)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: "✓ Staff Member Updated Successfully",
        description: `${formData.email}'s role has been updated to ${formData.role}.`,
        duration: 5000,
      })

      setIsEditDialogOpen(false)
      setEditingStaff(null)
      setFormData({
        email: "",
        password: "",
        role: "employee",
      })
      fetchStaff()
    } catch (error: any) {
      console.error("Error updating staff:", error)
      toast({
        title: "✗ Failed to Update Staff Member",
        description: error.message || "An error occurred while updating the staff member. Please try again.",
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) return

    setLoading(true)

    try {
      const result = await deleteStaffMember(staffId)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: "✓ Staff Member Deleted Successfully",
        description: "The staff member has been permanently removed from the system.",
        duration: 5000,
      })

      fetchStaff()
    } catch (error: any) {
      console.error("Error deleting staff:", error)
      toast({
        title: "✗ Failed to Delete Staff Member",
        description: error.message || "An error occurred while deleting the staff member. Please try again.",
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setFormData({
      email: staffMember.email,
      password: "",
      role: staffMember.role,
    })
    setIsEditDialogOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#5A4A3A]">Staff Management</h1>
            <p className="text-[#8B7355] mt-1">Manage your staff members and their roles.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#7D9B7F] hover:bg-[#6A8A6C] text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddStaff}>
                <DialogHeader>
                  <DialogTitle className="text-[#5A4A3A]">Add New Staff Member</DialogTitle>
                  <DialogDescription className="text-[#8B7355]">
                    Create a new staff account. They will receive an email to verify their account.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-[#5A4A3A]">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="border-[#E5DCC8]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-[#5A4A3A]">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      className="border-[#E5DCC8]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role" className="text-[#5A4A3A]">
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "admin" | "employee") => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger className="border-[#E5DCC8]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading} className="bg-[#7D9B7F] hover:bg-[#6A8A6C] text-white">
                    {loading ? "Adding..." : "Add Staff Member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-[#E5DCC8]">
          <CardHeader className="bg-white">
            <CardTitle className="text-[#5A4A3A] flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription className="text-[#8B7355]">
              {staff.length} total staff member{staff.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7D9B7F]"></div>
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center p-8 text-[#8B7355]">
                No staff members found. Add your first team member to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5DCC8]">
                    <TableHead className="text-[#5A4A3A]">Email</TableHead>
                    <TableHead className="text-[#5A4A3A]">Role</TableHead>
                    <TableHead className="text-[#5A4A3A]">Joined</TableHead>
                    <TableHead className="text-right text-[#5A4A3A]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id} className="border-[#E5DCC8]">
                      <TableCell className="font-medium text-[#5A4A3A]">{member.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === "admin" ? "default" : "secondary"}
                          className={member.role === "admin" ? "bg-[#7D9B7F] text-white" : "bg-[#C89B9B] text-white"}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#8B7355]">
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(member)}
                            className="text-[#7D9B7F] hover:text-[#6A8A6C] hover:bg-[#7D9B7F]/10"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Update Info
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStaff(member.id)}
                            disabled={member.id === currentUser?.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleUpdateStaff}>
              <DialogHeader>
                <DialogTitle className="text-[#5A4A3A]">Edit Staff Member</DialogTitle>
                <DialogDescription className="text-[#8B7355]">Update staff member role.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_email" className="text-[#5A4A3A]">
                    Email
                  </Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="border-[#E5DCC8] bg-gray-50"
                  />
                  <p className="text-xs text-[#8B7355]">Email cannot be changed</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_role" className="text-[#5A4A3A]">
                    Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "employee") => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="border-[#E5DCC8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading} className="bg-[#7D9B7F] hover:bg-[#6A8A6C] text-white">
                  {loading ? "Updating..." : "Update Staff Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
