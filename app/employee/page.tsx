'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  X,
  XCircle
} from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import type { PaymentStatus, Employee, PayrollSheet, PayrollEntry, ReviewRequest } from '@/lib/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { toast } from 'sonner'

const statusLabels: Record<PaymentStatus, string> = {
  bank_transfer: 'تحويل بنكي',
  cash: 'كاش',
  processing: 'قيد المعالجة'
}

const statusColors: Record<PaymentStatus, string> = {
  bank_transfer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cash: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
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
}

export default function EmployeeDashboard() {
  const router = useRouter()
  const { currentUser, employees, payrollSheets, reviewRequests, logout, updateEmployee, addReviewRequest } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [salaryRecords, setSalaryRecords] = useState<EmployeeSalaryRecord[]>([])
  const [lastMonthSalary, setLastMonthSalary] = useState<EmployeeSalaryRecord | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [myReviewRequests, setMyReviewRequests] = useState<ReviewRequest[]>([])
  const [reviewFormData, setReviewFormData] = useState({
    payrollSheetId: '',
    reason: ''
  })
  const [editFormData, setEditFormData] = useState({
    phoneNumber: '',
    walletPhoneNumber: '',
    walletOwnerName: '',
    walletOwnerId: ''
  })

  useEffect(() => {
    if (!currentUser) {
      router.push('/')
      return
    }

    const emp = employees.find(e => e.employeeId === currentUser.employeeId)
    if (emp) {
      setEmployee(emp)
      setEditFormData({
        phoneNumber: emp.phoneNumber,
        walletPhoneNumber: emp.wallet.phoneNumber,
        walletOwnerName: emp.wallet.ownerName,
        walletOwnerId: emp.wallet.ownerId
      })

      // Get salary records from approved/closed payroll sheets
      const records: EmployeeSalaryRecord[] = []
      payrollSheets
        .filter(sheet => sheet.status === 'approved' || sheet.status === 'closed')
        .forEach(sheet => {
          const entry = sheet.entries.find(e => e.employeeId === emp.employeeId)
          if (entry) {
            records.push({
              id: entry.id,
              month: sheet.month,
              year: sheet.year,
              sheetStatus: sheet.status as 'approved' | 'closed',
              hoursOrDays: entry.hoursOrDays,
              rate: entry.rate,
              grossSalary: entry.grossSalary,
              withdrawals: entry.withdrawals,
              netSalary: entry.netSalary,
              cashReceived: entry.cashReceived,
              transferReceived: entry.transferReceived,
              remaining: entry.remaining,
              notes: entry.notes ?? ''
            })
          }
        })

      // Sort by date descending
      records.sort((a, b) => b.year - a.year || b.month - a.month)
      setSalaryRecords(records)

      // Get last month salary
      if (records.length > 0) {
        setLastMonthSalary(records[0])
      }

      // Get employee review requests
      const empRequests = reviewRequests.filter(r => r.employeeId === emp.employeeId)
      setMyReviewRequests(empRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    }
  }, [currentUser, employees, payrollSheets, reviewRequests, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleEditProfile = () => {
    if (!employee) return

    updateEmployee(employee.id, {
      phoneNumber: editFormData.phoneNumber,
      wallet: {
        phoneNumber: editFormData.walletPhoneNumber,
        ownerName: editFormData.walletOwnerName,
        ownerId: editFormData.walletOwnerId
      }
    })

    toast.success('تم تحديث البيانات بنجاح')
    setEditDialogOpen(false)
  }

  const handleSubmitReviewRequest = () => {
    if (!employee || !reviewFormData.payrollSheetId || !reviewFormData.reason.trim()) {
      toast.error('يرجى تعبئة جميع الحقول')
      return
    }

    const sheet = payrollSheets.find(s => s.id === reviewFormData.payrollSheetId)
    if (!sheet) return

    addReviewRequest({
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      employeeNumber: employee.employeeId,
      payrollSheetId: reviewFormData.payrollSheetId,
      month: sheet.month,
      year: sheet.year,
      reason: reviewFormData.reason.trim()
    })

    toast.success('تم ارسال طلب المراجعة بنجاح')
    setReviewDialogOpen(false)
    setReviewFormData({ payrollSheetId: '', reason: '' })
  }

  const availablePayrollSheets = payrollSheets
    .filter(
      s => (s.status === 'approved' || s.status === 'closed') &&
        s.entries.some(e => e.employeeId === employee?.employeeId)
    )
    .sort((a, b) => b.year - a.year || b.month - a.month)

  const exportPDF = () => {
    if (!employee || !lastMonthSalary) return

    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('O2 Payroll System', 105, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text(`Salary Slip - ${monthNames[lastMonthSalary.month - 1]} ${lastMonthSalary.year}`, 105, 30, { align: 'center' })

    doc.setFontSize(12)
    const startY = 50
    doc.text(`Employee ID: ${employee.employeeId}`, 20, startY)
    doc.text(`Name: ${employee.fullName}`, 20, startY + 10)
    doc.text(`Department: ${employee.department}`, 20, startY + 20)
    doc.text(`Branch: ${employee.branch}`, 20, startY + 30)

    const tableData = [
      ['Hours/Days', `${lastMonthSalary.hoursOrDays}`],
      ['Rate', `${lastMonthSalary.rate} ILS`],
      ['Gross Salary', `${lastMonthSalary.grossSalary.toLocaleString()} ILS`],
      ['Withdrawals', `-${lastMonthSalary.withdrawals.toLocaleString()} ILS`],
      ['Net Salary', `${lastMonthSalary.netSalary.toLocaleString()} ILS`],
      ['Cash Received', `${lastMonthSalary.cashReceived.toLocaleString()} ILS`],
      ['Transfer Received', `${lastMonthSalary.transferReceived.toLocaleString()} ILS`],
      ['Remaining', `${lastMonthSalary.remaining.toLocaleString()} ILS`],
    ]

    // @ts-expect-error - jspdf-autotable types
    doc.autoTable({
      startY: startY + 45,
      head: [['Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    })

    doc.save(`salary-slip-${employee.employeeId}-${lastMonthSalary.month}-${lastMonthSalary.year}.pdf`)
    toast.success('تم تحميل كشف الراتب')
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    )
  }

  const showCashAlert = lastMonthSalary && lastMonthSalary.remaining > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
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
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-1">مرحبا، {employee.fullName}</h2>
          <p className="text-muted-foreground">اليك ملخص بياناتك ورواتبك</p>
        </motion.div>

        {/* Cash Alert */}
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

        {/* Employee Profile Card */}
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
                {/* Avatar & Name */}
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

                {/* Info Grid */}
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
                      <span className="text-xs text-muted-foreground">
                        {employee.workType === 'hourly' ? 'سعر الساعة' : 'سعر اليوم'}
                      </span>
                    </div>
                    <p className="font-semibold">
                      {employee.workType === 'hourly' ? employee.hourlyRate : employee.dailyRate} شيكل
                    </p>
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

        {/* Last Month Salary Cards */}
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
              <Button onClick={exportPDF} variant="outline" size="sm">
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

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">تحويل</p>
                  <p className="text-xl font-bold text-indigo-600">{lastMonthSalary.transferReceived.toLocaleString()}</p>
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

        {/* Salary History Table */}
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

        {/* Review Requests Section */}
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

      {/* Footer */}
      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          2024 O2 Restaurant. جميع الحقوق محفوظة
        </div>
      </footer>

      {/* Edit Profile Dialog */}
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

      {/* Review Request Dialog */}
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
              <Label htmlFor="payrollSheet">اختر شهر الراتب للمراجعة</Label>
              <select
                id="payrollSheet"
                value={reviewFormData.payrollSheetId}
                onChange={(e) => setReviewFormData({ ...reviewFormData, payrollSheetId: e.target.value })}
                disabled={availablePayrollSheets.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">
                  {availablePayrollSheets.length === 0 ? 'لا يوجد أشهر رواتب متاحة' : 'اختر الشهر...'}
                </option>
                {availablePayrollSheets.map((sheet) => {
                  const entry = sheet.entries.find(e => e.employeeId === employee?.employeeId)
                  return (
                    <option key={sheet.id} value={sheet.id}>
                      {monthNames[sheet.month - 1]} {sheet.year} - {entry?.grossSalary.toLocaleString()} ش
                    </option>
                  )
                })}
              </select>
              <p className="text-xs text-muted-foreground">
                يتم عرض الأشهر التي لديك فيها راتب فقط.
              </p>
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
            <Button onClick={handleSubmitReviewRequest} disabled={availablePayrollSheets.length === 0}>
              <Send className="h-4 w-4 ml-2" />
              ارسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
