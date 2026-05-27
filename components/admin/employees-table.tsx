'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2, 
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User
} from 'lucide-react'
import type { Employee, EmployeeStatus, WorkType } from '@/lib/types'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EmployeesTableProps {
  employees: Employee[]
  onView?: (employee: Employee) => void
  onEdit?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
  onExportPDF?: (employee: Employee) => void
}

const statusLabels: Record<EmployeeStatus, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  terminated: 'مفصول'
}

const statusColors: Record<EmployeeStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
}

const workTypeLabels: Record<WorkType, string> = {
  hourly: 'ساعات',
  daily: 'يومية'
}

export function EmployeesTable({ 
  employees, 
  onView, 
  onEdit, 
  onDelete,
  onExportPDF 
}: EmployeesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Pagination calculations
  const totalPages = Math.ceil(employees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedEmployees = employees.slice(startIndex, endIndex)
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-right font-semibold">الرقم الوظيفي</TableHead>
              <TableHead className="text-right font-semibold">الاسم</TableHead>
              <TableHead className="text-right font-semibold">القسم</TableHead>
              <TableHead className="text-right font-semibold">الفرع</TableHead>
              <TableHead className="text-right font-semibold">نوع الدوام</TableHead>
              <TableHead className="text-right font-semibold">السعر</TableHead>
              <TableHead className="text-right font-semibold">الحالة</TableHead>
              <TableHead className="text-right font-semibold">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 opacity-50" />
                    <p>لا يوجد موظفين</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee, index) => (
                <motion.tr
                  key={employee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-mono text-sm">{employee.employeeId}</TableCell>
                  <TableCell>
                    <Link 
                      href={`/admin/employees/${employee.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {employee.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.branch}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {workTypeLabels[employee.workType]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {employee.workType === 'hourly' 
                      ? `${employee.hourlyRate} ₪/ساعة`
                      : `${employee.dailyRate} ₪/يوم`
                    }
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[employee.status]} border font-medium`}
                    >
                      {statusLabels[employee.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/employees/${employee.id}`} className="flex items-center">
                            <Eye className="h-4 w-4 ml-2" />
                            عرض الملف الشخصي
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onView?.(employee)}>
                          <Eye className="h-4 w-4 ml-2" />
                          عرض سريع
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(employee)}>
                          <Pencil className="h-4 w-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportPDF?.(employee)}>
                          <FileText className="h-4 w-4 ml-2" />
                          تصدير PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(employee)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {employees.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>عرض</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>من أصل {employees.length} موظف</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages || 1}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
