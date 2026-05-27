'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { listPayrollSheets, listPayrollEntriesForSheet } from '@/lib/api/payroll'
import { listEmployees } from '@/lib/api/employees'
import { listDepartments } from '@/lib/api/departments'
import { listBranches } from '@/lib/api/branches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  Search,
  Filter,
  X,
  FileSpreadsheet,
  DollarSign,
  Users,
  TrendingDown,
  Calculator,
  Building2,
  Calendar
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { PayrollEntry, EmployeeStatus } from '@/lib/types'

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

const statusLabels: Record<EmployeeStatus, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  terminated: 'مفصول'
}

export default function SalariesPage() {
  const [payrollSheets, setPayrollSheets] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all')
  
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  
  // Combine all entries from all sheets with sheet info
  const allEntries = useMemo(() => {
    const entries: (PayrollEntry & { month: number; year: number; sheetId: string; sheetStatus: string })[] = []
    
    payrollSheets.forEach(sheet => {
      (sheet.entries || []).forEach((entry: any) => {
        entries.push({
          ...entry,
          month: sheet.month,
          year: sheet.year,
          sheetId: sheet.id,
          sheetStatus: sheet.status
        })
      })
    })
    
    return entries
  }, [payrollSheets])
  
  // Filter entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      const emp = employees.find(e => e.employeeId === entry.employeeId)
      
      const matchesSearch = 
        entry.employeeName.includes(search) ||
        entry.employeeNumber.toLowerCase().includes(search.toLowerCase())
      
      const matchesMonth = monthFilter === 'all' || entry.month === parseInt(monthFilter)
      const matchesYear = yearFilter === 'all' || entry.year === parseInt(yearFilter)
      const matchesDepartment = departmentFilter === 'all' || entry.department === departments.find(d => d.id === departmentFilter)?.name
      const matchesBranch = branchFilter === 'all' || entry.branch === branches.find(b => b.id === branchFilter)?.name
      const matchesStatus = statusFilter === 'all' || emp?.status === statusFilter
      
      return matchesSearch && matchesMonth && matchesYear && matchesDepartment && matchesBranch && matchesStatus
    })
  }, [allEntries, search, monthFilter, yearFilter, departmentFilter, branchFilter, statusFilter, employees, departments, branches])
  
  const activeFiltersCount = [monthFilter, yearFilter, departmentFilter, branchFilter, statusFilter].filter(f => f !== 'all').length
  
  const clearFilters = () => {
    setMonthFilter('all')
    setYearFilter('all')
    setDepartmentFilter('all')
    setBranchFilter('all')
    setStatusFilter('all')
    setSearch('')
  }
  
  // Stats
  const totalGross = filteredEntries.reduce((sum, e) => sum + e.grossSalary, 0)
  const totalWithdrawals = filteredEntries.reduce((sum, e) => sum + e.withdrawals, 0)
  const totalNet = filteredEntries.reduce((sum, e) => sum + e.netSalary, 0)
  const totalRemaining = filteredEntries.reduce((sum, e) => sum + e.remaining, 0)
  
  const exportToExcel = () => {
    const headers = [
      'الشهر', 'السنة', 'الرقم الوظيفي', 'الموظف', 'القسم', 'الفرع',
      'ساعات/أيام', 'السعر', 'إجمالي الراتب', 'السحوبات', 'صافي الراتب',
      'نقداً', 'تحويل', 'المتبقي', 'ملاحظات'
    ]
    
    const rows = filteredEntries.map(entry => [
      monthNames[entry.month - 1],
      entry.year,
      entry.employeeNumber,
      entry.employeeName,
      entry.department,
      entry.branch,
      entry.hoursOrDays,
      entry.rate,
      entry.grossSalary,
      entry.withdrawals,
      entry.netSalary,
      entry.cashReceived,
      entry.transferReceived,
      entry.remaining,
      entry.notes
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'salaries.csv'
    link.click()
    
    toast.success('تم تصدير البيانات')
  }
  
  useEffect(() => {
    async function load() {
      const sheetsRes = await listPayrollSheets()
      if (!sheetsRes.error && sheetsRes.data) {
        const sheets = sheetsRes.data
        // load entries for each sheet
        const withEntries = await Promise.all(sheets.map(async (s: any) => {
          const entriesRes = await listPayrollEntriesForSheet(s.id)
          return { ...s, entries: entriesRes.error ? [] : (entriesRes.data || []) }
        }))
        setPayrollSheets(withEntries)
      }
      const emps = await listEmployees()
      if (!emps.error && emps.data) setEmployees(emps.data)
      const deps = await listDepartments()
      if (!deps.error && deps.data) setDepartments(deps.data)
      const brs = await listBranches()
      if (!brs.error && brs.data) setBranches(brs.data)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="الرواتب" 
        description="عرض وفلترة جميع الرواتب"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{filteredEntries.length}</p>
                  <p className="text-xs text-muted-foreground">سجل</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{totalGross.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الرواتب</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{totalWithdrawals.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">السحوبات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{totalNet.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">صافي الرواتب</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Calculator className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-600">{totalRemaining.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">المتبقي</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Search & Export */}
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
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>فلترة:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-36">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الشهر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأشهر</SelectItem>
                {monthNames.map((name, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="السنة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع السنوات</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-36">
                <Building2 className="h-4 w-4 ml-2" />
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
              <SelectTrigger className="w-36">
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
                <SelectValue placeholder="حالة الموظف" />
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
          
          <p className="text-sm text-muted-foreground">
            عرض {filteredEntries.length} من أصل {allEntries.length} سجل
          </p>
        </motion.div>
        
        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card overflow-x-auto"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right font-semibold whitespace-nowrap">الشهر</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">الرقم الوظيفي</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">الموظف</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">القسم</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">الفرع</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">ساعات/أيام</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">إجمالي الراتب</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">السحوبات</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">صافي الراتب</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">نقداً</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">تحويل</TableHead>
                <TableHead className="text-right font-semibold whitespace-nowrap">المتبقي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet className="h-8 w-8 opacity-50" />
                      <p>لا توجد بيانات</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries
                  .sort((a, b) => b.year - a.year || b.month - a.month)
                  .map((entry, index) => {
                    const emp = employees.find(e => e.employeeId === entry.employeeId)
                    return (
                      <motion.tr
                        key={`${entry.sheetId}-${entry.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <span className="whitespace-nowrap">{monthNames[entry.month - 1]} {entry.year}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{entry.employeeNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.employeeName}</p>
                            {emp && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  emp.status === 'active' ? 'text-emerald-600' :
                                  emp.status === 'suspended' ? 'text-amber-600' : 'text-red-600'
                                }`}
                              >
                                {statusLabels[emp.status as EmployeeStatus]}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{entry.department}</TableCell>
                        <TableCell>{entry.branch}</TableCell>
                        <TableCell>{entry.hoursOrDays}</TableCell>
                        <TableCell>{entry.grossSalary.toLocaleString()} ₪</TableCell>
                        <TableCell className="text-destructive">{entry.withdrawals.toLocaleString()} ₪</TableCell>
                        <TableCell className="font-semibold">{entry.netSalary.toLocaleString()} ₪</TableCell>
                        <TableCell>{entry.cashReceived.toLocaleString()} ₪</TableCell>
                        <TableCell>{entry.transferReceived.toLocaleString()} ₪</TableCell>
                        <TableCell className={entry.remaining > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
                          {entry.remaining.toLocaleString()} ₪
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
