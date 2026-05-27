'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { EmployeesTable } from '@/components/admin/employees-table'
import { EmployeeDialog } from '@/components/admin/employee-dialog'
import { listEmployees, deleteEmployee as apiDeleteEmployee } from '@/lib/api/employees'
import { listDepartments } from '@/lib/api/departments'
import { listBranches } from '@/lib/api/branches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Plus, Search, FileSpreadsheet, Filter, X } from 'lucide-react'
import type { Employee, EmployeeStatus } from '@/lib/types'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Badge } from '@/components/ui/badge'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const loadData = async () => {
    setLoading(true)
    const [emp, deps, br] = await Promise.all([
      listEmployees(),
      listDepartments(),
      listBranches(),
    ])

    if (emp.error) {
      toast.error(emp.error.message || 'فشل تحميل بيانات الموظفين')
    } else {
      setEmployees((emp.data || []) as Employee[])
    }

    if (!deps.error && deps.data) setDepartments(deps.data)
    if (!br.error && br.data) setBranches(br.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const searchValue = search.toLowerCase()
    const matchesSearch = 
      emp.fullName?.toLowerCase().includes(searchValue) || 
      emp.employeeId?.toLowerCase().includes(searchValue) ||
      emp.nationalId?.includes(search) ||
      emp.phoneNumber?.includes(search)
    const matchesDepartment = departmentFilter === 'all' || emp.departmentId === departmentFilter
    const matchesBranch = branchFilter === 'all' || emp.branchId === branchFilter
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter
    return matchesSearch && matchesDepartment && matchesBranch && matchesStatus
  })
  
  const activeFiltersCount = [departmentFilter, branchFilter, statusFilter].filter(f => f !== 'all').length

  const clearFilters = () => {
    setDepartmentFilter('all')
    setBranchFilter('all')
    setStatusFilter('all')
    setSearch('')
  }

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee)
    setDialogMode('view')
    setDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (employeeToDelete) {
      const res = await apiDeleteEmployee(employeeToDelete.id)
      if (res.error) {
        toast.error(res.error.message || 'فشل حذف الموظف')
        return
      }
      setEmployees(prev => prev.filter(emp => emp.id !== employeeToDelete.id))
      toast.success('تم حذف الموظف بنجاح')
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  const handleAdd = () => {
    setSelectedEmployee(null)
    setDialogMode('add')
    setDialogOpen(true)
  }

  const exportToPDF = (employee: Employee) => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('O2 Payroll System', 105, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text('Employee Profile', 105, 30, { align: 'center' })
    
    // Employee Info
    doc.setFontSize(12)
    const startY = 50
    doc.text(`Employee ID: ${employee.employeeId}`, 20, startY)
    doc.text(`Name: ${employee.fullName}`, 20, startY + 10)
    doc.text(`Department: ${employee.department}`, 20, startY + 20)
    doc.text(`Branch: ${employee.branch}`, 20, startY + 30)
    doc.text(`Work Type: ${employee.workType === 'hourly' ? 'Hourly' : 'Daily'}`, 20, startY + 40)
    doc.text(`Rate: ${employee.workType === 'hourly' ? employee.hourlyRate : employee.dailyRate} ILS`, 20, startY + 50)
    doc.text(`Status: ${employee.status}`, 20, startY + 60)
    
    doc.save(`employee-${employee.employeeId}.pdf`)
    toast.success('تم تصدير الملف الشخصي')
  }

  const exportAllToExcel = () => {
    const headers = ['الرقم الوظيفي', 'الاسم', 'القسم', 'الفرع', 'نوع الدوام', 'السعر', 'الحالة', 'الجوال']
    const statusLabels: Record<EmployeeStatus, string> = {
      active: 'نشط',
      suspended: 'موقوف',
      terminated: 'مفصول'
    }
    
    const rows = filteredEmployees.map(emp => [
      emp.employeeId,
      emp.fullName,
      emp.department,
      emp.branch,
      emp.workType === 'hourly' ? 'ساعات' : 'يومية',
      emp.workType === 'hourly' ? emp.hourlyRate : emp.dailyRate,
      statusLabels[emp.status],
      emp.phoneNumber || ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'employees.csv'
    link.click()
    
    toast.success('تم تصدير البيانات')
  }

  // Stats
  const activeCount = employees.filter(e => e.status === 'active').length
  const suspendedCount = employees.filter(e => e.status === 'suspended').length
  const terminatedCount = employees.filter(e => e.status === 'terminated').length

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="إدارة الموظفين" 
        description={`${employees.length} موظف (${activeCount} نشط، ${suspendedCount} موقوف، ${terminatedCount} مفصول)`}
      />
      
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          >
            <p className="text-2xl font-bold">{employees.length}</p>
            <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md ${statusFilter === 'active' ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-sm text-muted-foreground">نشط</p>
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md ${statusFilter === 'suspended' ? 'ring-2 ring-amber-500' : ''}`}
          >
            <p className="text-2xl font-bold text-amber-600">{suspendedCount}</p>
            <p className="text-sm text-muted-foreground">موقوف</p>
          </button>
          <button
            onClick={() => setStatusFilter('terminated')}
            className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md ${statusFilter === 'terminated' ? 'ring-2 ring-red-500' : ''}`}
          >
            <p className="text-2xl font-bold text-red-600">{terminatedCount}</p>
            <p className="text-sm text-muted-foreground">مفصول</p>
          </button>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الرقم الوظيفي أو الجوال..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportAllToExcel}>
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">تصدير Excel</span>
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة موظف
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>فلترة:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفروع</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EmployeeStatus | 'all')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                  <SelectItem value="terminated">مفصول</SelectItem>
                </SelectContent>
              </Select>
              
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  مسح الفلاتر
                  <Badge variant="secondary" className="mr-1">
                    {activeFiltersCount}
                  </Badge>
                </Button>
              )}
            </div>
          </div>
          
          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            عرض {filteredEmployees.length} من أصل {employees.length} موظف
          </p>
        </motion.div>

        {/* Table */}
        {loading ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            جاري تحميل بيانات الموظفين...
          </div>
        ) : (
          <EmployeesTable
            employees={filteredEmployees}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExportPDF={exportToPDF}
          />
        )}
      </div>

      {/* Employee Dialog */}
      {dialogOpen && (
        <EmployeeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employee={selectedEmployee}
          mode={dialogMode}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الموظف {employeeToDelete?.fullName} نهائياً. لا يمكن التراجع عن هذا الإجراء.
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
