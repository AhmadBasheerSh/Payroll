 'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { listDepartments, addDepartment as apiAddDepartment, updateDepartment as apiUpdateDepartment, deleteDepartment as apiDeleteDepartment } from '@/lib/api/departments'
import { listEmployees } from '@/lib/api/employees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Users, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { Department } from '@/lib/types'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [newDeptName, setNewDeptName] = useState('')
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleAdd = async () => {
    if (!newDeptName.trim()) {
      toast.error('الرجاء إدخال اسم القسم')
      return
    }
    const res = await apiAddDepartment(newDeptName)
    if (res.error) {
      toast.error('فشل إضافة القسم')
      return
    }
    setNewDeptName('')
    setAddDialogOpen(false)
    toast.success('تم إضافة القسم بنجاح')
    location.reload()
  }

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setEditName(dept.name)
    setEditDialogOpen(true)
  }

  const saveEdit = async () => {
    if (editingDept && editName.trim()) {
      const res = await apiUpdateDepartment(editingDept.id, editName)
      if (res.error) {
        toast.error('فشل تحديث القسم')
        return
      }
      setEditDialogOpen(false)
      setEditingDept(null)
      toast.success('تم تحديث القسم بنجاح')
      location.reload()
    }
  }

  const handleDelete = (dept: Department) => {
    const deptEmployees = employees.filter(e => String(e.department_id || e.departmentId) === String(dept.id))
    if (deptEmployees.length > 0) {
      toast.error('لا يمكن حذف قسم يحتوي على موظفين')
      return
    }
    setDeptToDelete(dept)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (deptToDelete) {
      const res = await apiDeleteDepartment(deptToDelete.id)
      if (res.error) {
        toast.error('فشل حذف القسم')
        return
      }
      toast.success('تم حذف القسم بنجاح')
      setDeleteDialogOpen(false)
      setDeptToDelete(null)
      location.reload()
    }
  }

  useEffect(() => {
    async function load() {
      const deps = await listDepartments()
      if (!deps.error && deps.data) setDepartments(deps.data)
      const emps = await listEmployees()
      if (!emps.error && emps.data) setEmployees(emps.data)
    }
    load()
  }, [])

  // Get employee count for each department
  const getDeptEmployeeCount = (deptId: string) => {
    return employees.filter(e => e.departmentId === deptId).length
  }

  // Get total salary for each department
  const getDeptTotalSalary = (deptId: string) => {
    return employees
      .filter(e => e.departmentId === deptId)
      .reduce((sum, e) => sum + e.baseSalary, 0)
  }

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="إدارة الأقسام" 
        description={`${departments.length} قسم`}
      />
      
      <div className="p-6 space-y-6">
        {/* Add Button */}
        <div className="flex justify-end">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة قسم
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة قسم جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="اسم القسم"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAdd}>إضافة</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, index) => {
            const employeeCount = getDeptEmployeeCount(dept.id)
            const totalSalary = getDeptTotalSalary(dept.id)
            
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{dept.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {employeeCount} موظف
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(dept)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(dept)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">إجمالي الرواتب</span>
                    <span className="font-medium">{totalSalary.toLocaleString()} ₪</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ 
                        width: employeeCount > 0 
                          ? `${Math.min((employeeCount / 10) * 100, 100)}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {departments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد أقسام</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإضافة قسم جديد</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل القسم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="اسم القسم"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={saveEdit}>حفظ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف قسم {deptToDelete?.name} نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
