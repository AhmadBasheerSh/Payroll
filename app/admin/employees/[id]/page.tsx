'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/admin/header'
import { getEmployeeById, deleteEmployee as apiDeleteEmployee, updateEmployee as apiUpdateEmployee } from '@/lib/api/employees'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowRight, 
  Pencil, 
  Trash2, 
  User, 
  Briefcase, 
  Wallet, 
  Activity,
  Phone,
  IdCard,
  Building2,
  Clock,
  DollarSign,
  Hash
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { EmployeeStatus } from '@/lib/types'

const statusLabels: Record<EmployeeStatus, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  terminated: 'مفصول'
}

const statusColors: Record<EmployeeStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
  suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
  terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
}

interface InfoItemProps {
  icon: React.ElementType
  label: string
  value: string | number
  className?: string
}

function InfoItem({ icon: Icon, label, value, className = '' }: InfoItemProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [employee, setEmployee] = useState<any | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<EmployeeStatus>('active')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('o2_current_user')
      if (raw) setCurrentUser(JSON.parse(raw))
    } catch (e) {
      setCurrentUser(null)
    }
  }, [])

  useEffect(() => {
    async function load() {
      const res = await getEmployeeById(id)
      if (!res.error && res.data) setEmployee(res.data)
    }
    load()
  }, [id])
  
  if (!employee) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="الملف الشخصي" description="تحميل..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }
  
  const handleDelete = async () => {
    const res = await apiDeleteEmployee(employee.id)
    if (res.error) {
      toast.error(res.error.message || 'Failed to delete employee')
      return
    }
    toast.success('تم حذف الموظف بنجاح')
    router.push('/admin/employees')
  }
  
  const handleStatusChange = async () => {
    const res = await apiUpdateEmployee(employee.id, { status: newStatus })
    if (res.error) {
      toast.error(res.error.message || 'Failed to update employee status')
      return
    }
    setEmployee((prev: any) => prev ? { ...prev, status: newStatus } : prev)
    toast.success(`تم تغيير حالة الموظف إلى ${statusLabels[newStatus]}`)
    setStatusDialogOpen(false)
  }
  
  const isAdmin = currentUser?.role === 'admin'
  
  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="الملف الشخصي" 
        description={employee.fullName}
      />
      
      <div className="p-6 space-y-6">
        {/* Back Button & Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/employees')}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للموظفين
          </Button>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setNewStatus(employee.status)
                  setStatusDialogOpen(true)
                }}
              >
                <Activity className="h-4 w-4 ml-2" />
                تغيير الحالة
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف الموظف
              </Button>
            </div>
          )}
        </motion.div>
        
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-bold">
                  {employee.fullName.charAt(0)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold">{employee.fullName}</h2>
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[employee.status as EmployeeStatus]} border font-medium`}
                    >
                      {statusLabels[employee.status as EmployeeStatus]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      {employee.employeeId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {employee.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {employee.workType === 'hourly' ? 'دوام ساعات' : 'دوام يومي'}
                    </span>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="text-2xl font-bold text-primary">
                    {employee.workType === 'hourly' 
                      ? `${employee.hourlyRate} ₪/ساعة`
                      : `${employee.dailyRate} ₪/يوم`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Tabs */}
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="basic" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">البيانات الأساسية</span>
              <span className="sm:hidden">أساسية</span>
            </TabsTrigger>
            <TabsTrigger value="job" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">البيانات الوظيفية</span>
              <span className="sm:hidden">وظيفية</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">بيانات المحفظة</span>
              <span className="sm:hidden">المحفظة</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">حالة الموظف</span>
              <span className="sm:hidden">الحالة</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Basic Data Tab */}
          <TabsContent value="basic">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    البيانات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem
                    icon={IdCard}
                    label="رقم الهوية"
                    value={employee.nationalId || 'غير محدد'}
                  />
                  <InfoItem
                    icon={User}
                    label="اسم الموظف"
                    value={employee.fullName}
                  />
                  <InfoItem
                    icon={Phone}
                    label="رقم الجوال"
                    value={employee.phoneNumber || 'غير محدد'}
                  />
                  <InfoItem
                    icon={IdCard}
                    label="كلمة السر"
                    value="••••••••"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Job Data Tab */}
          <TabsContent value="job">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    البيانات الوظيفية
                    {!isAdmin && (
                      <Badge variant="secondary" className="mr-2">
                        للقراءة فقط
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem
                    icon={Hash}
                    label="الرقم الوظيفي"
                    value={employee.employeeId}
                  />
                  <InfoItem
                    icon={Building2}
                    label="الفرع"
                    value={employee.branch}
                  />
                  <InfoItem
                    icon={Building2}
                    label="القسم"
                    value={employee.department}
                  />
                  <InfoItem
                    icon={Clock}
                    label="نوع الدوام"
                    value={employee.workType === 'hourly' ? 'ساعات' : 'يومية'}
                  />
                  <InfoItem
                    icon={DollarSign}
                    label={employee.workType === 'hourly' ? 'سعر الساعة' : 'سعر اليومية'}
                    value={employee.workType === 'hourly' 
                      ? `${employee.hourlyRate} ₪`
                      : `${employee.dailyRate} ₪`
                    }
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Wallet Data Tab */}
          <TabsContent value="wallet">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    بيانات المحفظة
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem
                    icon={Phone}
                    label="رقم الجوال"
                    value={employee.wallet?.phoneNumber || 'غير محدد'}
                  />
                  <InfoItem
                    icon={User}
                    label="اسم صاحب المحفظة"
                    value={employee.wallet?.ownerName || 'غير محدد'}
                  />
                  <InfoItem
                    icon={IdCard}
                    label="رقم هوية صاحب المحفظة"
                    value={employee.wallet?.ownerId || 'غير محدد'}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Status Tab */}
          <TabsContent value="status">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    حالة الموظف
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">الحالة الحالية:</span>
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[employee.status as EmployeeStatus]} border font-medium text-base px-4 py-1`}
                    >
                      {statusLabels[employee.status as EmployeeStatus]}
                    </Badge>
                  </div>
                  
                  {isAdmin && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-4">
                        يمكنك تغيير حالة الموظف من هنا. التغييرات ستؤثر على قدرة الموظف على تسجيل الدخول.
                      </p>
                      <Button
                        onClick={() => {
                          setNewStatus(employee.status)
                          setStatusDialogOpen(true)
                        }}
                      >
                        <Activity className="h-4 w-4 ml-2" />
                        تغيير الحالة
                      </Button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className={`p-4 rounded-lg border-2 ${employee.status === 'active' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-border'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="font-medium">نشط</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        الموظف يعمل بشكل طبيعي ويمكنه تسجيل الدخول
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${employee.status === 'suspended' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-border'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="font-medium">موقوف</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        الموظف موقوف مؤقتاً ولا يمكنه تسجيل الدخول
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${employee.status === 'terminated' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-border'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="font-medium">مفصول</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        الموظف مفصول نهائياً ولا يمكنه تسجيل الدخول
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الموظف {employee.fullName} نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Status Change Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تغيير حالة الموظف</AlertDialogTitle>
            <AlertDialogDescription>
              اختر الحالة الجديدة للموظف {employee.fullName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as EmployeeStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
                <SelectItem value="terminated">مفصول</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
