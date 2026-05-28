'use client'

import { use, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/admin/header'
import { listEmployees } from '@/lib/api/employees'
import {
  getPayrollSheet,
  listPayrollEntriesForSheet,
  addPayrollEntry as apiAddPayrollEntry,
  updatePayrollEntry as apiUpdatePayrollEntry,
  deletePayrollEntry as apiDeletePayrollEntry,
  updatePayrollSheet as apiUpdatePayrollSheet,
} from '@/lib/api/payroll'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  FileSpreadsheet, 
  Upload,
  ArrowRight,
  DollarSign,
  Users,
  TrendingDown,
  Wallet,
  Pencil,
  Trash2,
  Check,
  Lock,
  Calculator
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { PayrollEntry, PayrollSheet, PayrollStatus, Employee } from '@/lib/types'
import * as XLSX from 'xlsx'

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

const statusLabels: Record<PayrollStatus, string> = {
  draft: 'مسودة',
  approved: 'معتمد',
  closed: 'مغلق'
}

const statusColors: Record<PayrollStatus, string> = {
  draft: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200'
}

export default function PayrollSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [sheet, setSheet] = useState<PayrollSheet | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    employeeId: '',
    hoursOrDays: 0,
    withdrawals: 0,
    cashReceived: 0,
    transferReceived: 0,
    notes: ''
  })
  
  const loadData = async () => {
    setLoading(true)
    const [sheetRes, entriesRes, employeesRes] = await Promise.all([
      getPayrollSheet(id),
      listPayrollEntriesForSheet(id),
      listEmployees(),
    ])

    if (sheetRes.error) {
      toast.error(sheetRes.error.message || 'فشل تحميل كشف الرواتب')
      setSheet(null)
    } else if (sheetRes.data) {
      setSheet({
        ...(sheetRes.data as PayrollSheet),
        entries: (entriesRes.data || []) as PayrollEntry[],
      })
    }

    if (entriesRes.error) toast.error(entriesRes.error.message || 'فشل تحميل سجلات الكشف')
    if (employeesRes.error) toast.error(employeesRes.error.message || 'فشل تحميل الموظفين')
    else setEmployees((employeesRes.data || []) as Employee[])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])
  
  if (loading || !sheet) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="كشف الرواتب" description="تحميل..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }
  
  const isEditable = sheet.status === 'draft'
  const activeEmployees = employees.filter(e => e.status === 'active')
  
  const getEmployee = (employeeId: string): Employee | undefined => {
    return employees.find(e => e.employeeId === employeeId)
  }
  
  const calculateEntry = (emp: Employee, hoursOrDays: number, withdrawals: number, cashReceived: number, transferReceived: number) => {
    const rate = emp.workType === 'hourly' ? emp.hourlyRate : emp.dailyRate
    const grossSalary = hoursOrDays * rate
    const netSalary = grossSalary - withdrawals
    const remaining = netSalary - cashReceived - transferReceived
    
    return { rate, grossSalary, netSalary, remaining }
  }
  
  const handleAddEntry = () => {
    setSelectedEntry(null)
    setIsEditing(false)
    setFormData({
      employeeId: '',
      hoursOrDays: 0,
      withdrawals: 0,
      cashReceived: 0,
      transferReceived: 0,
      notes: ''
    })
    setEntryDialogOpen(true)
  }
  
  const handleEditEntry = (entry: PayrollEntry) => {
    setSelectedEntry(entry)
    setIsEditing(true)
    setFormData({
      employeeId: entry.employeeId,
      hoursOrDays: entry.hoursOrDays,
      withdrawals: entry.withdrawals,
      cashReceived: entry.cashReceived,
      transferReceived: entry.transferReceived,
      notes: entry.notes
    })
    setEntryDialogOpen(true)
  }
  
  const refreshSheet = async () => {
    const [sheetRes, entriesRes] = await Promise.all([
      getPayrollSheet(id),
      listPayrollEntriesForSheet(id),
    ])
    if (!sheetRes.error && sheetRes.data) {
      setSheet({
        ...(sheetRes.data as PayrollSheet),
        entries: (entriesRes.data || []) as PayrollEntry[],
      })
    }
  }

  const handleSaveEntry = async () => {
    const emp = getEmployee(formData.employeeId)
    if (!emp) {
      toast.error('يرجى اختيار موظف صحيح')
      return
    }
    
    const { rate, grossSalary, netSalary, remaining } = calculateEntry(
      emp, 
      formData.hoursOrDays, 
      formData.withdrawals, 
      formData.cashReceived, 
      formData.transferReceived
    )
    
    const entryData: Omit<PayrollEntry, 'id'> = {
      employeeId: emp.employeeId,
      employee_id: emp.id,
      employeeName: emp.fullName,
      employeeNumber: emp.employeeId,
      department: emp.department,
      branch: emp.branch,
      workType: emp.workType,
      hoursOrDays: formData.hoursOrDays,
      rate,
      grossSalary,
      withdrawals: formData.withdrawals,
      netSalary,
      cashReceived: formData.cashReceived,
      transferReceived: formData.transferReceived,
      remaining,
      notes: formData.notes
    }
    
    if (isEditing && selectedEntry) {
      const res = await apiUpdatePayrollEntry(selectedEntry.id, entryData)
      if (res.error) return toast.error(res.error.message || 'فشل تحديث بيانات الراتب')
      toast.success('تم تحديث بيانات الراتب')
    } else {
      // Check if employee already exists in sheet
      const exists = sheet.entries.some(e => e.employeeId === emp.employeeId)
      if (exists) {
        toast.error('هذا الموظف موجود بالفعل في الكشف')
        return
      }
      const res = await apiAddPayrollEntry(entryData, sheet.id)
      if (res.error) return toast.error(res.error.message || 'فشل إضافة الموظف للكشف')
      toast.success('تم إضافة الموظف للكشف')
    }
    
    setEntryDialogOpen(false)
    await refreshSheet()
  }
  
  const handleDeleteEntry = async () => {
    if (selectedEntry) {
      const res = await apiDeletePayrollEntry(selectedEntry.id)
      if (res.error) return toast.error(res.error.message || 'فشل حذف السجل')
      toast.success('تم حذف السجل')
      setDeleteDialogOpen(false)
      setSelectedEntry(null)
      await refreshSheet()
    }
  }
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]
        
        const entries: Omit<PayrollEntry, 'id'>[] = []
        let skipped = 0
        
        jsonData.forEach((row) => {
          const employeeNumber = String(row['الرقم الوظيفي'] || row['employeeId'] || row['employee_id'] || '')
          const emp = getEmployee(employeeNumber)
          
          if (!emp) {
            skipped++
            return
          }
          
          // Skip if already in sheet
          if (sheet.entries.some(e => e.employeeId === emp.employeeId)) {
            skipped++
            return
          }
          
          const hoursOrDays = Number(row['الساعات'] || row['الأيام'] || row['hours'] || row['days'] || 0)
          const withdrawals = Number(row['السحوبات'] || row['withdrawals'] || 0)
          const cashReceived = Number(row['الاستلام نقداً'] || row['cash'] || 0)
          const transferReceived = Number(row['الاستلام تحويل'] || row['transfer'] || 0)
          const notes = String(row['ملاحظات'] || row['notes'] || '')
          
          const { rate, grossSalary, netSalary, remaining } = calculateEntry(
            emp, hoursOrDays, withdrawals, cashReceived, transferReceived
          )
          
          entries.push({
            employeeId: emp.employeeId,
            employee_id: emp.id,
            employeeName: emp.fullName,
            employeeNumber: emp.employeeId,
            department: emp.department,
            branch: emp.branch,
            workType: emp.workType,
            hoursOrDays,
            rate,
            grossSalary,
            withdrawals,
            netSalary,
            cashReceived,
            transferReceived,
            remaining,
            notes
          })
        })
        
        if (entries.length > 0) {
          Promise.all(entries.map(entry => apiAddPayrollEntry(entry, sheet.id))).then(async results => {
            const failed = results.filter(result => result.error).length
            await refreshSheet()
            if (failed > 0) toast.error(`فشل استيراد ${failed} سجل`)
          })
          toast.success(`تم استيراد ${entries.length} سجل${skipped > 0 ? ` (${skipped} تم تخطيهم)` : ''}`)
        } else {
          toast.error('لم يتم العثور على بيانات صالحة للاستيراد')
        }
        
        setImportDialogOpen(false)
      } catch {
        toast.error('حدث خطأ أثناء قراءة الملف')
      }
    }
    reader.readAsBinaryString(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const handleApprove = async () => {
    const res = await apiUpdatePayrollSheet(sheet.id, { status: 'approved' })
    if (res.error) return toast.error(res.error.message || 'فشل اعتماد الكشف')
    setSheet(prev => prev ? { ...prev, status: 'approved' } : prev)
    toast.success('تم اعتماد كشف الرواتب')
  }
  
  const handleClose = async () => {
    const res = await apiUpdatePayrollSheet(sheet.id, { status: 'closed' })
    if (res.error) return toast.error(res.error.message || 'فشل إغلاق الكشف')
    setSheet(prev => prev ? { ...prev, status: 'closed' } : prev)
    toast.success('تم إغلاق كشف الرواتب')
  }
  
  // Selected employee preview
  const selectedEmployee = formData.employeeId ? getEmployee(formData.employeeId) : null
  const preview = selectedEmployee ? calculateEntry(
    selectedEmployee,
    formData.hoursOrDays,
    formData.withdrawals,
    formData.cashReceived,
    formData.transferReceived
  ) : null
  
  return (
    <div className="min-h-screen">
      <AdminHeader 
        title={`كشف رواتب ${monthNames[sheet.month - 1]} ${sheet.year}`}
        description={`${sheet.entries.length} موظف`}
      />
      
      <div className="p-6 space-y-6">
        {/* Back & Status */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin/payroll')}>
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
            <Badge variant="outline" className={`${statusColors[sheet.status]} border font-medium text-base px-4 py-1`}>
              {statusLabels[sheet.status]}
            </Badge>
          </div>
          
          {isEditable && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-4 w-4 ml-2" />
                استيراد Excel
              </Button>
              <Button variant="outline" onClick={handleAddEntry}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة يدوي
              </Button>
              {sheet.entries.length > 0 && (
                <Button onClick={handleApprove}>
                  <Check className="h-4 w-4 ml-2" />
                  اعتماد الكشف
                </Button>
              )}
            </div>
          )}
          
          {sheet.status === 'approved' && (
            <Button onClick={handleClose}>
              <Lock className="h-4 w-4 ml-2" />
              إغلاق الكشف
            </Button>
          )}
        </motion.div>
        
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-6 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{sheet.entries.length}</p>
                  <p className="text-xs text-muted-foreground">موظف</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xl font-bold">{sheet.totalGrossSalary.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الرواتب</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-xl font-bold">{sheet.totalWithdrawals.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">السحوبات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{sheet.totalNetSalary.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">صافي الرواتب</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xl font-bold">{(sheet.totalCashReceived + sheet.totalTransferReceived).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">المستلم</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xl font-bold text-primary">{sheet.totalRemaining.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">المتبقي (مرحل)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Entries Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card overflow-x-auto"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right font-semibold whitespace-nowrap">الرقم الوظيفي</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">الموظف</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">القسم</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">ساعات/أيام</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">السعر</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">إجمالي الراتب</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">السحوبات</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">صافي الراتب</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">نقداً</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">تحويل</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">المتبقي</TableHead>
                {isEditable && (
                  <TableHead className="text-right font-semibold whitespace-nowrap">إجراءات</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheet.entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isEditable ? 12 : 11} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet className="h-8 w-8 opacity-50" />
                      <p>لا توجد سجلات في الكشف</p>
                      {isEditable && (
                        <div className="flex gap-2">
                          <Button variant="link" onClick={handleAddEntry}>
                            إضافة يدوي
                          </Button>
                          <span className="text-muted-foreground">أو</span>
                          <Button variant="link" onClick={() => setImportDialogOpen(true)}>
                            استيراد Excel
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sheet.entries.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-sm">{entry.employeeNumber}</TableCell>
                    <TableCell className="font-medium">{entry.employeeName}</TableCell>
                    <TableCell>{entry.department}</TableCell>
                    <TableCell>{entry.hoursOrDays}</TableCell>
                    <TableCell>{entry.rate} ₪</TableCell>
                    <TableCell>{entry.grossSalary.toLocaleString()} ₪</TableCell>
                    <TableCell className="text-destructive">{entry.withdrawals.toLocaleString()} ₪</TableCell>
                    <TableCell className="font-semibold">{entry.netSalary.toLocaleString()} ₪</TableCell>
                    <TableCell>{entry.cashReceived.toLocaleString()} ₪</TableCell>
                    <TableCell>{entry.transferReceived.toLocaleString()} ₪</TableCell>
                    <TableCell className={entry.remaining > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
                      {entry.remaining.toLocaleString()} ₪
                    </TableCell>
                    {isEditable && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditEntry(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedEntry(entry)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>
      
      {/* Entry Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'تعديل بيانات الراتب' : 'إضافة موظف للكشف'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>الموظف</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(v) => setFormData(prev => ({ ...prev, employeeId: v }))}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees
                    .filter(emp => isEditing || !sheet.entries.some(e => e.employeeId === emp.employeeId))
                    .map(emp => (
                      <SelectItem key={emp.id} value={emp.employeeId}>
                        {emp.employeeId} - {emp.fullName} ({emp.department})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEmployee && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">نوع الدوام:</span>
                  <span>{selectedEmployee.workType === 'hourly' ? 'ساعات' : 'يومية'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">السعر:</span>
                  <span>{selectedEmployee.workType === 'hourly' ? selectedEmployee.hourlyRate : selectedEmployee.dailyRate} ₪</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{selectedEmployee?.workType === 'hourly' ? 'عدد الساعات' : 'عدد الأيام'}</Label>
                <Input
                  type="number"
                  value={formData.hoursOrDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, hoursOrDays: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              
              <div className="space-y-2">
                <Label>السحوبات (₪)</Label>
                <Input
                  type="number"
                  value={formData.withdrawals}
                  onChange={(e) => setFormData(prev => ({ ...prev, withdrawals: Number(e.target.value) }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>الاستلام نقداً (₪)</Label>
                <Input
                  type="number"
                  value={formData.cashReceived}
                  onChange={(e) => setFormData(prev => ({ ...prev, cashReceived: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              
              <div className="space-y-2">
                <Label>الاستلام تحويل (₪)</Label>
                <Input
                  type="number"
                  value={formData.transferReceived}
                  onChange={(e) => setFormData(prev => ({ ...prev, transferReceived: Number(e.target.value) }))}
                  min={0}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أضف ملاحظات..."
              />
            </div>
            
            {/* Preview */}
            {preview && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-primary">معاينة الحساب</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>إجمالي الراتب:</span>
                  <span className="font-medium">{preview.grossSalary.toLocaleString()} ₪</span>
                  <span>السحوبات:</span>
                  <span className={`font-medium ${formData.withdrawals >= 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {formData.withdrawals.toLocaleString()} ₪
                  </span>
                  <span>صافي الراتب:</span>
                  <span className="font-bold">{preview.netSalary.toLocaleString()} ₪</span>
                  <span>المستلم:</span>
                  <span className="font-medium">-{(formData.cashReceived + formData.transferReceived).toLocaleString()} ₪</span>
                  <span className="font-semibold">المتبقي (مرحل):</span>
                  <span className={`font-bold ${preview.remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {preview.remaining.toLocaleString()} ₪
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEntry} disabled={!selectedEmployee}>
              {isEditing ? 'حفظ التغييرات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استيراد من Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              يجب أن يحتوي ملف Excel على الأعمدة التالية:
            </p>
            <div className="bg-muted rounded-lg p-4 text-sm font-mono">
              <ul className="space-y-1">
                <li>الرقم الوظيفي (مطلوب)</li>
                <li>الساعات / الأيام</li>
                <li>السحوبات</li>
                <li>الاستلام نقداً</li>
                <li>الاستلام تحويل</li>
                <li>ملاحظات</li>
              </ul>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="h-4 w-4 ml-2" />
              اختيار ملف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف سجل الموظف {selectedEntry?.employeeName} من الكشف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
