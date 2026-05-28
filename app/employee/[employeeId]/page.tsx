'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/theme-provider'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Employee, PaymentStatus, ReviewRequest, SalaryHistory } from '@/lib/types'
import {
  User,
  Building2,
  Wallet,
  Clock,
  Banknote,
  FileText,
  LogOut,
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle2,
  History,
  Pencil,
  Phone,
  CreditCard,
  MapPin,
  DollarSign,
  TrendingDown,
  Calculator,
  Calendar,
  MessageSquarePlus,
  Send,
  XCircle
} from 'lucide-react'

const statusLabels: Record<PaymentStatus, string> = {
  bank_transfer: 'تحويل بنكي',
  cash: 'كاش',
  processing: 'قيد المعالجة'
}

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

interface EmployeeSalaryRecord {
  id: string
  month: number
  year: number
  sheetStatus: 'approved' | 'closed'
  hoursOrDays: number
  rate: number
  grossSalary: number
  withdrawals: number
  netSalary: number
  cashReceived: number
  transferReceived: number
  remaining: number
  notes: string
  payrollSheetId: string
}

interface PayrollSheetOption {
  id: string
  month: number
  year: number
}

// const isFixedSalary = (record: EmployeeSalaryRecord) =>
//   record.sheetStatus === 'approved' || record.sheetStatus === 'closed'

export default function EmployeeDashboardPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params)
  const router = useRouter()
  const { currentUser, logout } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [salaryHistoryLatest, setSalaryHistoryLatest] = useState<SalaryHistory | null>(null)
  const [salaryRecords, setSalaryRecords] = useState<EmployeeSalaryRecord[]>([])
  const [myReviewRequests, setMyReviewRequests] = useState<ReviewRequest[]>([])
  const [availablePayrollSheets, setAvailablePayrollSheets] = useState<PayrollSheetOption[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [reviewFormData, setReviewFormData] = useState({ payrollSheetId: '', reason: '' })
  const [editFormData, setEditFormData] = useState({
    phoneNumber: '',
    walletPhoneNumber: '',
    walletOwnerName: '',
    walletOwnerId: '',
    password: '',
    confirmPassword: ''
  })

  const routeEmployeeId = String(employeeId ?? '').trim()
  const currentEmployeeId = String(currentUser?.employeeId ?? '').trim()
  const lastMonthSalary = salaryRecords[0] ?? null
  const showCashAlert = lastMonthSalary && lastMonthSalary.remaining > 0

  const loadDashboard = async () => {
    setLoading(true)

    const employeeResponse = await supabase
      .from('employees')
      .select(`id, national_id, password, full_name, employee_id, phone_number, branch_id, department_id, work_type, hourly_rate, daily_rate, status, role, base_salary, payment_status, cash_days, wallet_phone_number, wallet_owner_name, wallet_owner_id, created_at, updated_at, branch:branches(name), department:departments(name)`)
      .eq('employee_id', routeEmployeeId)
      .single()

    if (employeeResponse.error || !employeeResponse.data) {
      toast.error('تعذر تحميل بيانات الموظف')
      router.push('/')
      return
    }

    const rawEmployee = employeeResponse.data
    const branch = Array.isArray(rawEmployee.branch) ? rawEmployee.branch[0] : rawEmployee.branch
    const department = Array.isArray(rawEmployee.department) ? rawEmployee.department[0] : rawEmployee.department

    const mappedEmployee: Employee = {
      id: rawEmployee.id,
      nationalId: rawEmployee.national_id || '',
      fullName: rawEmployee.full_name,
      phoneNumber: rawEmployee.phone_number || '',
      password: rawEmployee.password || '',
      employeeId: rawEmployee.employee_id,
      branchId: rawEmployee.branch_id || '',
      branch: branch?.name || '',
      departmentId: rawEmployee.department_id || '',
      department: department?.name || '',
      workType: rawEmployee.work_type,
      hourlyRate: rawEmployee.hourly_rate ?? 0,
      dailyRate: rawEmployee.daily_rate ?? 0,
      wallet: {
        phoneNumber: rawEmployee.wallet_phone_number || '',
        ownerName: rawEmployee.wallet_owner_name || '',
        ownerId: rawEmployee.wallet_owner_id || ''
      },
      status: rawEmployee.status,
      role: rawEmployee.role,
      baseSalary: rawEmployee.base_salary ?? 0,
      workHours: 0,
      withdrawals: 0,
      remaining: 0,
      paymentStatus: rawEmployee.payment_status ?? 'processing',
      cashDays: rawEmployee.cash_days ?? 0,
      createdAt: rawEmployee.created_at ? new Date(rawEmployee.created_at) : new Date(),
      updatedAt: rawEmployee.updated_at ? new Date(rawEmployee.updated_at) : new Date()
    }

    setEmployee(mappedEmployee)
    setEditFormData({
      phoneNumber: mappedEmployee.phoneNumber,
      walletPhoneNumber: mappedEmployee.wallet.phoneNumber,
      walletOwnerName: mappedEmployee.wallet.ownerName,
      walletOwnerId: mappedEmployee.wallet.ownerId,
      password: '',
      confirmPassword: ''
    })

    const salaryHistoryResponse = await supabase
      .from('salary_history')
      .select('*')
      .eq('employee_id', mappedEmployee.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)

    if (salaryHistoryResponse.data && salaryHistoryResponse.data.length > 0) {
      const latest = salaryHistoryResponse.data[0]
      setSalaryHistoryLatest({
        id: latest.id,
        employeeId: latest.employee_id,
        month: latest.month,
        year: latest.year,
        baseSalary: latest.base_salary,
        workHours: latest.work_hours,
        withdrawals: latest.withdrawals,
        remaining: latest.remaining,
        paymentStatus: latest.payment_status,
        paidAt: latest.paid_at ? new Date(latest.paid_at) : null,
        createdAt: new Date(latest.created_at)
      })
    } else {
      setSalaryHistoryLatest(null)
    }

    const payrollEntriesResponse = await supabase
      .from('payroll_entries')
      .select(`id, hours_or_days, rate, gross_salary, withdrawals, net_salary, cash_received, transfer_received, remaining, notes, payroll_sheet:payroll_sheets(id, month, year, status)`)
      .eq('employee_id', mappedEmployee.id)

    if (payrollEntriesResponse.error) {
      toast.error('تعذر تحميل سجل الرواتب')
      setLoading(false)
      return
    }

    const records: EmployeeSalaryRecord[] = (payrollEntriesResponse.data ?? [])
      .filter((entry: any) => entry.payroll_sheet)
      .map((entry: any) => ({
        id: entry.id,
        month: entry.payroll_sheet.month,
        year: entry.payroll_sheet.year,
        sheetStatus: entry.payroll_sheet.status,
        hoursOrDays: entry.hours_or_days,
        rate: entry.rate,
        grossSalary: entry.gross_salary,
        withdrawals: entry.withdrawals,
        netSalary: entry.net_salary,
        cashReceived: entry.cash_received,
        transferReceived: entry.transfer_received,
        remaining: entry.remaining,
        notes: entry.notes ?? '',
        payrollSheetId: entry.payroll_sheet.id
      }))
      .sort((a, b) => b.year - a.year || b.month - a.month)

    setSalaryRecords(records)
    setAvailablePayrollSheets(records
      .filter(record => record.sheetStatus === 'approved' || record.sheetStatus === 'closed')
      .reduce<PayrollSheetOption[]>((acc, record) => {
        if (!acc.some(sheet => sheet.id === record.payrollSheetId)) {
          acc.push({ id: record.payrollSheetId, month: record.month, year: record.year })
        }
        return acc
      }, [])
    )

    const reviewRequestsResponse = await supabase
      .from('review_requests')
      .select('*')
      .eq('employee_id', mappedEmployee.id)
      .order('created_at', { ascending: false })

    if (reviewRequestsResponse.error) {
      toast.error('تعذر تحميل طلبات المراجعة')
      setLoading(false)
      return
    }

    setMyReviewRequests((reviewRequestsResponse.data ?? []).map((request: any) => ({
      id: request.id,
      employeeId: request.employee_id,
      employeeName: mappedEmployee.fullName,
      employeeNumber: mappedEmployee.employeeId,
      payrollSheetId: request.payroll_sheet_id,
      month: request.month,
      year: request.year,
      reason: request.reason,
      status: request.status,
      adminResponse: request.admin_response,
      createdAt: new Date(request.created_at),
      updatedAt: new Date(request.updated_at)
    })))

    setLoading(false)
  }

  useEffect(() => {
    const hasHydrated = useAppStore.persist?.hasHydrated?.() ?? true
    setIsHydrated(hasHydrated)

    const unsubHydrate = useAppStore.persist?.onHydrate?.(() => setIsHydrated(false))
    const unsubFinishHydration = useAppStore.persist?.onFinishHydration?.(() => setIsHydrated(true))

    return () => {
      unsubHydrate?.()
      unsubFinishHydration?.()
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    if (!currentUser || currentEmployeeId !== routeEmployeeId) {
      router.push('/')
      return
    }

    loadDashboard()
  }, [currentUser, currentEmployeeId, routeEmployeeId, router, isHydrated])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

 const handleEditProfile = async () => {
    if (!employee) return

    const newPassword = editFormData.password.trim()
    
    // التحقق من تطابق كلمة المرور إذا تم إدخالها
    if (newPassword && newPassword !== editFormData.confirmPassword.trim()) {
      toast.error('كلمة المرور وتأكيدها غير متطابقين')
      return
    }

    const updates: Record<string, string> = {
      phone_number: editFormData.phoneNumber,
      wallet_phone_number: editFormData.walletPhoneNumber,
      wallet_owner_name: editFormData.walletOwnerName,
      wallet_owner_id: editFormData.walletOwnerId
    }

    // إضافة كلمة المرور الجديدة إذا تم إدخالها
    if (newPassword) {
      updates.password = newPassword
    }

    const { error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employee.id)

    if (error) {
      toast.error('فشل تحديث البيانات')
      return
    }

    toast.success('تم تحديث البيانات بنجاح')
    setEditDialogOpen(false)
    setEditFormData({
      ...editFormData,
      password: '',
      confirmPassword: ''
    })
    loadDashboard()
  }

  const exportPDF = (record = lastMonthSalary) => {
    if (!employee || !record) return

    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('O2 Payroll System', 105, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text(`Salary Slip - ${monthNames[record.month - 1]} ${record.year}`, 105, 30, { align: 'center' })
    doc.setFontSize(12)

    const startY = 50
    doc.text(`Employee ID: ${employee.employeeId}`, 20, startY)
    doc.text(`Name: ${employee.fullName}`, 20, startY + 10)
    doc.text(`Department: ${employee.department}`, 20, startY + 20)
    doc.text(`Branch: ${employee.branch}`, 20, startY + 30)

    const tableData = [
      ['Hours/Days', `${record.hoursOrDays}`],
      ['Rate', `${record.rate} ILS`],
      ['Gross Salary', `${record.grossSalary.toLocaleString()} ILS`],
      ['Withdrawals', `-${record.withdrawals.toLocaleString()} ILS`],
      ['Net Salary', `${record.netSalary.toLocaleString()} ILS`],
      ['Cash Received', `${record.cashReceived.toLocaleString()} ILS`],
      ['Transfer Received', `${record.transferReceived.toLocaleString()} ILS`],
      ['Remaining', `${record.remaining.toLocaleString()} ILS`]
    ]

    // @ts-expect-error - jspdf-autotable types
    doc.autoTable({
      startY: startY + 45,
      head: [['Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    })

    doc.save(`salary-slip-${employee.employeeId}-${record.month}-${record.year}.pdf`)
    toast.success('تم تحميل كشف الراتب')
  }

  const handleSubmitReviewRequest = async () => {
    if (!employee || !reviewFormData.payrollSheetId || !reviewFormData.reason.trim()) {
      toast.error('يرجى تعبئة جميع الحقول')
      return
    }

    const selectedSheet = availablePayrollSheets.find(sheet => sheet.id === reviewFormData.payrollSheetId)
    if (!selectedSheet) {
      toast.error('يرجى اختيار كشف راتب صحيح')
      return
    }

    const hasExistingRequest = myReviewRequests.some(request =>
      request.payrollSheetId === selectedSheet.id && request.status !== 'rejected'
    )

    if (hasExistingRequest) {
      toast.error('يوجد طلب مراجعة قائم لهذا الكشف')
      return
    }

    const { error } = await supabase
      .from('review_requests')
      .insert({
        employee_id: employee.id,
        payroll_sheet_id: selectedSheet.id,
        month: selectedSheet.month,
        year: selectedSheet.year,
        reason: reviewFormData.reason.trim(),
        status: 'pending',
        admin_response: null
      })

    if (error) {
      toast.error('فشل ارسال طلب المراجعة')
      return
    }

    toast.success('تم ارسال طلب المراجعة بنجاح')
    setReviewDialogOpen(false)
    setReviewFormData({ payrollSheetId: '', reason: '' })
    loadDashboard()
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جارٍ التحقق...</div>
      </div>
    )
  }

  if (!currentUser || currentEmployeeId !== routeEmployeeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جارٍ التحقق...</div>
      </div>
    )
  }

  if (loading || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              O2
            </div>
            <div>
              <h1 className="font-bold">O2 Payroll</h1>
              <p className="text-xs text-muted-foreground">لوحة الموظف</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-5 w-5 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-1">مرحبا، {employee.fullName}</h2>
          <p className="text-muted-foreground">اليك ملخص بياناتك ورواتبك</p>
        </motion.div>

        {showCashAlert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 rounded-2xl border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  يوجد مبلغ متبقي (مرحل)
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  المبلغ المتبقي: {lastMonthSalary?.remaining.toLocaleString()} شيكل
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  البيانات الاساسية
                </CardTitle>
                <CardDescription>معلومات الموظف والوظيفة</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 ml-2" />
                تعديل البيانات
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl font-bold">
                    {employee.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-xl">{employee.fullName}</p>
                    <p className="text-sm text-muted-foreground font-mono">{employee.employeeId}</p>
                    <Badge variant="secondary" className="mt-1">
                      {employee.status === 'active' ? 'نشط' : employee.status === 'suspended' ? 'موقوف' : 'منتهي'}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">الرقم الوظيفي</span>
                    </div>
                    <p className="font-semibold font-mono">{employee.employeeId}</p>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">القسم</span>
                    </div>
                    <p className="font-semibold">{employee.department}</p>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">الفرع</span>
                    </div>
                    <p className="font-semibold">{employee.branch}</p>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">نوع الدوام</span>
                    </div>
                    <p className="font-semibold">{employee.workType === 'hourly' ? 'بالساعة' : 'يومي'}</p>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">سعر الساعة</span>
                    </div>
                    <p className="font-semibold text-ellipsis">{employee.hourlyRate} شيكل</p>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">الهاتف</span>
                    </div>
                    <p className="font-semibold text-sm">{employee.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {lastMonthSalary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  راتب شهر {monthNames[lastMonthSalary.month - 1]} {lastMonthSalary.year}
                </h3>
                <Badge variant="outline" className={lastMonthSalary.sheetStatus === 'closed'
                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}>
                  {lastMonthSalary.sheetStatus === 'closed' ? 'مغلق' : 'معتمد'}
                </Badge>
              </div>
              <Button onClick={() => exportPDF(lastMonthSalary)} variant="outline" size="sm">
                <FileText className="h-4 w-4 ml-2" />
                تحميل كشف الراتب
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <Card className="border-primary/20">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">ساعات/ايام</p>
                  <p className="text-xl font-bold">{lastMonthSalary.hoursOrDays}</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">السعر</p>
                  <p className="text-xl font-bold text-blue-600">{lastMonthSalary.rate} ش</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Banknote className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">اجمالي الراتب</p>
                  <p className="text-xl font-bold text-emerald-600">{lastMonthSalary.grossSalary.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">السحوبات</p>
                  <p className="text-xl font-bold text-destructive">-{lastMonthSalary.withdrawals.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">صافي الراتب</p>
                  <p className="text-xl font-bold text-primary">{lastMonthSalary.netSalary.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Banknote className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">نقدا</p>
                  <p className="text-xl font-bold text-amber-600">{lastMonthSalary.cashReceived.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className={lastMonthSalary.remaining > 0 ? 'border-amber-500' : 'border-emerald-500'}>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">المتبقي</p>
                  <p className={`text-xl font-bold ${lastMonthSalary.remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {lastMonthSalary.remaining.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                جدول الرواتب المثبتة
              </CardTitle>
              <CardDescription>جميع الرواتب المعتمدة والمغلقة</CardDescription>
            </CardHeader>
            <CardContent>
              {salaryRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد رواتب مثبتة حتى الان</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-right font-semibold">الشهر</TableHead>
                        <TableHead className="text-right font-semibold">السنة</TableHead>
                        <TableHead className="text-right font-semibold">الحالة</TableHead>
                        <TableHead className="text-right font-semibold">ساعات/ايام</TableHead>
                        <TableHead className="text-right font-semibold">السعر</TableHead>
                        <TableHead className="text-right font-semibold">اجمالي الراتب</TableHead>
                        <TableHead className="text-right font-semibold">السحوبات</TableHead>
                        <TableHead className="text-right font-semibold">صافي الراتب</TableHead>
                        <TableHead className="text-right font-semibold">نقدا</TableHead>
                        <TableHead className="text-right font-semibold">تحويل</TableHead>
                        <TableHead className="text-right font-semibold">المتبقي</TableHead>
                        <TableHead className="text-right font-semibold">ملاحظة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryRecords.map((record, index) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{monthNames[record.month - 1]}</TableCell>
                          <TableCell>{record.year}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={record.sheetStatus === 'closed'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}>
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                              {record.sheetStatus === 'closed' ? 'مغلق' : 'معتمد'}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.hoursOrDays}</TableCell>
                          <TableCell>{record.rate} ش</TableCell>
                          <TableCell>{record.grossSalary.toLocaleString()} ش</TableCell>
                          <TableCell className="text-destructive">-{record.withdrawals.toLocaleString()} ش</TableCell>
                          <TableCell className="font-semibold text-primary">{record.netSalary.toLocaleString()} ش</TableCell>
                          <TableCell>{record.cashReceived.toLocaleString()} ش</TableCell>
                          <TableCell>{record.transferReceived.toLocaleString()} ش</TableCell>
                          <TableCell className={record.remaining > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
                            {record.remaining.toLocaleString()} ش
                          </TableCell>
                          <TableCell className="max-w-[240px] whitespace-normal break-words text-muted-foreground">
                            {record.notes?.trim() || '—'}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5 text-primary" />
                  طلبات مراجعة الراتب
                </CardTitle>
                <CardDescription>ارسل طلب مراجعة على الراتب وتابع حالته</CardDescription>
              </div>
              <Button onClick={() => setReviewDialogOpen(true)} size="sm">
                <Send className="h-4 w-4 ml-2" />
                طلب مراجعة جديد
              </Button>
            </CardHeader>
            <CardContent>
              {myReviewRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد طلبات مراجعة</p>
                  <p className="text-sm mt-1">اضغط على زر طلب مراجعة جديد لارسال طلب</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReviewRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              راتب شهر {monthNames[request.month - 1]} {request.year}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                request.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : request.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }
                            >
                              {request.status === 'pending' && <Clock className="h-3 w-3 ml-1" />}
                              {request.status === 'approved' && <CheckCircle2 className="h-3 w-3 ml-1" />}
                              {request.status === 'rejected' && <XCircle className="h-3 w-3 ml-1" />}
                              {request.status === 'pending' ? 'قيد المراجعة' : request.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>سبب المراجعة:</strong> {request.reason}
                          </p>
                          {request.adminResponse && (
                            <div className="mt-2 p-3 rounded-lg bg-muted/50">
                              <p className="text-sm font-semibold mb-1">رد الادارة:</p>
                              <p className="text-sm">{request.adminResponse}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            تاريخ الارسال: {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          2024 O2 Restaurant. جميع الحقوق محفوظة
        </div>
      </footer>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              تعديل البيانات الشخصية
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">رقم الهاتف</Label>
              <Input
                id="phoneNumber"
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                placeholder="05xxxxxxxx"
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3">كلمة المرور</p>
              <div className="space-y-3 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة مرور جديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="اتركها فارغة بدون تغيير"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={editFormData.confirmPassword}
                    onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                  />
                </div>
              </div>
              <p className="text-sm font-semibold mb-3">بيانات المحفظة</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="walletPhone">رقم المحفظة</Label>
                  <Input
                    id="walletPhone"
                    value={editFormData.walletPhoneNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, walletPhoneNumber: e.target.value })}
                    placeholder="05xxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletOwner">اسم صاحب المحفظة</Label>
                  <Input
                    id="walletOwner"
                    value={editFormData.walletOwnerName}
                    onChange={(e) => setEditFormData({ ...editFormData, walletOwnerName: e.target.value })}
                    placeholder="الاسم الكامل"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletId">رقم هوية صاحب المحفظة</Label>
                  <Input
                    id="walletId"
                    value={editFormData.walletOwnerId}
                    onChange={(e) => setEditFormData({ ...editFormData, walletOwnerId: e.target.value })}
                    placeholder="رقم الهوية"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              الغاء
            </Button>
            <Button onClick={handleEditProfile}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              طلب مراجعة على الراتب
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payrollSheet">اختر كشف الراتب</Label>
              <select
                id="payrollSheet"
                value={reviewFormData.payrollSheetId}
                onChange={(e) => setReviewFormData({ ...reviewFormData, payrollSheetId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">اختر الشهر...</option>
                {availablePayrollSheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.id}>
                    {monthNames[sheet.month - 1]} {sheet.year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">سبب المراجعة</Label>
              <Textarea
                id="reason"
                value={reviewFormData.reason}
                onChange={(e) => setReviewFormData({ ...reviewFormData, reason: e.target.value })}
                placeholder="اكتب سبب طلب المراجعة..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              الغاء
            </Button>
            <Button onClick={handleSubmitReviewRequest}>
              <Send className="h-4 w-4 ml-2" />
              ارسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
