'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { listDepartments } from '@/lib/api/departments'
import { addEmployee as apiAddEmployee } from '@/lib/api/employees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, Check, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import type { Employee, PaymentStatus } from '@/lib/types'

interface ImportedRow {
  employee_id?: string
  full_name?: string
  department?: string
  salary?: number
  withdrawals?: number
  remaining?: number
  work_hours?: number
  payment_status?: string
}

export default function ImportPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<Partial<Employee>[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    listDepartments().then(res => { if (!res.error && res.data) setDepartments(res.data) })
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsLoading(true)
    setErrors([])

    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet)

      const validationErrors: string[] = []
      const parsedData: Partial<Employee>[] = jsonData.map((row, index) => {
        // Validate required fields
        if (!row.employee_id) {
          validationErrors.push(`صف ${index + 2}: الرقم الوظيفي مطلوب`)
        }
        if (!row.full_name) {
          validationErrors.push(`صف ${index + 2}: الاسم مطلوب`)
        }

        // Map payment status
        let paymentStatus: PaymentStatus = 'processing'
        if (row.payment_status) {
          const status = row.payment_status.toLowerCase()
          if (status === 'bank_transfer' || status === 'تحويل بنكي') {
            paymentStatus = 'bank_transfer'
          } else if (status === 'cash' || status === 'كاش') {
            paymentStatus = 'cash'
          }
        }

        // Find department
        const dept = departments.find(d => 
          d.name === row.department || 
          d.name.includes(row.department || '')
        )

        return {
          employeeId: row.employee_id || `E${Date.now()}`,
          fullName: row.full_name || 'غير معروف',
          department: row.department || 'إدارة',
          departmentId: dept?.id,
          baseSalary: Number(row.salary) || 0,
          withdrawals: Number(row.withdrawals) || 0,
          workHours: Number(row.work_hours) || 0,
          paymentStatus,
          role: 'employee' as const,
        }
      })

      setErrors(validationErrors)
      setPreviewData(parsedData)
    } catch (error) {
      toast.error('حدث خطأ في قراءة الملف')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [departments])

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('لا توجد بيانات للاستيراد')
      return
    }

    if (errors.length > 0) {
      toast.error('يرجى إصلاح الأخطاء قبل الاستيراد')
      return
    }

    setIsLoading(true)
    try {
      const promises = previewData.map(p => apiAddEmployee(p))
      await Promise.all(promises)
      toast.success(`تم استيراد ${previewData.length} موظف بنجاح`)
      setFile(null)
      setPreviewData([])
    } catch (err) {
      console.error(err)
      toast.error('فشل استيراد بعض السجلات')
    } finally {
      setIsLoading(false)
    }
  }

  const clearAll = () => {
    setFile(null)
    setPreviewData([])
    setErrors([])
  }

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="استيراد Excel" 
        description="استيراد بيانات الموظفين من ملف Excel"
      />
      
      <div className="p-6 space-y-6">
        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed bg-card p-8"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">رفع ملف Excel</h3>
            <p className="text-sm text-muted-foreground mb-4">
              اسحب الملف هنا أو اضغط للاختيار
            </p>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="max-w-xs"
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                الملف المحدد: {file.name}
              </p>
            )}
          </div>
        </motion.div>

        {/* Expected Format */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card p-6"
        >
          <h3 className="text-lg font-semibold mb-4">الأعمدة المتوقعة</h3>
          <div className="flex flex-wrap gap-2">
            {['employee_id', 'full_name', 'department', 'salary', 'withdrawals', 'remaining', 'work_hours', 'payment_status'].map(col => (
              <Badge key={col} variant="secondary" className="font-mono">
                {col}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Errors */}
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive">أخطاء في البيانات</h3>
            </div>
            <ul className="space-y-1 text-sm">
              {errors.map((error, i) => (
                <li key={i} className="text-destructive">{error}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Preview */}
        {previewData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border bg-card overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">معاينة البيانات ({previewData.length} موظف)</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearAll}>
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button onClick={handleImport} disabled={errors.length > 0}>
                  <Check className="h-4 w-4 ml-2" />
                  استيراد
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">الرقم الوظيفي</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">القسم</TableHead>
                    <TableHead className="text-right">الراتب</TableHead>
                    <TableHead className="text-right">السحوبات</TableHead>
                    <TableHead className="text-right">ساعات العمل</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{row.employeeId}</TableCell>
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.baseSalary?.toLocaleString()} ₪</TableCell>
                      <TableCell>{row.withdrawals?.toLocaleString()} ₪</TableCell>
                      <TableCell>{row.workHours}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {row.paymentStatus === 'bank_transfer' ? 'تحويل بنكي' :
                           row.paymentStatus === 'cash' ? 'كاش' : 'قيد المعالجة'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {previewData.length > 10 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                يتم عرض أول 10 صفوف فقط. الإجمالي: {previewData.length} موظف
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
