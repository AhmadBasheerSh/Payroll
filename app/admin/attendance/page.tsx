'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { listEmployees } from '@/lib/api/employees'
import { listDepartments } from '@/lib/api/departments'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Clock, Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock attendance data
const mockAttendance = [
  { employeeId: 'E20003', date: '2024-03-15', checkIn: '08:00', checkOut: '17:00', hours: 9, status: 'present' },
  { employeeId: 'E20004', date: '2024-03-15', checkIn: '08:30', checkOut: '17:30', hours: 9, status: 'late' },
  { employeeId: 'E20005', date: '2024-03-15', checkIn: '08:00', checkOut: '16:00', hours: 8, status: 'present' },
  { employeeId: 'E20006', date: '2024-03-15', checkIn: null, checkOut: null, hours: 0, status: 'absent' },
  { employeeId: 'E20007', date: '2024-03-15', checkIn: '07:45', checkOut: '18:00', hours: 10.25, status: 'present' },
  { employeeId: 'E20008', date: '2024-03-15', checkIn: '09:00', checkOut: '17:00', hours: 8, status: 'late' },
  { employeeId: 'E20009', date: '2024-03-15', checkIn: '08:00', checkOut: '17:30', hours: 9.5, status: 'present' },
  { employeeId: 'E20010', date: '2024-03-15', checkIn: '08:15', checkOut: '17:15', hours: 9, status: 'present' },
]

const statusConfig = {
  present: { label: 'حاضر', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  late: { label: 'متأخر', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle },
  absent: { label: 'غائب', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const emps = await listEmployees()
      if (!emps.error && emps.data) {
        const mapped = (emps.data as any[]).map(e => ({
          employeeId: e.employee_id,
          fullName: e.full_name,
          department: e.departments?.name || '',
          departmentId: e.department_id
        }))
        setEmployees(mapped)
      }
      const deps = await listDepartments()
      if (!deps.error && deps.data) setDepartments(deps.data)
    }
    load()
  }, [])

  // Enrich attendance with employee data
  const enrichedAttendance = mockAttendance.map(att => {
    const employee = employees.find(e => e.employeeId === att.employeeId)
    return {
      ...att,
      fullName: employee?.fullName || 'غير معروف',
      department: employee?.department || 'غير محدد',
      departmentId: employee?.departmentId || '',
    }
  })

  // Filter
  const filteredAttendance = enrichedAttendance.filter(att => {
    const matchesSearch = att.fullName.includes(search) || att.employeeId.toLowerCase().includes(search.toLowerCase())
    const matchesDept = departmentFilter === 'all' || att.departmentId === departmentFilter
    const matchesStatus = statusFilter === 'all' || att.status === statusFilter
    return matchesSearch && matchesDept && matchesStatus
  })

  // Stats
  const stats = {
    total: enrichedAttendance.length,
    present: enrichedAttendance.filter(a => a.status === 'present').length,
    late: enrichedAttendance.filter(a => a.status === 'late').length,
    absent: enrichedAttendance.filter(a => a.status === 'absent').length,
    totalHours: enrichedAttendance.reduce((sum, a) => sum + a.hours, 0),
  }

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="سجل الحضور" 
        description="متابعة حضور وانصراف الموظفين"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">الحاضرون</p>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">المتأخرون</p>
            <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">الغائبون</p>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">إجمالي الساعات</p>
            <p className="text-2xl font-bold text-primary">{stats.totalHours.toFixed(1)}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الرقم الوظيفي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="present">حاضر</SelectItem>
              <SelectItem value="late">متأخر</SelectItem>
              <SelectItem value="absent">غائب</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Attendance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">الرقم الوظيفي</TableHead>
                <TableHead className="text-right font-semibold">الاسم</TableHead>
                <TableHead className="text-right font-semibold">القسم</TableHead>
                <TableHead className="text-right font-semibold">وقت الحضور</TableHead>
                <TableHead className="text-right font-semibold">وقت الانصراف</TableHead>
                <TableHead className="text-right font-semibold">ساعات العمل</TableHead>
                <TableHead className="text-right font-semibold">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    لا توجد بيانات حضور
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendance.map((att, index) => {
                  const config = statusConfig[att.status as keyof typeof statusConfig]
                  const Icon = config.icon
                  
                  return (
                    <motion.tr
                      key={`${att.employeeId}-${att.date}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-mono">{att.employeeId}</TableCell>
                      <TableCell className="font-medium">{att.fullName}</TableCell>
                      <TableCell>{att.department}</TableCell>
                      <TableCell>{att.checkIn || '-'}</TableCell>
                      <TableCell>{att.checkOut || '-'}</TableCell>
                      <TableCell>{att.hours > 0 ? `${att.hours} ساعة` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${config.color} gap-1`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  )
                })
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </div>
  )
}
