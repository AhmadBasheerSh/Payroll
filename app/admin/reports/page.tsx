'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { listEmployees } from '@/lib/api/employees'
import { listDepartments } from '@/lib/api/departments'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileDown, Printer, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { PaymentStatus } from '@/lib/types'

const statusLabels: Record<PaymentStatus, string> = {
  bank_transfer: 'تحويل بنكي',
  cash: 'كاش',
  processing: 'قيد المعالجة'
}

export default function ReportsPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    async function load() {
      const emps = await listEmployees()
      if (!emps.error && emps.data) {
        const mapped = (emps.data as any[]).map(e => ({
          id: e.id,
          employeeId: e.employee_id,
          fullName: e.full_name,
          department: e.departments?.name || '',
          departmentId: e.department_id,
          baseSalary: Number(e.base_salary) || 0,
          withdrawals: Number(e.withdrawals) || 0,
          deductions: 0,
          remaining: Number(e.remaining) || 0,
          paymentStatus: e.payment_status || 'processing'
        }))
        setEmployees(mapped)
      }
      const deps = await listDepartments()
      if (!deps.error && deps.data) setDepartments(deps.data)
    }
    load()
  }, [])

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesDept = selectedDepartment === 'all' || emp.departmentId === selectedDepartment
    const matchesStatus = selectedStatus === 'all' || emp.paymentStatus === selectedStatus
    return matchesDept && matchesStatus
  })

  // Calculate totals
  const totals = {
    salary: filteredEmployees.reduce((sum, e) => sum + e.baseSalary, 0),
    withdrawals: filteredEmployees.reduce((sum, e) => sum + e.withdrawals, 0),
    deductions: filteredEmployees.reduce((sum, e) => sum + e.deductions, 0),
    remaining: filteredEmployees.reduce((sum, e) => sum + e.remaining, 0),
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('O2 Payroll Report', 105, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })
    
    // Table data
    const tableData = filteredEmployees.map(emp => [
      emp.employeeId,
      emp.fullName,
      emp.department,
      `${emp.baseSalary.toLocaleString()} ILS`,
      `${emp.withdrawals.toLocaleString()} ILS`,
      `${emp.deductions.toLocaleString()} ILS`,
      `${emp.remaining.toLocaleString()} ILS`,
      statusLabels[emp.paymentStatus as PaymentStatus],
    ])
    
    // Add totals row
    tableData.push([
      '',
      'Total',
      '',
      `${totals.salary.toLocaleString()} ILS`,
      `${totals.withdrawals.toLocaleString()} ILS`,
      `${totals.deductions.toLocaleString()} ILS`,
      `${totals.remaining.toLocaleString()} ILS`,
      '',
    ])
    
    // @ts-expect-error - jspdf-autotable types
    doc.autoTable({
      startY: 40,
      head: [['ID', 'Name', 'Dept', 'Salary', 'Withdrawals', 'Deductions', 'Remaining', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    })
    
    doc.save('payroll-report.pdf')
    toast.success('تم تصدير التقرير')
  }

  const exportToExcel = () => {
    const headers = ['الرقم الوظيفي', 'الاسم', 'القسم', 'الراتب', 'السحوبات', 'الخصومات', 'المتبقي', 'الحالة']
    
    const rows = filteredEmployees.map(emp => [
      emp.employeeId,
      emp.fullName,
      emp.department,
      emp.baseSalary,
      emp.withdrawals,
      emp.deductions,
      emp.remaining,
      statusLabels[emp.paymentStatus as PaymentStatus]
    ])
    
    // Add totals
    rows.push(['', 'الإجمالي', '', totals.salary, totals.withdrawals, totals.deductions, totals.remaining, ''])
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'payroll-report.csv'
    link.click()
    
    toast.success('تم تصدير التقرير')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="التقارير" 
        description="تقارير الرواتب والموظفين"
      />
      
      <div className="p-6 space-y-6">
        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="جميع الأقسام" />
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
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
              <SelectItem value="cash">كاش</SelectItem>
              <SelectItem value="processing">قيد المعالجة</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2 mr-auto">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 ml-2" />
              Excel
            </Button>
            <Button onClick={exportToPDF}>
              <FileText className="h-4 w-4 ml-2" />
              PDF
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">إجمالي الرواتب</p>
            <p className="text-2xl font-bold text-primary">{totals.salary.toLocaleString()} ₪</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">إجمالي السحوبات</p>
            <p className="text-2xl font-bold text-destructive">{totals.withdrawals.toLocaleString()} ₪</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
            <p className="text-2xl font-bold text-amber-600">{totals.deductions.toLocaleString()} ₪</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">صافي المتبقي</p>
            <p className="text-2xl font-bold text-green-600">{totals.remaining.toLocaleString()} ₪</p>
          </div>
        </motion.div>

        {/* Report Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card overflow-hidden print:shadow-none"
        >
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">
              تقرير الرواتب - {filteredEmployees.length} موظف
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">الرقم الوظيفي</TableHead>
                  <TableHead className="text-right font-semibold">الاسم</TableHead>
                  <TableHead className="text-right font-semibold">القسم</TableHead>
                  <TableHead className="text-right font-semibold">الراتب</TableHead>
                  <TableHead className="text-right font-semibold">السحوبات</TableHead>
                  <TableHead className="text-right font-semibold">الخصومات</TableHead>
                  <TableHead className="text-right font-semibold">المتبقي</TableHead>
                  <TableHead className="text-right font-semibold">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono">{emp.employeeId}</TableCell>
                    <TableCell className="font-medium">{emp.fullName}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.baseSalary.toLocaleString()} ₪</TableCell>
                    <TableCell className="text-destructive">{emp.withdrawals.toLocaleString()} ₪</TableCell>
                    <TableCell className="text-amber-600">{emp.deductions.toLocaleString()} ₪</TableCell>
                    <TableCell className={emp.remaining < 700 ? 'text-amber-600 font-semibold' : 'text-green-600'}>
                      {emp.remaining.toLocaleString()} ₪
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {statusLabels[emp.paymentStatus as PaymentStatus]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3}>الإجمالي</TableCell>
                  <TableCell>{totals.salary.toLocaleString()} ₪</TableCell>
                  <TableCell className="text-destructive">{totals.withdrawals.toLocaleString()} ₪</TableCell>
                  <TableCell className="text-amber-600">{totals.deductions.toLocaleString()} ₪</TableCell>
                  <TableCell className="text-green-600">{totals.remaining.toLocaleString()} ₪</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
